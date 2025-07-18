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
    type: 'varchar',
    enum: Object.values(EmailStatus),
    nullable: false,
  })
  status: EmailStatus;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({
    type: 'varchar',
    nullable: true,
    enum: Object.values(EmailRecipient),
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
