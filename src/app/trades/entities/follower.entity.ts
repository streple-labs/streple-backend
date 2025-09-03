import { User } from '@app/users/entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FollowTrader } from '../input';

@Entity()
export class FollowTraders implements FollowTrader {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  followerId: string;

  @Column({ type: 'uuid', nullable: false })
  followingId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'followerId' })
  follower?: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'followingId' })
  following?: User;
}
