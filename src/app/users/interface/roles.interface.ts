import { IUser, userType } from './user.interface';

export interface Roles {
  id?: string;
  name: string;
  description: string;
  type: userType;
  roleLevel: number;
  privileges?: privileges[];
}

export interface Capability {
  id: string;
  module: string;
  key: string;
  description: string;
  roles: Roles[];
}

export interface privileges {
  id: string;
  role: Roles;
  roleLevel: number;
  privileges: string[];
}

export interface RoleCapabilities {
  id: string;
  role: Roles;
  capability: Capability;
  roleLevel: number;
}

export interface Permission {
  id: string;
  route: string;
  actions: string[];
  description?: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
}

export interface UserRoles {
  id: string;
  user_id: string | IUser;
  role_id: string | Roles;
}

export type CreateRole = Pick<Roles, 'name' | 'description'>;

export type UpdateRole = Partial<CreateRole>;
