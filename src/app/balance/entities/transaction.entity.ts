import { User } from '@app/users/entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  BalanceMode,
  BalanceType,
  ITransaction,
  Source,
  TransactionStatus,
  TransactionType,
} from '../interface';

@Entity('transactions')
@Index(['user', 'type', 'mode'])
export class Transactions implements ITransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: BalanceType,
  })
  type: BalanceType;

  @Column({
    type: 'enum',
    enum: BalanceMode,
  })
  mode: BalanceMode;

  @Column({
    type: 'enum',
    enum: Source,
  })
  source: Source;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.pending,
  })
  status: TransactionStatus;

  @Column({ nullable: false, default: 'user' })
  idempotencyKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
