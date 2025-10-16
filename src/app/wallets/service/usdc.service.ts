import { AuthUser } from '@app/common';
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
import { InjectRepository } from '@nestjs/typeorm';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';
import { CryptoAccounts, WalletSet } from '../entities';

@Injectable()
export class USDCService {
  constructor(
    @InjectRepository(WalletSet)
    private readonly walletSetRepo: Repository<WalletSet>,
    @InjectRepository(CryptoAccounts)
    private readonly cryptoRepo: Repository<CryptoAccounts>,
    private readonly configService: ConfigService,
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

      console.log(response.data);

      return { balances: response.data?.tokenBalances, wallet: userWallet };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async createCryptoTransaction(
    amount: string,
    walletAddress: string,
    user: AuthUser,
  ) {
    try {
      const { balances, wallet } = await this.userWalletBalance(user);
      if (!balances || !balances.length) {
        throw new ForbiddenException('User balance not found');
      }

      // TODO check for amount

      const client = this.initiateDeveloper();
      const response = await client.createTransaction({
        walletId: wallet.circleId,
        tokenId: balances[0].token.id,
        destinationAddress: walletAddress,
        amount: [amount],
        fee: {
          type: 'level',
          config: {
            feeLevel: 'HIGH',
          },
        },
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
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
