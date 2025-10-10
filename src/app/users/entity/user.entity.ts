import { Subscription } from '@app/subscription/entities';
import { Wallets } from '@app/wallets/entities';
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
import {
  authType,
  gender,
  IUser,
  Role,
  userStatus,
  userType,
} from '../interface/user.interface';
import { RoleModel } from './roles.entity';

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ select: false, nullable: true })
  transactionPin?: string;

  @Column({ nullable: false, default: false })
  hasTransactionPin: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  otp?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt?: Date | null;

  @Column({ default: false })
  otpVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isTfaEnabled: boolean;

  @Column({ nullable: true, select: false })
  tfaSecret: string;

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

  @Column({ nullable: true })
  refercode?: string;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  /* timestamps */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RoleModel, (role) => role.users, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  roles: RoleModel;

  @OneToMany(() => Wallets, (wallet) => wallet.user)
  wallets: Wallets[];

  /* helpers */
  async validatePassword(pw: string): Promise<boolean> {
    return bcrypt.compare(pw, this.password);
  }
}
