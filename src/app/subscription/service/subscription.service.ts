import { BalanceService } from '@app/balance/balance.service';
import {
  BalanceMode,
  BalanceType,
  Source,
  TransactionStatus,
  TransactionType,
} from '@app/balance/interface';
import { AuthUser, DocumentResult } from '@app/common';
import { buildFindManyQuery, FindManyWrapper } from '@app/helpers';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Big from 'big.js';
import { addMonths } from 'date-fns';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { Subscription, SubscriptionHistory } from '../entities';
import { createSub, findManySubscription, SubscriptionStatus } from '../input';
import { DataInput, SubscriptionJobService } from './job.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionHistory)
    private readonly historyRepository: Repository<SubscriptionHistory>,
    private readonly balance: BalanceService,
    @Inject(forwardRef(() => SubscriptionJobService))
    private readonly schedulerService: SubscriptionJobService,
    private dataSource: DataSource,
  ) {}

  async createSubscription(
    create: createSub,
    user: AuthUser,
  ): Promise<Subscription> {
    const savedSubscription = await this.dataSource.manager.transaction(
      'REPEATABLE READ',
      async (manager) => {
        const price = Big(20);

        const currentPeriodStart = new Date();
        const currentPeriodEnd = addMonths(currentPeriodStart, 1);

        // 1. find if their is any active subscription
        const activeSubscription = await this.getActiveSubscription(user);
        if (activeSubscription) {
          throw new ForbiddenException('You have an active subscription');
        }

        // 2. funding check
        const balance = await this.balance.userBalance(
          { mode: BalanceMode.demo, type: BalanceType.funding },
          user,
        );
        if (!balance.length || Big(balance[0].balance).lt(price)) {
          throw new ForbiddenException('Insufficient funds');
        }

        // 3. charge the wallet
        await this.balance.transactionOnDemo(
          {
            amount: price.toNumber(),
            description: 'Monthly subscription fee',
            mode: BalanceMode.demo,
            type: BalanceType.funding,
            transactionType: TransactionType.withdraw,
            idempotencyKey: create.idempotencyKey,
            source: Source.sub,
            status: TransactionStatus.successful,
          },
          user,
          manager,
        );

        // 4. create subscription
        const subscription = manager.create(Subscription, {
          userId: user.id,
          currentPeriodStart,
          currentPeriodEnd,
          price: price.toNumber(),
          status: SubscriptionStatus.active,
        });

        // 5. save the subscription
        const saved = await manager.save(subscription);

        // 6. audit trail
        await this.createHistoryRecord(saved, 'subscription_created');

        return saved;
      },
    );
    // 7. schedule expiry job
    const delay = savedSubscription.currentPeriodEnd.getTime() - Date.now();
    const scheduleId = this.schedulerService.scheduleStatusEnd(
      {
        subscriptionId: savedSubscription.id,
        status: SubscriptionStatus.expired,
      },
      delay,
    );

    savedSubscription.scheduleId = scheduleId;
    await this.dataSource.manager.save(savedSubscription);

    return savedSubscription;
  }

  async cancelSubscription(
    user: AuthUser,
    reason?: string,
  ): Promise<Subscription> {
    const subscription = await this.getActiveSubscription(user);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const currentPeriodEnd = subscription.currentPeriodEnd;

    const delay = new Date(currentPeriodEnd).getTime() - Date.now();

    if (subscription.scheduleId) {
      this.schedulerService.cancelJob(subscription.scheduleId);
    }

    const schedule = this.schedulerService.scheduleStatusEnd(
      {
        subscriptionId: subscription.id,
        status: SubscriptionStatus.canceled,
      },
      delay,
    );

    subscription.canceledAt = new Date();
    subscription.scheduleId = schedule;

    const canceledSubscription =
      await this.subscriptionRepository.save(subscription);

    await this.createHistoryRecord(
      canceledSubscription,
      'subscription_canceled',
      reason || 'User initiated cancellation',
    );

    return canceledSubscription;
  }

  async getUserSubscriptions(
    query: findManySubscription,
  ): Promise<DocumentResult<Subscription>> {
    const qb = this.subscriptionRepository.createQueryBuilder('subscription');
    buildFindManyQuery(
      qb,
      'subscription',
      this.filter(query),
      query.search,
      [],
      query.include,
      query.sort,
    );
    return FindManyWrapper(qb, query.page, query.limit);
  }

  async getSubscriptionHistory(
    query: findManySubscription,
  ): Promise<DocumentResult<SubscriptionHistory>> {
    const qb = this.historyRepository.createQueryBuilder('history');
    buildFindManyQuery(
      qb,
      'history',
      this.filter(query),
      query.search,
      [],
      query.include,
      query.sort,
    );
    return FindManyWrapper(qb, query.page, query.limit);
  }

  async getActiveSubscription(user: AuthUser): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: {
        userId: user.id,
        status: SubscriptionStatus.active,
      },
    });
  }

  async systemUpdate(data: DataInput) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: data.subscriptionId },
    });

    if (!subscription) return;

    subscription.status = data.status;

    const updateSubscription =
      await this.subscriptionRepository.save(subscription);

    void this.repairMissingSchedules();

    const historys = await this.historyRepository.find({
      where: { subscriptionId: subscription.id },
    });

    if (historys.length) {
      for (const history of historys) {
        history.status = data.status;
        await this.historyRepository.save(history);
      }
    }

    if (data.status !== SubscriptionStatus.canceled) {
      await this.createHistoryRecord(
        updateSubscription,
        `subscription_${data.status}`,
        data.reason || 'User subscription expired',
      );
    }
    return updateSubscription;
  }

  async repairMissingSchedules(): Promise<void> {
    // Find all active subscriptions without a scheduleId, that haven't expired yet
    const now = new Date();
    const orphanedSubs = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.active,
        scheduleId: In([undefined, null]),
        currentPeriodEnd: MoreThan(now), // Get only not-yet-expired
      },
    });

    if (!orphanedSubs.length) return;

    for (const sub of orphanedSubs) {
      const jobId = this.schedulerService.scheduleNoDelay({
        subscriptionId: sub.id,
        status: SubscriptionStatus.expired,
      });

      // Update the scheduleId
      sub.scheduleId = jobId;
      await this.subscriptionRepository.save(sub);
    }
  }

  private filter(query: findManySubscription) {
    const filter: Record<string, any> = {};

    if (query.userId) filter['userId'] = query.userId;
    if (query.plan) filter['plan'] = query.plan;
    if (query.status) filter['status'] = query.status;

    return filter;
  }

  private async createHistoryRecord(
    subscription: Subscription,
    action: string,
    changeReason?: string,
  ): Promise<void> {
    const historyRecord = this.historyRepository.create({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      price: subscription.price,
      changeReason: changeReason || action,
      metadata: {
        action,
        timestamp: new Date().toISOString(),
      },
    });

    await this.historyRepository.save(historyRecord);
  }
}
