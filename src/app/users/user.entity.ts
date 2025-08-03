import * as bcrypt from 'bcrypt';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CopyWallet } from '../copy-trading/entities/copy-wallet.entity';
import { IUser, Role } from './interface';

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  otp?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt?: Date | null;

  @Column({ default: false })
  otpVerified: boolean;

  /* role toggle */
  @Column({ type: 'enum', enum: Role, default: Role.follower })
  role: Role;

  /* profile bits */
  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  expectationFromStreple: string;

  @Column({ nullable: true })
  howFamiliarWithTrading: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  hasAnswer: boolean;

  @Column({ type: 'json', nullable: true })
  stats: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  performanceHistory: Array<{ date: Date; value: number }>;

  @Column({ default: 0 })
  followerCount: number;

  /* --- DEMO FUNDING ACCOUNT ---------------------------------- */
  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  demoFundingBalance: number;

  /* --- RELATION: copy wallets per Pro Trader ----------------- */
  @OneToMany(() => CopyWallet, (w) => w.user, { cascade: true })
  copyWallets: CopyWallet[];

  /* timestamps */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /* helpers */
  async validatePassword(pw: string): Promise<boolean> {
    return bcrypt.compare(pw, this.password);
  }
}
