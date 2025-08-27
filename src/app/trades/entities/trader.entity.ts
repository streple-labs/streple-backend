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
  direction,
  duration,
  ITrades,
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

  @ManyToOne(() => User, (u) => u.id)
  user: User;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, (u) => u.id)
  creator: User;

  @Column({ type: 'uuid', nullable: false })
  creatorId: string;

  @Index() @Column() symbol: string;

  @Column({ type: 'enum', enum: Object.values(direction) })
  direction: direction;

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
  exitPrice?: number;

  @Column({ type: 'enum', enum: Object.values(action), nullable: false })
  action: action;

  @Column({ type: 'float', nullable: false, default: 0 })
  stakeAmount: number;

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
  leverage: string;

  @Column({ type: 'enum', enum: Object.values(outcome), nullable: true })
  outcome?: outcome;

  @Column({ type: 'float', nullable: false, default: 0 })
  tradeRoi: number;

  @Column({ type: 'float', nullable: false, default: 0 })
  currentPrice: number;

  @Column({ type: 'enum', enum: Object.values(positionSize) })
  positionSize: positionSize;

  @Column({ type: 'decimal', default: 0 })
  realizedPnl: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  noOfCopiers: number;

  @Column({ type: 'enum', enum: Object.values(duration) })
  duration: duration;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'time', nullable: true })
  startTime?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'time', nullable: true })
  endTime?: Date;

  @Column({ type: 'enum', enum: Object.values(riskLevel) })
  riskLevel: riskLevel;

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
      return this.stakeAmount * this.tradeRoi * this.noOfCopiers;
    }
    return 0;
  }
}
