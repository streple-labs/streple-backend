import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  track: 'Beginner' | 'Advanced';

  @Column({ type: 'date' })
  dateAdded: string;

  @Column({ type: 'int' })
  completionRate: number;

  @Column()
  status: 'Published' | 'Draft';
}
