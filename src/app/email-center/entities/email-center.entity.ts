import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmailRecipient, EmailStatus, IEmailCenter } from '../interface';

@Entity('email_center')
export class EmailCenter implements IEmailCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  subject: string;

  @Column({
    type: 'enum',
    enum: ['Draft', 'Scheduled', 'Failed', 'Sent'],
  })
  status: EmailStatus;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({
    type: 'enum',
    enum: ['All users', 'Copiers', 'Protraders'],
    nullable: true,
  })
  recipient: EmailRecipient;

  @Column({ type: 'json', nullable: true })
  selected: string[];

  @Column({ type: 'date', nullable: true })
  scheduleDate: Date;

  @Column({ type: 'decimal', nullable: false, default: 0 })
  openRate: number;

  @Column({ type: 'decimal', nullable: false, default: 0 })
  clickRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
