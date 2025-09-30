import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Badge } from './badge.entity';
import { User } from '@app/users/entity/user.entity';
import { IUserBadge } from '../interface';

@Entity('game_badges')
export class UserBadge implements IUserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user: User;

  @Column({ type: 'uuid', nullable: false })
  badgeId: string;

  @ManyToOne(() => Badge, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  badge: Badge;

  @Column({ type: 'timestamp' })
  earnedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
