import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { privileges, Roles, userType } from '../interface';
import { User } from './user.entity';

@Entity('roles')
export class RoleModel implements Roles {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ enum: userType, default: 'internal' })
  type: userType;

  @Column({ default: 1 })
  roleLevel: number;

  @OneToMany(() => Privileges, (priv) => priv.role, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  privileges: Privileges[];

  @OneToMany(() => User, (user) => user.roles)
  users: User[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}

@Entity('privileges')
export class Privileges implements privileges {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RoleModel, (role) => role.privileges, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: RoleModel;

  @Column({ default: 1 })
  roleLevel: number;

  @Column({ type: 'json' })
  privileges: string[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
