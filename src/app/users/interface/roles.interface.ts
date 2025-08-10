import { IUser, Role, userType } from './user.interface';

export interface Roles {
  id?: string;
  name: string;
  description: string;
  type: userType;
  roleLevel: number;
  privileges?: privileges[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface privileges {
  id: string;
  role: Roles;
  roleLevel: number;
  privileges: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface assignPermission {
  roleName: Role;
  roleLevel: number;
  permission: string[];
}

export interface UserRoles {
  id: string;
  user_id: string | IUser;
  role_id: string | Roles;
}

export type CreateRole = Pick<Roles, 'name' | 'description'>;

export type UpdateRole = Partial<CreateRole>;
