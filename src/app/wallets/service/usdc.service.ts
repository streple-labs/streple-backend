import { AuthUser } from '@app/common';
import { User } from '@app/users/entity';
import { Role } from '@app/users/interface';
import { TransactionBound } from '@app/webhooks/index';
import {
  generateEntitySecret,
  generateEntitySecretCiphertext,
  initiateDeveloperControlledWalletsClient,
  registerEntitySecretCiphertext,
} from '@circle-fin/developer-controlled-wallets';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import Big from 'big.js';
import { writeFileSync } from 'fs';
import { nanoid } from 'nanoid';
import { join } from 'path';
import { Repository } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';
import { CryptoAccounts, Transaction, WalletSet } from '../entities';
import { cryptoTransfer, transactionType } from '../input';

@Injectable()
export class USDCService {
  constructor(
    @InjectRepository(WalletSet)
    private readonly walletSetRepo: Repository<WalletSet>,
    @InjectRepository(CryptoAccounts)
    private readonly cryptoRepo: Repository<CryptoAccounts>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    @InjectRepository(Transaction)
    private readonly transRepo: Repository<Transaction>,
  ) {}

  async generate() {
    return this.generateEnSecreteAndRegister();
  }

  async createWalletForUser(name: string, user: AuthUser): Promise<string> {
    try {
      const findWalletSet = await this.walletSetRepo.findOneBy({ name });
      if (!findWalletSet) throw new NotFoundException('WalletSet not found');

      // check if user have crypto wallet before
      const hasCryptoWallet = await this.cryptoRepo.findOneBy({
        userId: user.id,
      });

      if (hasCryptoWallet) {
        throw new ForbiddenException(
          'A crypto wallet already assign to this user',
        );
      }

      const client = this.initiateDeveloper();
      const response = await client.createWallets({
        blockchains: ['BASE-SEPOLIA'], //, 'MATIC-AMOY'
        count: 1,
        accountType: 'SCA',
        walletSetId: findWalletSet.walletId,
      });

      if (response.data?.wallets) {
        const { wallets } = response.data;
        await this.cryptoRepo.save(
          this.cryptoRepo.create({
            circleId: wallets[0].id,
            state: wallets[0].state,
            walletSetId: findWalletSet.id,
            custodyType: wallets[0].custodyType,
            address: wallets[0].address,
            blockchain: wallets[0].blockchain,
            initialPublicKey: wallets[0].initialPublicKey,
            name: wallets[0].name,
            refId: wallets[0].refId,
            circleUserId: wallets[0].userId,
            userId: user.id,
            updateDate: wallets[0].updateDate,
            createDate: wallets[0].createDate,
          }),
        );
      }
      return 'Crypto Wallet created Successfully';
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async createWalletSet(walletName: string = 'testing'): Promise<string> {
    try {
      const findWallet = await this.walletSetRepo.findOneBy({
        name: walletName,
      });
      if (findWallet) {
        throw new ForbiddenException('Wallet Name already existed');
      }

      const client = this.initiateDeveloper();
      const response = await client.createWalletSet({
        name: walletName,
        idempotencyKey: uuidV4(),
      });

      if (response.data?.walletSet) {
        const { walletSet } = response.data;
        await this.walletSetRepo.save(
          this.walletSetRepo.create({
            walletId: walletSet.id,
            name: walletName,
            custodyType: 'DEVELOPER',
            createDate: walletSet.createDate,
            updateDate: walletSet.updateDate,
          }),
        );
      }

      return 'walletSet created successfully';
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async userWalletBalance(user: AuthUser) {
    try {
      const userWallet = await this.cryptoRepo.findOneBy({
        userId: user.id,
      });

      if (!userWallet) {
        throw new NotFoundException(
          'User wallet not found or Wallet has not be created yet',
        );
      }
      const client = this.initiateDeveloper();
      const response = await client.getWalletTokenBalance({
        id: userWallet.circleId, //id of the generated wallet
      });

      // console.log(response.data);

      return { balances: response.data?.tokenBalances, wallet: userWallet };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async createCryptoTransaction(dto: cryptoTransfer, user: AuthUser) {
    try {
      const { amount, walletAddress, feeLevel, transactionPin } = dto;

      const { balances, wallet } = await this.userWalletBalance(user);
      if (!balances || !balances.length) {
        throw new ForbiddenException('User balance not found');
      }

      const previousBal = Big(balances[0].amount);
      if (previousBal.lt(Big(amount))) {
        throw new ForbiddenException('Insufficient Balance');
      }

      const currentBal = previousBal.minus(Big(amount));
      if (currentBal.lt(Big(0))) {
        throw new ForbiddenException('Insufficient Balance');
      }

      // check user password
      const findUser = await this.userRepo
        .createQueryBuilder('user')
        .addSelect('user.transactionPin')
        .where('user.email = :email', { email: user.email.toLowerCase() })
        .getOne();

      if (!findUser || !findUser.transactionPin) {
        throw new ForbiddenException('transaction pin not set');
      }

      const isMatch = await bcrypt.compare(
        transactionPin,
        findUser.transactionPin,
      );

      if (!isMatch) {
        throw new ForbiddenException('Incorrect transaction pin');
      }

      const client = this.initiateDeveloper();
      const response = await client.createTransaction({
        walletId: wallet.circleId,
        tokenId: balances[0].token.id,
        destinationAddress: walletAddress,
        amount: [amount],
        fee: { type: 'level', config: { feeLevel } },
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @OnEvent('tnx.outbound')
  async HandleTransactionOutBound(payload: TransactionBound) {
    const transaction = await this.transRepo.findOneBy({
      externalRef: payload.notification.id,
    });

    if (transaction) {
      await this.transRepo.update(
        { externalRef: payload.notification.id },
        { status: payload.notification.state },
      );
      return;
    }

    const [sender, receiver] = await Promise.all([
      this.cryptoRepo.findOne({
        where: {
          address: payload.notification.sourceAddress,
        },
        relations: ['user'],
      }),

      this.cryptoRepo.findOne({
        where: {
          address: payload.notification.destinationAddress,
        },
        relations: ['user'],
      }),
    ]);

    const amt = Big(payload.notification.amounts[0]).toNumber();
    if (sender) {
      const user: AuthUser = {
        email: sender.user.email,
        username: sender.user.username,
        role: sender.user.role ?? Role.follower,
        roleLevel: sender.user.roleLevel,
        id: sender.user.id,
      };
      const { balances } = await this.userWalletBalance(user);
      if (!balances || !balances.length) {
        throw new ForbiddenException('User balance not found');
      }

      const currentBal = Big(balances[0].amount);
      const previousBal = currentBal.add(Big(amt)).toNumber();
      const transferDesc = `${receiver ? 'Transfer' : 'Withdraw'} ${amt} USDC to ${payload.notification.destinationAddress}`;

      await this.transRepo.save(
        this.transRepo.create({
          amount: amt,
          currentBal: currentBal.toNumber(),
          description: transferDesc,
          previousBal,
          reference: nanoid(20),
          status: payload.notification.state,
          type: receiver ? transactionType.tra : transactionType.wit,
          userId: sender.user.id,
          recipient: receiver?.user,
        }),
      );
    }
  }

  @OnEvent('tnx.inbound')
  async HandleTransactionInBound(payload: TransactionBound) {
    const findWallet = await this.cryptoRepo.findOne({
      where: {
        address: payload.notification.destinationAddress,
      },
      relations: ['user'],
    });

    if (!findWallet) return;

    const findTransaction = await this.transRepo.findOneBy({
      externalRef: payload.notification.id,
    });

    if (!findTransaction) {
      const { user } = findWallet;
      const amount = Big(payload.notification.amounts[0]).toNumber();
      const { balances: bal } = await this.userWalletBalance({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role ?? Role.follower,
        roleLevel: user.roleLevel,
      });
      const previous = Big(bal?.[0].amount ?? 0).toNumber();
      const current = Big(amount).add(Big(previous)).toNumber();
      return this.transRepo.save(
        this.transRepo.create({
          amount,
          currentBal: current,
          description: `Received ${amount} USDC from ${payload.notification.sourceAddress}`,
          previousBal: previous,
          reference: nanoid(20),
          status: payload.notification.state,
          type: transactionType.dep,
          userId: findWallet.userId,
          txHash: payload.notification.txHash,
          networkFee: payload.notification.networkFee,
          userOpHash: payload.notification.userOpHash,
          errorDetails: JSON.stringify(payload.notification.errorDetails),
        }),
      );
    }
    await this.transRepo.update(
      { externalRef: payload.notification.id },
      {
        status: payload.notification.state,
        txHash: payload.notification.txHash,
        networkFee: payload.notification.networkFee,
        userOpHash: payload.notification.userOpHash,
        errorDetails: JSON.stringify(payload.notification.errorDetails),
      },
    );
    return;
  }

  @OnEvent('web.text')
  HandleWebhookTest(payload: any) {
    console.log(payload);
  }

  private initiateDeveloper() {
    return initiateDeveloperControlledWalletsClient({
      apiKey: this.configService.getOrThrow('CIRCLE_API_KEY'),
      entitySecret: this.configService.getOrThrow('CIRCLE_ENTITY_SECRET'),
    });
  }

  private async generateEnSecretCiphertext(entitySecret: string) {
    // This will generate the Entity Secret Ciphertext.
    return await generateEntitySecretCiphertext({
      apiKey: this.configService.getOrThrow('CIRCLE_API_KEY'),
      entitySecret,
    });
  }

  private generateSecret() {
    // This will print out a new entity secret and sample code to register the entity secret
    const entitySecret = generateEntitySecret();
    console.log(entitySecret);
  }

  private async generateEnSecreteAndRegister(): Promise<string> {
    try {
      const recoveryDir = process.cwd();
      //this register your Entity Secret.
      const response = await registerEntitySecretCiphertext({
        apiKey: this.configService.getOrThrow('CIRCLE_API_KEY'),
        entitySecret: this.configService.getOrThrow('CIRCLE_ENTITY_SECRET'),
        recoveryFileDownloadPath: recoveryDir,
      });
      // Save recovery file manually (optional)
      if (response.data?.recoveryFile) {
        writeFileSync(
          join(recoveryDir, 'recovery_file.dat'),
          response.data.recoveryFile,
        );
      }

      return '✅ Entity registered successfully';
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
