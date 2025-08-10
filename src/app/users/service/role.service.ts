import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Privileges, RoleModel, User } from '../entity';
import { assignPermission, findManyUser, findOneUser } from '../interface';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(RoleModel) private readonly role: Repository<RoleModel>,
    @InjectRepository(Privileges)
    private readonly privilegesRepo: Repository<Privileges>,
  ) {}

  async getRoleWithDetails(params: findManyUser) {
    const queryBuilder = this.filterRole(params);
    // Add pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Execute query and get results with total count
    const [data, total] = await queryBuilder.getManyAndCount();

    const currentPage = page;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return { data, total, currentPage, hasNextPage, hasPrevPage, totalPages };
  }

  async getSingleUserWithRoleAndPermission(param: findOneUser) {
    const queryBuilder = this.repo.createQueryBuilder('user');
    const include = ['roles', 'privileges'];
    for (const relation of include) {
      if (relation === 'roles') {
        queryBuilder.leftJoinAndSelect('user.roles', 'roles');

        if (include.includes('privileges')) {
          queryBuilder.leftJoinAndSelect('roles.privileges', 'privileges');
        }
      }
    }

    if (param.id) {
      queryBuilder.andWhere('user.id = :id', {
        id: param.id,
      });
    }

    if (param.email) {
      queryBuilder.andWhere('user.email = :email', {
        email: param.email,
      });
    }

    if (param.fullName) {
      queryBuilder.andWhere('user.fullName = :fullName', {
        fullName: param.fullName,
      });
    }

    const data = await queryBuilder.getOne();
    return data;
  }

  async assignPermission(data: assignPermission) {
    const { roleLevel, roleName, permission } = data;
    const assign = await this.role.find({
      where: { roleLevel: roleLevel },
    });

    if (assign) {
      for (const user of assign) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (user.name === roleName) {
          let priv = await this.privilegesRepo.findOne({
            where: { role: { id: user.id } },
            relations: ['role'],
          });

          if (!priv) {
            priv = this.privilegesRepo.create({
              role: user,
              privileges: permission,
              roleLevel: roleLevel,
            });
          } else {
            const merged = Array.from(
              new Set([...(priv.privileges || []), ...permission]),
            );
            priv.privileges = merged;
            priv.roleLevel = roleLevel;
          }
          await this.privilegesRepo.save(priv);
        }
      }
    }
  }

  async removeAccess(
    data: assignPermission,
  ): Promise<{ success: boolean; message?: string }> {
    const { roleName, roleLevel, permission } = data;

    const entity = await this.privilegesRepo.findOne({
      where: {
        role: { name: roleName },
        roleLevel: roleLevel,
      },
      relations: ['role'],
    });

    if (!entity) {
      return { success: false, message: 'Role privileges not found' };
    }

    // Ensure privileges exists and is an array
    if (!Array.isArray(entity.privileges)) {
      entity.privileges = [];
    }

    const permissionsToRemove = permission.map((p) => p.toLowerCase());
    entity.privileges = entity.privileges.filter(
      (item) => !permissionsToRemove.includes(item.toLowerCase()),
    );

    await this.privilegesRepo.save(entity);
    return { success: true, message: 'Permissions removed successfully' };
  }

  private filterRole(params: findManyUser) {
    // Create query builder for users
    const queryBuilder = this.repo.createQueryBuilder('user');

    // Include relations if specified
    if (params.include && params.include.length > 0) {
      for (const relation of params.include) {
        if (relation === 'roles') {
          queryBuilder.leftJoinAndSelect('user.roles', 'roles');

          if (params.include.includes('privileges')) {
            queryBuilder.leftJoinAndSelect('roles.privileges', 'privileges');
          }
        }
      }
    }

    if (params.type) {
      queryBuilder.andWhere('user.type IN (:...type)', {
        type: Array.isArray(params.type) ? params.type : [params.type],
      });
    }

    if (params.email) {
      queryBuilder.andWhere('user.email IN (:...email)', {
        email: Array.isArray(params.email) ? params.email : [params.email],
      });
    }

    if (params.fullName) {
      queryBuilder.andWhere('user.fullName IN (:...fullName)', {
        fullName: Array.isArray(params.fullName)
          ? params.fullName
          : [params.fullName],
      });
    }
    // Add search functionality across all tables
    if (params.search) {
      queryBuilder.where(
        new Brackets((qb) => {
          // User fields
          qb.where('user.email ILIKE :search', {
            search: `%${params.search}%`,
          }).orWhere('user.fullName ILIKE :search', {
            search: `%${params.search}%`,
          });

          // Role fields (if relation is included)
          if (params.include?.includes('roles')) {
            qb.orWhere('roles.name ILIKE :search', {
              search: `%${params.search}%`,
            }).orWhere('roles.description ILIKE :search', {
              search: `%${params.search}%`,
            });
          }

          // Permission fields (if relation is included)
          if (params.include?.includes('permissions')) {
            qb.orWhere('permissions.name ILIKE :search', {
              search: `%${params.search}%`,
            }).orWhere('permissions.code ILIKE :search', {
              search: `%${params.search}%`,
            });
          }
        }),
      );
    }

    // Add sorting
    if (params.sort && params.sort.length > 0) {
      for (const sort of params.sort) {
        const [field, order] = sort.split(':');

        // Handle nested relations (e.g., 'role.name' or 'role.permissions.name')
        if (field.includes('.')) {
          const parts = field.split('.');
          if (parts.length === 2) {
            queryBuilder.addOrderBy(
              `${parts[0]}.${parts[1]}`,
              order as 'ASC' | 'DESC',
            );
          } else if (parts.length === 3) {
            // For deeply nested like role.permissions.name
            queryBuilder.addOrderBy(
              `${parts[0]}_${parts[1]}.${parts[2]}`,
              order as 'ASC' | 'DESC',
            );
          }
        } else {
          // Handle main entity sorting
          queryBuilder.addOrderBy(`user.${field}`, order as 'ASC' | 'DESC');
        }
      }
    }

    return queryBuilder;
  }
}
