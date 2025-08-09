import * as bcrypt from 'bcrypt';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CopyWallet } from '../../copy-trading/entities/copy-wallet.entity';
import {
  userType,
  authType,
  gender,
  IUser,
  Role,
  userStatus,
} from '../interface/user.interface';
import { RoleModel } from './roles.entity';

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

  @Column({ type: 'enum', enum: authType, default: authType.email })
  auth_type: authType;

  @Column({ type: 'enum', enum: userType, default: userType.external })
  type: userType;

  @Column({ type: 'enum', enum: gender, nullable: true })
  gender: gender;

  @Column({ type: 'enum', enum: userStatus, default: userStatus.active })
  status: userStatus;

  @Column({ default: 1 })
  roleLevel: number;
  /* timestamps */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RoleModel, (role) => role.users, { eager: false })
  @JoinColumn({ name: 'role_id' })
  roles: RoleModel;

  /* helpers */
  async validatePassword(pw: string): Promise<boolean> {
    return bcrypt.compare(pw, this.password);
  }
}
