import { Privileges, RoleModel } from '@app/users/entity';
import { Role, Roles, userType } from '@app/users/interface';
import { UsersService } from '@app/users/service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(RoleModel)
    private readonly roleRepository: Repository<RoleModel>,
    @InjectRepository(Privileges)
    private readonly privilegesRepo: Repository<Privileges>,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {}

  async seedRoles() {
    const roles: Partial<Roles>[] = [
      {
        name: Role.superAdmin,
        description: 'Super Administrator with full system access',
        type: userType.internal,
        roleLevel: 4,
      },
      {
        name: Role.admin,
        description: 'Administrator with most system access',
        type: userType.internal,
        roleLevel: 3,
      },
      {
        name: Role.marketer,
        description: 'Communication',
        type: userType.external,
        roleLevel: 2,
      },
      {
        name: Role.publish,
        description: 'Content manager for blog and communications',
        type: userType.internal,
        roleLevel: 2,
      },
      {
        name: Role.follower,
        description: 'followers',
        type: userType.external,
        roleLevel: 1,
      },
      {
        name: Role.pro,
        description: 'pro traders',
        type: userType.external,
        roleLevel: 1,
      },
    ];

    for (const roleData of roles) {
      const exists = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!exists) {
        await this.roleRepository.save(this.roleRepository.create(roleData));
        console.log(`Created role: ${roleData.name}`);
      }
    }
  }

  async seedSuperAdmin() {
    if (!this.configService.get('ADMIN_EMAIL')) {
      throw new Error('Missing ADMIN_EMAIL in environment variables');
    }

    const superAdmins = [
      {
        fullName: this.configService.get('ADMIN_FULL_NAME'),
        email: this.configService.get('ADMIN_EMAIL'),
        role: Role.superAdmin,
        roleLevel: 4,
        type: userType.internal,
      },
    ];
    for (const userData of superAdmins) {
      await this.userService.createAdmin(userData);
    }
  }

  async seedJunior() {
    const junior = await this.roleRepository.find({
      where: { roleLevel: 2 },
    });

    if (junior) {
      for (const user of junior) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (user.name === Role.publish) {
          let priv = await this.privilegesRepo.findOne({
            where: { role: { id: user.id } },
            relations: ['role'],
          });

          const wanted = [
            'EMAIL_SEND',
            'EMAIL_READ',
            'EMAIL_UPDATE',
            'BLOG_CREATE',
            'BLOG_EDIT',
            'BLOG_UPDATE',
          ];

          if (!priv) {
            priv = this.privilegesRepo.create({
              role: user,
              privileges: wanted,
              roleLevel: 2,
            });
          } else {
            const merged = Array.from(
              new Set([...(priv.privileges || []), ...wanted]),
            );
            priv.privileges = merged;
            priv.roleLevel = 2;
          }
          await this.privilegesRepo.save(priv);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (user.name === Role.marketer) {
          let priv = await this.privilegesRepo.findOne({
            where: { role: { id: user.id } },
            relations: ['role'],
          });

          const wanted = ['EMAIL_SEND', 'EMAIL_READ', 'EMAIL_UPDATE'];

          if (!priv) {
            priv = this.privilegesRepo.create({
              role: user,
              privileges: wanted,
              roleLevel: 2,
            });
          } else {
            const merged = Array.from(
              new Set([...(priv.privileges || []), ...wanted]),
            );
            priv.privileges = merged;
            priv.roleLevel = 2;
          }
          await this.privilegesRepo.save(priv);
        }
      }
    }
  }

  async seedSenior() {
    const admin = await this.roleRepository.findOne({
      where: { roleLevel: 3 },
    });

    if (admin) {
      const isAdded = await this.privilegesRepo.findOne({
        where: { role: { id: admin.id } },
      });
      if (!isAdded) {
        const superAd = this.privilegesRepo.create({
          role: admin,
          privileges: ['all'],
          roleLevel: 3,
        });

        await this.privilegesRepo.save(superAd);
      }
    }
  }

  async seedSuperAdminPermission() {
    const superAdmin = await this.roleRepository.findOne({
      where: { roleLevel: 4 },
    });

    if (superAdmin) {
      const isAdded = await this.privilegesRepo.findOne({
        where: { role: { id: superAdmin.id } },
      });

      if (!isAdded) {
        const superAd = this.privilegesRepo.create({
          role: superAdmin,
          privileges: ['all'],
          roleLevel: 4,
        });

        await this.privilegesRepo.save(superAd);
      }
    }
  }

  async seedUsers() {
    const junior = await this.roleRepository.find({
      where: { roleLevel: 1 },
    });

    if (junior) {
      for (const user of junior) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (user.name === Role.follower) {
          let priv = await this.privilegesRepo.findOne({
            where: { role: { id: user.id } },
            relations: ['role'],
          });

          const wanted = [
            'COPYTRADE_READ',
            'COPYTRADE_CREATE',
            'COPYTRADE_UPDATE',
            'GAMIFIED_READ',
          ];

          if (!priv) {
            priv = this.privilegesRepo.create({
              role: user,
              privileges: wanted,
              roleLevel: 1,
            });
          } else {
            const merged = Array.from(
              new Set([...(priv.privileges || []), ...wanted]),
            );
            priv.privileges = merged;
            priv.roleLevel = 1;
          }
          await this.privilegesRepo.save(priv);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (user.name === Role.pro) {
          let priv = await this.privilegesRepo.findOne({
            where: { role: { id: user.id } },
            relations: ['role'],
          });

          const wanted = [
            'COPYTRADE_READ',
            'COPYTRADE_CREATE',
            'COPYTRADE_UPDATE',
            'GAMIFIED_READ',
          ];

          if (!priv) {
            priv = this.privilegesRepo.create({
              role: user,
              privileges: wanted,
              roleLevel: 1,
            });
          } else {
            const merged = Array.from(
              new Set([...(priv.privileges || []), ...wanted]),
            );
            priv.privileges = merged;
            priv.roleLevel = 1;
          }
          await this.privilegesRepo.save(priv);
        }
      }
    }
  }

  async seedAll() {
    console.log('Starting database seeding...');

    await this.seedRoles();
    console.log('Roles seeded successfully');

    await this.seedSuperAdminPermission();
    await this.seedJunior();
    await this.seedSenior();
    await this.seedUsers();
    console.log('Default Permission seeded successfully');

    await this.seedSuperAdmin();
    console.log('Super Admin seeded successfully');

    process.exit();
  }
}
