import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IReferralRewardSetting, ReferralLevel } from '../input';

@Entity('referral_reward_settings')
export class ReferralRewardSetting implements IReferralRewardSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'enum', enum: ReferralLevel })
  level: ReferralLevel;

  @Column({ type: 'float', nullable: false })
  amount: number;

  @Column({ type: 'int', nullable: false })
  count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
