import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IBadge, Phase } from '../interface';

@Entity('badges')
export class Badge implements IBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  image: string;

  @Column({ type: 'enum', enum: Phase, nullable: false, unique: true })
  phase: Phase;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
