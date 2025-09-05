import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@app/users/entity';
import { IReferral, ReferralLevel, ReferralStatus } from '../input';

@Entity('referrals')
export class Referral implements IReferral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  directReferrerId: string;

  @Column({ type: 'uuid', nullable: true })
  indirectReferrerId?: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'enum', enum: ReferralLevel, nullable: true })
  level: ReferralLevel;

  @Column({ type: 'float', nullable: false, default: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  @Column({ nullable: true })
  badgeId?: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  hasBadge: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  exclusive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'indirectReferrerId' })
  indirectReferrer?: User;

  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'directReferrerId' })
  directReferrer: User;
}
