import { User } from '@app/users/entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  BalanceMode,
  BalanceStatus,
  BalanceType,
  IBalance,
} from '../interface';

@Entity('balances')
@Index(['user', 'type', 'mode'])
export class Balance implements IBalance {
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
    enum: BalanceStatus,
  })
  status: BalanceStatus;

  @Column({ type: 'varchar', nullable: false })
  balance: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
