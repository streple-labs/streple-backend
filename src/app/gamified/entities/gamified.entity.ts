import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { gameOnboard } from '../interface';
import { User } from '@app/users/entity/user.entity';

@Entity('gaming_onboarding')
export class GamingOnboarding implements gameOnboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  firstQuestion: string;

  @Column()
  secondQuestion: string;

  @Column()
  thirdQuestion: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  hasAnswer: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
