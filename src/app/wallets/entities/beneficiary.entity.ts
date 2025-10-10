import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IBeneficiary } from '../input';
import { IUser } from '@app/users/interface';
import { User } from '@app/users/entity';

@Entity()
export class Beneficiary implements IBeneficiary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  bankName?: string;

  @Column({ nullable: true })
  bankCode?: number;

  @Column({ nullable: true })
  accountName?: string;

  @Column({ nullable: true, type: 'bigint', unique: true })
  accountNumber?: number;

  @Column({ nullable: true })
  bankAvatar?: string;

  @Column({ type: 'boolean', default: false })
  internal: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: IUser;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'recipientId' })
  recipient?: IUser;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
