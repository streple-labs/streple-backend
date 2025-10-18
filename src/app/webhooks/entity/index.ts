import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { notification, notificationType, TransactionBound } from '../index';

@Entity('webhook_logs')
export class WebHookLog implements TransactionBound {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  subscriptionId: string;

  @Column({ nullable: true })
  notificationId: string;

  @Column({ type: 'enum', enum: Object.values(notificationType) })
  notificationType: notificationType;

  @Column({ type: 'jsonb' })
  notification: notification;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'int' })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
