import { User } from 'src/app/users/user.entity';
import { blogStatus, IBlogManager } from '../interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class BlogManager implements IBlogManager {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'json' })
  tags: string[];

  @Column({ type: 'varchar', nullable: true })
  thumbnail: string;

  @Column({ type: 'varchar', nullable: false })
  metatitle: string;

  @Column({ type: 'varchar', nullable: false })
  description: string;

  @Column({ type: 'varchar', nullable: false })
  slug: string;

  @Column({ type: 'date', nullable: true })
  scheduleDate: Date;

  @Column({ type: 'int', nullable: false, default: 0 })
  view: number;

  @ManyToOne(() => User, (u) => u.id)
  creator: User;

  @Column({ type: 'uuid', nullable: true })
  creatorId: string | null;

  @Column({
    type: 'enum',
    enum: ['Published', 'Draft', 'Scheduled'],
    default: blogStatus.draft,
  })
  status: blogStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
