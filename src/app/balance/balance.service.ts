import { AuthUser, Document, DocumentResult } from '@app/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from '@app/helpers';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Big from 'big.js';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Balance, Transactions } from './entities';
import {
  BalanceMode,
  BalanceStatus,
  BalanceType,
  findManyTransaction,
  findOneTransaction,
  newTransaction,
  Source,
  TransactionStatus,
  TransactionType,
  transfer,
  userBalance,
} from './interface';
import { v4 as uuidv4 } from 'uuid';

// Set global Big.js configuration
Big.DP = 20; // Decimal places
Big.RM = Big.roundHalfUp; // Rounding mode

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);
  constructor(
    @InjectRepository(Balance)
    private readonly balanceModel: Repository<Balance>,
    @InjectRepository(Transactions)
    private readonly transactionModel: Repository<Transactions>,
    private readonly dataSource: DataSource,
  ) {}

  async transactionOnDemo(data: newTransaction, user: AuthUser) {
    this.logger.log(
      `Processing demo transaction: ${data.transactionType} for user: ${user.id}`,
    );

    // Validate input
    this.validateTransactionData(data);

    // Check idempotency
    const existing = await this.checkIdempotency(user, data.idempotencyKey);
    if (existing) {
      this.logger.log(
        `Idempotent transaction detected: ${data.idempotencyKey}`,
      );
      return { alreadyProcessed: true, transaction: existing };
    }

    try {
      return await this.dataSource.transaction(
        'REPEATABLE READ',
        async (manager) => {
          const amount = Big(data.amount);

          if (this.isFundingOperation(data.transactionType)) {
            await this.processFundingOperation(manager, user.id, data, amount);
          } else if (data.transactionType === TransactionType.transfer) {
            await this.processTransferOperation(manager, user.id, data, amount);
          } else {
            throw new ForbiddenException('Unknown transaction type');
          }

          // Log transaction
          const transaction = await this.logTransaction(manager, user, data);
          this.logger.log(`Demo transaction completed: ${data.idempotencyKey}`);

          return { transaction };
        },
      );
    } catch (error) {
      this.logger.error(
        `Demo transaction failed for user ${user.id}`,
        error.stack,
      );
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Transaction processing failed');
    }
  }

  async transactionOnReal(data: newTransaction, user: AuthUser) {
    this.logger.log(
      `Processing real transaction: ${data.transactionType} for user: ${user.id}`,
    );

    // Validate input
    this.validateTransactionData(data);

    // Check idempotency
    const existing = await this.checkIdempotency(user, data.idempotencyKey);
    if (existing) {
      this.logger.log(
        `Idempotent transaction detected: ${data.idempotencyKey}`,
      );
      return { alreadyProcessed: true, transaction: existing };
    }

    try {
      // Log transaction with the default status
      const transaction = await this.transactionModel.save(
        this.transactionModel.create({
          ...data,
          user: { id: user.id },
        }),
      );

      this.logger.log(`Real transaction logged: ${data.idempotencyKey}`);
      return { transaction };
    } catch (error) {
      this.logger.error(
        `Real transaction failed for user ${user.id}`,
        error.stack,
      );
      throw new InternalServerErrorException('Transaction logging failed');
    }
  }

  async updateTransactionOnReal(data: newTransaction, user: AuthUser) {
    this.logger.log(
      `Updating real transaction: ${data.idempotencyKey} for user: ${user.id}`,
    );

    try {
      return await this.dataSource.transaction(
        'REPEATABLE READ',
        async (manager) => {
          // Balance should only be credited if status is Confirmed!
          const transaction = await this.transactionModel.findOne({
            where: {
              user: { id: user.id },
              idempotencyKey: data.idempotencyKey,
            },
          });

          if (!transaction) {
            this.logger.warn(`Transaction not found: ${data.idempotencyKey}`);
            return;
          }

          if (data.status === TransactionStatus.successful) {
            const balance = await manager.findOne(Balance, {
              where: {
                user: { id: user.id },
                type: data.type,
                mode: BalanceMode.real,
                status: BalanceStatus.active,
              },
            });

            await this.updateBalance(
              manager,
              user.id,
              data.type,
              BalanceMode.real,
              data.amount,
              data.source,
              balance ? balance : undefined,
            );

            transaction.status = TransactionStatus.successful;
            await manager.save(Transactions, transaction);

            this.logger.log(
              `Real transaction completed successfully: ${data.idempotencyKey}`,
            );
            return { transaction };
          }

          this.logger.log(
            `Real transaction still pending: ${data.idempotencyKey}`,
          );
          return { pending: true, transaction };
        },
      );
    } catch (error) {
      this.logger.error(
        `Update real transaction failed for user ${user.id}`,
        error.stack,
      );
      throw new InternalServerErrorException('Transaction update failed');
    }
  }

  async userBalance(data: userBalance, user: AuthUser) {
    const filter: Record<string, any> = { user: { id: user.id } };
    if (data.mode) filter.mode = data.mode;
    if (data.type) filter.type = data.type;

    return this.balanceModel.find({ where: filter });
  }

  async transferBetweenAccount(data: transfer, user: AuthUser) {
    try {
      return await this.dataSource.transaction(
        'REPEATABLE READ',
        async (manager) => {
          const transfer: newTransaction = {
            amount: data.amount,
            fromType: data.fromAccount,
            toType: data.toAccount,
            mode: data.mode,
            description: `Transfer from ${data.fromAccount} to ${data.toAccount}`,
            source: Source.internal,
            idempotencyKey: `transfer-${uuidv4()}`,
            status: TransactionStatus.successful,
            transactionType: TransactionType.transfer,
            type: data.fromAccount,
          };
          const amount = Big(data.amount);
          await this.processTransferOperation(
            manager,
            user.id,
            transfer,
            amount,
          );
          // Log transaction
          const transaction = await this.logTransaction(
            manager,
            user,
            transfer,
          );
          this.logger.log(
            `Demo transaction completed: ${transfer.idempotencyKey}`,
          );

          return { transaction };
        },
      );
    } catch (error) {
      this.logger.error(
        `Demo transaction failed for user ${user.id}`,
        error.stack,
      );
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Transaction processing failed');
    }
  }

  findAll(query: findManyTransaction): Promise<DocumentResult<Transactions>> {
    const filters = this.filter(query);
    const qb = this.transactionModel.createQueryBuilder('transaction');
    buildFindManyQuery(
      qb,
      'transaction',
      filters,
      query.search,
      ['description', 'transactionType', 'status'],
      query.include,
      query.sort,
    );

    return FindManyWrapper(qb, query.page, query.limit);
  }

  findOne(query: findOneTransaction): Promise<Document<Transactions>> {
    const { include, sort, ...filters } = query;
    return FindOneWrapper<Transactions>(this.transactionModel, {
      include,
      sort,
      filters,
    });
  }

  private filter(query: findManyTransaction) {
    const filters: Record<string, any> = {};

    if (query.mode) {
      filters['mode'] = { $in: query.mode };
    }

    if (query.type) {
      filters['type'] = { $in: query.type };
    }

    if (query.user) {
      filters['user'] = { $in: { id: query.user } };
    }

    if (query.transactionType) {
      filters['transactionType'] = { $in: query.transactionType };
    }

    if (query.status) {
      filters['status'] = { $in: query.status };
    }

    return filters;
  }

  private async processTransferOperation(
    manager: EntityManager,
    userId: string,
    data: newTransaction,
    amount: Big,
  ): Promise<void> {
    if (!data.fromType || !data.toType) {
      throw new ForbiddenException('Transfer must specify fromType and toType');
    }

    if (data.fromType === data.toType) {
      throw new ForbiddenException('Transfer types cannot be the same');
    }

    // Find both balances
    const fromBalance = await manager.findOne(Balance, {
      where: {
        user: { id: userId },
        type: data.fromType,
        mode: data.mode,
        status: BalanceStatus.active,
      },
    });

    const toBalance = await manager.findOne(Balance, {
      where: {
        user: { id: userId },
        type: data.toType,
        mode: data.mode,
        status: BalanceStatus.active,
      },
    });

    if (!fromBalance || Big(fromBalance.balance).lt(amount)) {
      throw new ForbiddenException('Insufficient funds in the source wallet');
    }

    const newBalance = Big(fromBalance.balance).minus(amount).toString();

    let newToBalance;
    if (toBalance) {
      newToBalance = Big(toBalance?.balance).plus(amount).toString();
    }
    // Subtract from source
    await this.updateBalance(
      manager,
      userId,
      data.fromType,
      data.mode,
      newBalance,
      data.source,
      fromBalance,
    );

    // Add to destination
    await this.updateBalance(
      manager,
      userId,
      data.toType,
      data.mode,
      newToBalance ? newToBalance : amount.toString(),
      data.source,
      toBalance ? toBalance : undefined,
    );
  }

  private async logTransaction(
    manager: EntityManager,
    user: AuthUser,
    data: newTransaction,
  ): Promise<Transactions> {
    const transactionData = {
      user: { id: user.id },
      type: data.type,
      mode: data.mode,
      source: data.source,
      amount: data.amount,
      transactionType: data.transactionType,
      description: data.description,
      idempotencyKey: data.idempotencyKey,
      status: data.status,
    };

    return await manager.save(Transactions, transactionData);
  }

  private isFundingOperation(transactionType: TransactionType): boolean {
    return (
      transactionType === TransactionType.deposit ||
      transactionType === TransactionType.withdraw
    );
  }

  private async processFundingOperation(
    manager: EntityManager,
    userId: string,
    data: newTransaction,
    amount: Big,
  ): Promise<void> {
    // Find balance
    const generalBalance = await manager.findOne(Balance, {
      where: {
        user: { id: userId },
        type: BalanceType.funding,
        mode: BalanceMode.demo,
        status: BalanceStatus.active,
      },
    });

    const prevBalance = generalBalance ? Big(generalBalance.balance) : Big(0);

    let newBalance: Big;
    if (data.transactionType === TransactionType.deposit) {
      newBalance = prevBalance.plus(amount);
    } else {
      if (prevBalance.lt(amount)) {
        throw new ForbiddenException('Insufficient funds');
      }
      newBalance = prevBalance.minus(amount);
    }

    // Update or create general balance
    await this.updateBalance(
      manager,
      userId,
      BalanceType.funding,
      BalanceMode.demo,
      newBalance.toString(),
      data.source,
      generalBalance ? generalBalance : undefined,
    );
  }

  private async checkIdempotency(
    user: AuthUser,
    idempotencyKey: string,
  ): Promise<Transactions | null> {
    return await this.transactionModel.findOne({
      where: { user: { id: user.id }, idempotencyKey },
    });
  }

  private validateTransactionData(data: newTransaction): void {
    if (!data.amount || Big(data.amount).lte(0)) {
      throw new BadRequestException('Amount must be positive');
    }

    if (!data.idempotencyKey) {
      throw new BadRequestException('Idempotency key is required');
    }

    if (
      data.transactionType === TransactionType.transfer &&
      (!data.fromType || !data.toType)
    ) {
      throw new BadRequestException(
        'Transfer must specify fromType and toType',
      );
    }

    if (
      data.transactionType === TransactionType.transfer &&
      data.fromType === data.toType
    ) {
      throw new BadRequestException('Transfer types cannot be the same');
    }
  }

  private async updateBalance(
    manager: EntityManager,
    userId: string,
    type: BalanceType,
    mode: BalanceMode,
    amount: string,
    source: string,
    currentBalance?: Balance,
  ): Promise<Balance> {
    if (currentBalance) {
      currentBalance.balance = amount;
      return await manager.save(Balance, currentBalance);
    } else {
      return await manager.save(Balance, {
        user: { id: userId },
        type,
        mode,
        balance: amount,
        status: BalanceStatus.active,
        source,
      });
    }
  }
}
