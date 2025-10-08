import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IProTrader } from '../interface';

@Entity('protraders')
export class Protrader implements IProTrader {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  tradingExperience: string;

  @Column()
  exchangesUsed: string;

  @Column('simple-array', { nullable: true })
  socialHandlers?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
