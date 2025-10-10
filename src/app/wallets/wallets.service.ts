import { AuthUser, Document, DocumentResult } from '@app/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from '@app/helpers';
import { HttpClientService } from '@app/services';
import { User } from '@app/users/entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import * as bcrypt from 'bcrypt';
import Big from 'big.js';
import { nanoid } from 'nanoid';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  TypeORMError,
} from 'typeorm';
import { Account, Beneficiary, Transaction, Wallets } from './entities';
import {
  cache,
  convert,
  convertResponse,
  fetchRatesResponse,
  fiatRatesResponse,
  findManyBeneficiary,
  findManyTransaction,
  findOneBeneficiary,
  findOneTransaction,
  funding,
  getEncryptedData,
  internalTransfer,
  saveBeneficiary,
  transactionStatus,
  transactionType,
  txnHistory,
  usdcResponse,
  virtualAccountResponse,
  walletStatus,
  walletSymbol,
} from './input';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);
  private readonly coingeckoBase = 'https://api.coingecko.com/api/v3';
  private readonly fiatUrl = 'https://open.er-api.com/v6/latest';
  private cache: cache = { timestamp: 0, rates: null };
  private cryptoMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
  };

  private fiatCurrencies = ['USD', 'NGN', 'EUR', 'GBP'];

  constructor(
    @InjectRepository(Wallets) private readonly walletRepo: Repository<Wallets>,
    @InjectRepository(Transaction)
    private readonly transRepo: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Beneficiary)
    private readonly beneficiary: Repository<Beneficiary>,
    private readonly dataSource: DataSource,
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService,
  ) {}

  async createVirtualAccount(user: AuthUser) {
    try {
      const findUser = await this.userRepo.findOne({ where: { id: user.id } });
      if (!findUser) throw new ForbiddenException('User not found');

      const haveNairaAccount = await this.accountRepo.findOne({
        where: { userId: user.id },
      });

      if (haveNairaAccount) {
        throw new ForbiddenException('This account already have Naira account');
      }

      const reference = nanoid(10);
      const response = await this.httpClient.postData<virtualAccountResponse>({
        uri: 'https://seerbitapi.com/api/v2/virtual-accounts',
        body: {
          publicKey: this.configService.getOrThrow('SEERBIT_PUBLIC_API'),
          fullName: findUser.fullName,
          bankVerificationNumber: '',
          currency: 'NGN',
          country: 'NG',
          reference,
          email: findUser.email,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.configService.getOrThrow('SEERBIT_ENCRYPTED_KEY')}`,
        },
      });

      if (response.status !== 'SUCCESS') {
        throw new BadRequestException('Error creating virtual account');
      }

      const createAccount = this.accountRepo.create({
        ...response.data.payments,
        userId: user.id,
        user: findUser,
      });

      return this.accountRepo.save(createAccount);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  async internalTransfer(dto: internalTransfer, user: AuthUser) {
    return this.dataSource.manager.transaction(async (manager) => {
      // check user password
      const findUser = await manager
        .createQueryBuilder(User, 'user')
        .addSelect('user.transactionPin')
        .where('user.email = :email', { email: user.email.toLowerCase() })
        .getOne();

      if (!findUser || !findUser.transactionPin) {
        throw new ForbiddenException('transaction pin not set');
      }

      const isMatch = await bcrypt.compare(
        dto.transactionPin,
        findUser.transactionPin,
      );

      if (!isMatch) {
        throw new ForbiddenException('Incorrect transaction pin');
      }

      // Idempotency: prevent double processing
      const existingTx = await this.checkIdempotency(dto.idempotency, manager);
      if (existingTx) {
        return {
          success: true,
          alreadyProcessed: true,
          transaction: existingTx,
        };
      }

      const reference = nanoid(20);

      // Fetch & lock sender wallet
      const senderWallet = await this.lockAndFetchWallet(
        user.id,
        dto.senderCurrency,
        manager,
        true,
      );
      if (!senderWallet) {
        throw new ForbiddenException(
          'Insufficient balance or account is under investigation',
        );
      }
      if (!Big(senderWallet.balance).gte(Big(dto.amount))) {
        throw new ForbiddenException('Insufficient balance');
      }

      // Fetch recipient user
      const recipient = await manager.findOne(User, {
        where: { username: dto.username },
      });
      if (!recipient) {
        throw new ForbiddenException('Recipient user not found');
      }

      // Debit sender
      const senderNewBal = await this.applyWalletDelta(
        senderWallet,
        -dto.amount,
        manager,
      );

      // Credit recipient
      let recipientWallet = await this.lockAndFetchWallet(
        recipient.id,
        dto.recipientCurrency,
        manager,
        false,
      );
      const recipientPrevBal = recipientWallet ? recipientWallet.balance : 0;

      const senderAmount = dto.amount;

      if (dto.senderCurrency !== dto.recipientCurrency) {
        // Convert amount based on cached rates
        const rates = await this.getCachedRates();
        const conversion = this.convertFromRates(
          {
            amount: dto.amount,
            from: dto.senderCurrency,
            to: dto.recipientCurrency,
          },
          rates,
        );
        dto.amount = conversion.converted;
      }

      if (!recipientWallet) {
        recipientWallet = manager.create(Wallets, {
          currency: dto.recipientCurrency,
          user: { id: recipient.id },
          balance: dto.amount,
        });
        await manager.save(Wallets, recipientWallet);
      } else {
        await this.applyWalletDelta(recipientWallet, dto.amount, manager);
      }

      // save as beneficiary
      if (dto.beneficiary) {
        await this.saveBeneficiary(
          { recipient, userId: user.id, internal: true },
          manager,
        );
      }

      // Log histories
      const transferDesc = `Transfer ${senderAmount} ${dto.senderCurrency} from ${user.username ?? findUser.fullName} to ${recipient.username}`;
      await this.logTransactionHistory(
        {
          amount: senderAmount,
          userId: user.id,
          type: transactionType.tra,
          wallet: senderWallet,
          reference,
          idempotency: dto.idempotency,
          previousBal: senderWallet.balance,
          currentBal: senderNewBal,
          status: transactionStatus.success,
          description: transferDesc,
          recipient: recipient,
        },
        manager,
      );

      await this.logTransactionHistory(
        {
          amount: dto.amount,
          userId: recipient.id,
          type: transactionType.tra,
          wallet: recipientWallet,
          reference,
          previousBal: recipientPrevBal,
          currentBal: Big(recipientPrevBal).add(dto.amount).toNumber(),
          status: transactionStatus.success,
          description: `Received ${dto.amount} ${dto.recipientCurrency} from ${user.username ?? findUser.fullName}`,
        },
        manager,
      );

      return {
        success: true,
        transactionReference: reference,
        sender: { id: user.id, balance: senderNewBal },
        recipient: {
          id: recipient.id,
          balance: Big(recipientPrevBal).add(dto.amount).toNumber(),
        },
      };
    });
  }

  async adjustWallet(user: AuthUser, type: transactionType, data: funding) {
    return this.dataSource.manager.transaction(async (manager) => {
      // Idempotency check
      if (data.idempotency) {
        const idempotent = await this.checkIdempotency(
          data.idempotency,
          manager,
        );
        if (idempotent) {
          return {
            success: true,
            alreadyProcessed: true,
            transaction: idempotent,
          };
        }
      }

      if (type === transactionType.dep) {
        return this.fundWallet(user, data, manager);
      } else if (type === transactionType.wit) {
        return this.debitWallet(user, data, manager);
      } else {
        throw new BadRequestException('Invalid transaction type');
      }
    });
  }

  async convert(dto: convert): Promise<convertResponse> {
    // For direct one-time conversions (not cached)
    const rates = await this.getCachedRates();
    const result = this.convertFromRates(
      { amount: dto.amount, from: dto.from, to: dto.to },
      rates,
    );

    return result;
  }

  async userBalance(user: AuthUser) {
    let totalUsd = 0;
    const walletSummaries = [];

    // Define all wallet types app supports
    const supportedCurrencies = ['NGN', 'STP', 'USDC'];

    try {
      const userWallets = await this.walletRepo.find({
        where: { user: { id: user.id } },
      });

      // ✅ Fetch cached rates once
      const rates = await this.getCachedRates();

      // Convert each wallet balance to USD
      for (const wallet of userWallets) {
        const { balance, currency } = wallet;
        const usdValue = this.convertFromRates(
          { amount: balance, from: currency, to: 'USD' },
          rates,
        );

        walletSummaries.push({
          currency,
          balance,
          usdValue: Number(usdValue.converted.toFixed(2)),
        });

        totalUsd += usdValue.converted;
      }

      // ✅ Add missing wallets with zero balances
      for (const currency of supportedCurrencies) {
        const exists = walletSummaries.find((w) => w.currency === currency);
        if (!exists) {
          walletSummaries.push({
            currency,
            balance: 0,
            usdValue: 0,
          });
        }
      }

      // Sort the wallets in the defined order
      walletSummaries.sort(
        (a, b) =>
          supportedCurrencies.indexOf(a.currency) -
          supportedCurrencies.indexOf(b.currency),
      );

      // Transform array to object keyed by currency
      const walletsObj = walletSummaries.reduce(
        (acc, w) => {
          acc[w.currency] = { balance: w.balance, usdValue: w.usdValue };
          return acc;
        },
        {} as Record<string, { balance: number; usdValue: number }>,
      );

      return {
        totalUsd: Number(totalUsd.toFixed(2)),
        wallets: walletsObj,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException('Error fetching wallet balances');
      }
      throw error;
    }
  }

  async findManyTransaction(
    query: findManyTransaction,
  ): Promise<DocumentResult<Transaction>> {
    try {
      const where = this.filterTransactions(query);
      const qb = this.transRepo.createQueryBuilder('transaction');
      buildFindManyQuery(
        qb,
        'transaction',
        where,
        query.search,
        [],
        query.include,
        query.sort,
      );

      return FindManyWrapper(qb, query.page, query.limit);
    } catch (error) {
      if (error instanceof TypeORMError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findOneTransaction(
    query: findOneTransaction,
  ): Promise<Document<Transaction>> {
    try {
      const { include, sort, ...filters } = query;

      return FindOneWrapper<Transaction>(this.transRepo, {
        include,
        sort,
        filters,
      });
    } catch (error) {
      if (error instanceof TypeORMError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findManyBeneficiary(
    query: findManyBeneficiary,
  ): Promise<DocumentResult<Beneficiary>> {
    try {
      const where = this.filterBeneficiary(query);
      const qb = this.beneficiary.createQueryBuilder('beneficiary');
      buildFindManyQuery(
        qb,
        'beneficiary',
        where,
        query.search,
        [
          'accountName',
          'bankName',
          'accountNumber',
          'recipient.fullName',
          'recipient.username',
          'recipient.email',
        ],
        query.include,
        query.sort,
        ['accountNumber'],
      );

      return FindManyWrapper(qb, query.page, query.limit);
    } catch (error) {
      if (error instanceof TypeORMError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findOneBeneficiary(
    query: findOneBeneficiary,
  ): Promise<Document<Beneficiary>> {
    try {
      const { include, sort, ...filters } = query;

      return FindOneWrapper<Beneficiary>(this.beneficiary, {
        include,
        sort,
        filters,
      });
    } catch (error) {
      if (error instanceof TypeORMError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async getEncryptedKey() {
    try {
      const response = await this.httpClient.postData<getEncryptedData>({
        uri: 'https://seerbitapi.com/api/v2/virtual-accounts',
        body: {
          key: `${this.configService.getOrThrow('SEERBIT_PRIVATE_API')}.${this.configService.getOrThrow('SEERBIT_PUBLIC_API')}`,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(response);
      return response;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  // Deposit funds into user's wallet.
  private async fundWallet(
    user: AuthUser,
    data: funding,
    manager: EntityManager,
  ) {
    // Try to fetch wallet with lock; if not found, create it.
    let wallet = await this.lockAndFetchWallet(
      user.id,
      data.currency,
      manager,
      false,
    );
    const previousBal = wallet ? wallet.balance : 0;

    if (!wallet) {
      wallet = manager.create(Wallets, {
        user: { id: user.id },
        currency: data.currency,
        balance: data.amount,
      });
      await manager.save(Wallets, wallet);
    } else {
      await this.applyWalletDelta(wallet, data.amount, manager);
    }

    const reference = nanoid(20);

    // Log transaction history
    await this.logTransactionHistory(
      {
        amount: data.amount,
        userId: user.id,
        type: transactionType.dep,
        wallet,
        idempotency: data.idempotency,
        reference,
        previousBal,
        currentBal: Big(previousBal).add(data.amount).toNumber(),
        status: transactionStatus.success,
        description: `Funded wallet with ${data.amount} ${data.currency}`,
      },
      manager,
    );

    return { success: true, reference, newBalance: wallet.balance };
  }

  // Debit (withdraw) funds from user's wallet.
  private async debitWallet(
    user: AuthUser,
    data: funding,
    manager: EntityManager,
  ) {
    const wallet = await this.lockAndFetchWallet(
      user.id,
      data.currency,
      manager,
      true,
    );
    if (!wallet) {
      throw new ForbiddenException('No valid wallet to debit.');
    }
    if (!Big(wallet.balance).gte(Big(data.amount))) {
      throw new ForbiddenException('Insufficient balance for withdrawal.');
    }

    const previousBal = wallet.balance;
    await this.applyWalletDelta(wallet, -data.amount, manager);
    const reference = nanoid(20);

    await this.logTransactionHistory(
      {
        amount: data.amount,
        userId: user.id,
        type: transactionType.wit,
        wallet,
        idempotency: data.idempotency,
        reference,
        previousBal,
        currentBal: Big(previousBal).sub(data.amount).toNumber(),
        status: transactionStatus.success,
        description: `Debited ${data.amount} ${data.currency} from wallet`,
      },
      manager,
    );

    return { success: true, reference, newBalance: wallet.balance };
  }

  //  Check if transaction with idempotency key exists
  private async checkIdempotency(idempotency: string, manager: EntityManager) {
    if (!idempotency) return null;
    return manager.findOne(Transaction, { where: { idempotency } });
  }

  //  Fetch and lock wallet, optionally require active status
  private async lockAndFetchWallet(
    userId: string,
    currency: walletSymbol,
    manager: EntityManager,
    enforceStatus: boolean,
  ) {
    const where = {
      user: { id: userId },
      currency,
      ...(enforceStatus && {
        status: In([walletStatus.active, walletStatus.warning]),
      }),
    };

    return manager.findOne(Wallets, {
      where,
      lock: { mode: 'pessimistic_write' },
    });
  }

  //  Apply delta (positive for credit, negative for debit), persist and return new balance
  private async applyWalletDelta(
    wallet: Wallets,
    delta: number,
    manager: EntityManager,
  ) {
    const newBal = Big(wallet.balance).add(delta).toNumber();
    if (newBal < 0) throw new ForbiddenException('Balance cannot be negative');
    await manager.update(Wallets, { id: wallet.id }, { balance: newBal });
    wallet.balance = newBal;
    return newBal;
  }

  //  Unified transaction history logging
  private async logTransactionHistory(
    data: txnHistory,
    manager: EntityManager,
  ) {
    // Optionally, pass logger in for audit trail
    try {
      const history = manager.create(Transaction, {
        ...data,
        wallet: { id: data.wallet.id },
      });
      return await manager.save(Transaction, history);
    } catch (error) {
      this.logger.error('Error logging transaction history', error.stack);
      if (error instanceof TypeORMError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  // save beneficiary
  private async saveBeneficiary(data: saveBeneficiary, manager: EntityManager) {
    try {
      const where: Record<string, any> = {};

      if (data.accountNumber) {
        where.accountNumber = data.accountNumber;
      } else if (data.recipient?.id) {
        where.recipient = { id: data.recipient.id };
      } else {
        throw new InternalServerErrorException('No search criteria provided');
      }

      const findIfExisted = await manager.findOne(Beneficiary, { where });

      if (findIfExisted) return findIfExisted;

      const saved = manager.create(Beneficiary, data);
      return await manager.save(Beneficiary, saved);
    } catch (error) {
      if (error instanceof TypeORMError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async getCachedRates(): Promise<fetchRatesResponse> {
    const now = Date.now();
    const cacheValid =
      this.cache.timestamp && now - this.cache.timestamp < 10 * 60 * 1000;

    if (cacheValid && this.cache.rates) return this.cache.rates;

    const rates = await this.fetchRates();
    this.cache = { timestamp: now, rates };
    return rates;
  }

  private convertFromRates(
    dto: convert,
    rates: fetchRatesResponse,
  ): convertResponse {
    const { fiatRates, cryptoRates } = rates;
    const fromUsd = this.getUsdValue(dto.from, fiatRates, cryptoRates);
    const toUsd = this.getUsdValue(dto.to, fiatRates, cryptoRates);
    const converted = Big(dto.amount)
      .times(Big(fromUsd))
      .div(Big(toUsd))
      .toFixed(6);

    return {
      amount: dto.amount,
      from: dto.from,
      to: dto.to,
      converted: Number(converted),
      rate: Number(Big(fromUsd).div(Big(toUsd)).toFixed(6)),
    };
  }

  private getUsdValue(
    symbol: string,
    fiatRates: fiatRatesResponse,
    cryptoPrices: usdcResponse,
  ): number {
    symbol = symbol.toUpperCase();

    if (this.fiatCurrencies.includes(symbol)) {
      return 1 / (fiatRates.rates[symbol] || (symbol === 'USD' ? 1 : 0));
    }

    // if (symbol === 'STP') {
    //   // 1000 STP = 1 USD → 1 STP = 0.001 USD
    //   return 0.001;
    // }

    if (symbol === 'STP') {
      // 1000 STP = 10 USD → 1 STP = 0.01 USD
      return 0.01;
    }

    const cryptoId = this.cryptoMap[symbol];
    if (cryptoId && cryptoPrices[cryptoId]) {
      return cryptoPrices[cryptoId].usd;
    }

    throw new ForbiddenException(`Unsupported currency: ${symbol}`);
  }

  private async fetchRates(): Promise<fetchRatesResponse> {
    try {
      const [fiatRes, cryptoRes] = await Promise.all([
        this.httpClient.fetchData<fiatRatesResponse>({
          uri: `${this.fiatUrl}/USD`,
        }),

        this.httpClient.fetchData<usdcResponse>({
          uri: `${this.coingeckoBase}/simple/price`,
          params: {
            ids: Object.values(this.cryptoMap).join(','),
            vs_currencies: 'usd,ngn',
          },
        }),
      ]);

      const fiatRates = fiatRes.data;
      const cryptoRates = cryptoRes.data;

      return { fiatRates, cryptoRates };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private filterTransactions(data: findManyTransaction) {
    const where: Record<string, any> = {};
    if (data.userId) where['userId'] = data.userId;
    if (data.type) where['type'] = { $eq: data.type };
    if (data.status) where['status'] = { $eq: data.status };
    if (data.reference) where['reference'] = data.reference;
    if (data.amount) where['amount'] = data.amount;
    if (data.recipientId) {
      where['recipient'] = { 'recipient.id': data.recipientId };
    }
    return where;
  }

  private filterBeneficiary(data: findManyBeneficiary) {
    const where: Record<string, any> = {};
    if (data.accountName) where['accountName'] = data.accountName;
    if (data.accountNumber) where['accountNumber'] = data.accountNumber;
    if (data.bankName) where['bankName'] = data.bankName;
    if (data.userId) where['userId'] = data.userId;
    if (data.internal !== undefined) where['internal'] = { $eq: data.internal };
    if (data.fullName) {
      where['recipient'] = { 'recipient.fullName': data.fullName };
    }
    if (data.username) {
      where['recipient'] = { 'recipient.username': data.username };
    }
    return where;
  }
}
