export type Role = 'USER' | 'ADMIN';

export enum action {
  read = 'read',
  search = 'search',
  create = 'create',
  update = 'update',
  delete = 'delete',
  manage = 'manage',
}

type Ability = {
  can: action[];
  cannot?: action[];
};

export type ControllerAbilities = {
  [route: string]: {
    [role in Role]?: Ability;
  };
};
