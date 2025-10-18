import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ITransaction,
  IWallets,
  transactionStatus,
  transactionType,
} from '../input';
import { Wallets } from './wallet.entity';
import { User } from '@app/users/entity';

@Entity('transactions')
export class Transaction implements ITransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallets, (wallet) => wallet.transactions, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'walletId' })
  wallet?: IWallets;

  @Column({ type: 'enum', enum: Object.values(transactionType) })
  type: transactionType;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: number;

  @Column({ nullable: true, unique: true })
  idempotency?: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  previousBal: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  currentBal: number;

  // who received the transaction (optional for deposits)
  @ManyToOne(() => User, { nullable: true })
  recipient?: User;

  @Column({ type: 'uuid' })
  userId: string;

  // who initiated the transaction
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ nullable: false })
  reference: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  externalRef?: string;

  @Column({ nullable: true })
  txHash?: string;

  @Column({ nullable: true })
  userOpHash?: string;

  @Column({ nullable: true })
  errorDetails?: string;

  @Column({ nullable: true })
  networkFee?: string;

  @Column({
    type: 'enum',
    enum: Object.values(transactionStatus),
  })
  status: transactionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
