import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
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

  @OneToMany(() => Privileges, (priv) => priv.role, { cascade: true })
  privileges: privileges[];

  @OneToMany(() => User, (user) => user.roles)
  users: User[];
}

@Entity('privileges')
export class Privileges implements privileges {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RoleModel, (role) => role.id)
  @JoinColumn({ name: 'role_id' })
  role: RoleModel;

  @Column({ default: 1 })
  roleLevel: number;

  @Column({ type: 'json' })
  privileges: string[];
}

// @Entity('capabilities')
// @Unique(['module', 'key'])
// export class Capabilities implements Capability {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   module: string; // e.g., BLOG, ORDER

//   @Column({ unique: true })
//   key: string; // e.g., BLOG_CREATE, BLOG_DELETE

//   @Column({ nullable: true })
//   description: string;

//   @OneToMany(() => RoleCapability, (roleCap) => roleCap.capability)
//   roles: Roles[];
// }

// @Entity('role_capabilities')
// export class RoleCapability implements RoleCapabilities {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ManyToOne(() => RoleModel, (role) => role.capabilities)
//   @JoinColumn({ name: 'role_id' })
//   role: RoleModel;

//   @ManyToOne(() => Capabilities, (cap) => cap.roles)
//   @JoinColumn({ name: 'capability_id' })
//   capability: Capability;

//   @Column({ default: 1 })
//   roleLevel: number;
// }
