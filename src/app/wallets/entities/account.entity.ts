import { User } from '@app/users/entity';
import { IUser } from '@app/users/interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IAccount } from '../input';

@Entity('fiat-accounts')
export class FiatAccount implements IAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reference: string;

  @Column()
  walletName: string;

  @Column()
  bankName: string;

  @Column({ type: 'bigint' })
  accountNumber: number;

  @Column({ type: 'bigint', nullable: true })
  wallet: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: IUser;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
