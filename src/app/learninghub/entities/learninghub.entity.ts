import { User } from 'src/app/users/user.entity';
import { hubStatus, hubType, ILearningHub, Level } from '../interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
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

  @Column({ type: 'enum', enum: hubType, default: hubType.article })
  type: hubType;

  @Column({ type: 'enum', enum: hubStatus, default: hubStatus.draft })
  status: hubStatus;

  @ManyToOne(() => User, (u) => u.id)
  creator: User;

  @Column({ type: 'uuid', nullable: true })
  creatorId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
