import { User } from '@app/users/entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  action,
  duration,
  ITrades,
  orderType,
  outcome,
  positionSize,
  riskLevel,
  status,
  type,
} from '../input';

@Entity()
export class Trades implements ITrades {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user: User;

  @Index()
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  creator: User;

  @Index()
  @Column({ type: 'uuid', nullable: false })
  creatorId: string;

  @Index() @Column() symbol: string;

  @Column('float') stopLoss: number;
  @Column('float') takeProfit: number;

  @Index()
  @Column({
    type: 'enum',
    enum: Object.values(status),
    nullable: false,
    default: status.pending,
  })
  status: status;

  @Column({ type: 'float', nullable: true })
  exitPrice: number;

  @Column({ type: 'enum', enum: Object.values(action), nullable: false })
  action: action;

  @Column({ type: 'float', nullable: false, default: 0 })
  margin: number;

  @Index()
  @Column({
    type: 'enum',
    enum: Object.values(type),
    nullable: false,
    default: type.copy,
  })
  tradeType: type;

  @Index()
  @Column({ nullable: false })
  identifier: string;

  @Column()
  asset: string;

  @Column({ type: 'float', nullable: false })
  entryPrice: number;

  @Column()
  leverage: number;

  @Column({ type: 'enum', enum: Object.values(outcome), nullable: true })
  outcome?: outcome;

  @Column({ type: 'float', nullable: false, default: 0 })
  tradeRoi: number;

  @Column({ type: 'float', nullable: false, default: 0 })
  currentPrice: number;

  @Column({ type: 'jsonb', default: { amount: 0, currency: 'USDT' } })
  positionSize: positionSize;

  @Column({ type: 'float', default: 0 })
  realizedPnl: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  noOfCopiers: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  scheduleStartId?: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  scheduleEndId?: number;

  @Column({ type: 'enum', enum: Object.values(duration) })
  duration: duration;

  @Column({ type: 'timestamp', nullable: false, default: () => 'now()' })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: false, default: () => 'now()' })
  expiresAt?: Date;

  @Column({ type: 'enum', enum: Object.values(riskLevel) })
  riskLevel: riskLevel;

  @Column({ type: 'boolean', default: false })
  isDraft: boolean;

  @Column({
    type: 'enum',
    enum: Object.values(orderType),
    default: orderType.limit,
  })
  orderType: orderType;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  getTotalProfitForCopies(): number {
    if (this.tradeRoi > 0) {
      return this.margin * this.tradeRoi * this.noOfCopiers;
    }
    return 0;
  }
}
