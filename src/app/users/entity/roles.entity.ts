import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import {
  Capability,
  IUser,
  RoleCapabilities,
  Roles,
  userType,
} from '../interface';
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

  @OneToMany(() => User, (user) => user.role)
  users: IUser[];

  @OneToMany(() => RoleCapability, (roleCap) => roleCap.role)
  capabilities: Capability[];
}

@Entity('capabilities')
@Unique(['module', 'key'])
export class Capabilities implements Capability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  module: string; // e.g., BLOG, ORDER

  @Column({ unique: true })
  key: string; // e.g., BLOG_CREATE, BLOG_DELETE

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => RoleCapability, (roleCap) => roleCap.capability)
  roles: Roles[];
}

@Entity('role_capabilities')
export class RoleCapability implements RoleCapabilities {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RoleModel, (role) => role.capabilities)
  @JoinColumn({ name: 'role_id' })
  role: RoleModel;

  @ManyToOne(() => Capabilities, (cap) => cap.roles)
  @JoinColumn({ name: 'capability_id' })
  capability: Capability;

  @Column({ default: 1 })
  roleLevel: number;
}
