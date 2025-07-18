import { hubStatus, ILearningHub, Level } from '../interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('learning_hub')
export class LearningHub implements ILearningHub {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  document: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ type: 'enum', enum: Level, default: Level.beginner })
  level: Level;

  @Column({ type: 'enum', enum: hubStatus, default: hubStatus.draft })
  status: hubStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
