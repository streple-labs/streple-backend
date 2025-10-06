import { User } from '@app/users/entity';
import { IUser } from '@app/users/interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ITransaction, IWallets, walletStatus, walletSymbol } from '../input';
import { Transaction } from './transaction.entity';

@Entity('wallets')
@Unique(['user', 'currency'])
export class Wallets implements IWallets {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  balance: number;

  @Column({ type: 'enum', enum: Object.values(walletSymbol) })
  currency: walletSymbol;

  @ManyToOne(() => User, (user) => user.wallets, { onDelete: 'CASCADE' })
  user: IUser;

  @OneToMany(() => Transaction, (tx) => tx.wallet)
  transactions: ITransaction[];

  @Column({
    type: 'enum',
    enum: Object.values(walletStatus),
    default: walletStatus.active,
  })
  status: walletStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
