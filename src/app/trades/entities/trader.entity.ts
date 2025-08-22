import { User } from '@app/users/entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { action, direction, ITrades, status, type } from '../input';

@Entity()
export class Trades implements ITrades {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.id)
  user: User;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Index() @Column() symbol: string;

  @Column({ type: 'enum', enum: Object.values(direction) })
  direction: direction;

  @Column('float') stopLoss: number;
  @Column('float') takeProfit: number;

  @Index()
  @Column({
    type: 'enum',
    enum: Object.values(status),
    nullable: false,
    default: status.pending,
  })
  status: status;

  @Column({ type: 'float', nullable: true })
  exitPrice?: number;

  @ManyToOne(() => User, (u) => u.id)
  creator: User;

  @Column({ type: 'uuid', nullable: false })
  creatorId: string;

  @Column({ type: 'float', nullable: false })
  entryMarket: number;

  @Column()
  riskLevel?: string;

  @Column({ type: 'enum', enum: Object.values(action), nullable: false })
  action: action;

  @Column({ type: 'float', nullable: true })
  stakeAmount?: number;

  @Index()
  @Column({ type: 'enum', enum: Object.values(type), nullable: false })
  type: type;

  @Index()
  @Column({ nullable: false })
  identifier: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt?: Date | undefined;
}
