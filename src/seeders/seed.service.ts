import { WaitList } from '@app/email-center/entities';
import { Badge } from '@app/gamified/entities';
import { IBadge, Phase } from '@app/gamified/interface';
import { Privileges, RoleModel, User } from '@app/users/entity';
import { Role, Roles, userType } from '@app/users/interface';
import { UsersService } from '@app/users/service';
import { CryptoAccounts } from '@app/wallets/entities';
import { USDCService } from '@app/wallets/service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TypeORMError } from 'typeorm';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(RoleModel)
    private readonly roleRepository: Repository<RoleModel>,
    @InjectRepository(Privileges)
    private readonly privilegesRepo: Repository<Privileges>,
    @InjectRepository(WaitList) private readonly wait: Repository<WaitList>,
    @InjectRepository(Badge) private readonly badge: Repository<Badge>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(CryptoAccounts)
    private readonly cryptoRepo: Repository<CryptoAccounts>,
    private readonly usdcService: USDCService,
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
        type: userType.internal,
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
        type: userType.internal,
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
            'LEARNINGHUB_CREATE',
            'LEARNINGHUB_READ',
            'LEARNINGHUB_UPDATE',
            'BLOG_CREATE',
            'BLOG_READ',
            'BLOG_UPDATE',
          ];

          if (!priv) {
            priv = this.privilegesRepo.create({
              role: user,
              privileges: wanted,
              roleLevel: 2,
            });
          } else {
            // const merged = Array.from(
            //   new Set([...(priv.privileges || []), ...wanted]),
            // );
            priv.privileges = wanted; //merged;
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

          const wanted = [
            'EMAIL_SEND',
            'EMAIL_READ',
            'EMAIL_UPDATE',
            'LEARNINGHUB_CREATE',
            'LEARNINGHUB_READ',
            'LEARNINGHUB_UPDATE',
            'BLOG_CREATE',
            'BLOG_READ',
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
      }
    }
  }

  async seedSenior() {
    const admin = await this.roleRepository.find({
      where: { roleLevel: 3 },
    });

    if (admin) {
      for (const user of admin) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (user.name === Role.admin) {
          const isAdded = await this.privilegesRepo.findOne({
            where: { role: { id: user.id } },
            relations: ['role'],
          });
          if (!isAdded) {
            const superAd = this.privilegesRepo.create({
              role: user,
              privileges: ['all'],
              roleLevel: 3,
            });

            await this.privilegesRepo.save(superAd);
          }
        }
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

          const wanted = ['COPYTRADE_READ', 'GAMIFIED_READ'];

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
            'GAMIFIED_UPDATE',
            'COPYTRADE_READ',
            'COPYTRADE_CREATE',
            'COPYTRADE_UPDATE',
            'GAMIFIED_READ',
            'GAMIFIED_CREATE',
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

  async seedWailList() {
    const emails = [
      'obasicovenant7@gmail.com',
      'eric2umeh@yahoo.com',
      'timothyanna25@gmail.com',
      'clareteriki1@gmail.com',
      'kibesuraiyatmohammed@gmail.com',
      'mujeebatbalogun@gmail.com',
      'idrisfaridah001@gmail.com',
      'slimsufy2001@gmail.com',
      'ahmednanahauwa55@gmail.com',
      'sadiqbecca@gmail.com',
      'heturafarms@gmail.com',
      'ugbedejibrin2019@gmail.com',
      'mosesokechukwu032@gmail.com',
      'anthonyrichie.lala@gmail.com',
      'chigozieuzoigwe813@gmail.com',
      'francisfrenzy8@gmail.com',
      'bigtoskydo@gmail.com',
      'ansgarokoh@gmail.com',
      'francisfrenzy8@gmail.com',
      'abdullahiumarf608@gmail.com',
      'dibuadiogo@gmail.com',
      'obialoremmanuel5@gmail.com',
      'dominicok07@gmail.com',
      'calebiwunze20@gmail.com',
      'isaachyelngtil@gmail.com',
      'echetamaw@gmail.com',
      'pezeakunne@gmail.com',
      'melyndaegbeocha@gmail.com',
      'chidiebere3322@gmail.com',
      'franciscachinemelum1@gmail.com',
      'divinetakim03@gmail.com',
      'fannypeterside@gmail.com',
      'charlesedochie53@gmail.com',
      'mbadughachizoba119@gmail.com',
      'ejimsamala002@gmail.com',
      'obichukwuchidubem06@gmail.com',
      'joshuauolewu@gmail.com',
      'sandraemesiobi2@gmail.com',
      'davidoffor100@gmail.com',
      'petertony776@gmail.com',
      'chinagoromfrancis012@gmail.com',
      'uchendugodreigns@gmail.com',
      'saharachibuzor@gmail.com',
      'newmanwisdom32@gmail.com',
      'nonyblaise36@gmail.com',
      'chisomokoronkwo7@gmail.com',
      'judennaemeka48@gmail.com',
      'danielidahosa12@gmail.com',
      'moviemadnesstiktok@gmail.com',
      'princessgold903@gmail.com',
      'judeabara@gmail.com',
      'eguaojejr2014@gmail.com',
      'alfredchinedu15@gmail.com',
      'benjamin33755761@gmail.com',
      'only1rhurhupanama@gmail.com',
      'chimezieaniago001@gmail.com',
      'kaluchiemezie@gmail.com',
      'nallyofficail@gmail.com',
      'gallantino3525@gmail.com',
      'dukebasy20@gmail.com',
      'emendo005@gmail.com',
      'chigoziembah73@gmail.com',
      'nally.arinze@gmail.com',
      'peacenicholas5@gmail.com',
      'mbaebuka955@gmail.com',
      'benwcisse@gmail.com',
      'davidadeyeni@gmail.com',
      'christabelsarimah@gmail.com',
      'kingsleyj836@gmail.com',
      'arinzeedmund67@gmail.com',
      'nmaviva94@gmail.com',
      'marycynthialisa@gmail.com',
      'oddjohn0987@gmail.com',
      'edwinoluchi75@gmail.com',
      'perpetuauzoma16@gmail.com',
      'dominicfredrikk@gmail.com',
      'glowreal75@gmail.com',
      'emmanueltendekai150@gmail.com',
      'o.a.umane@gmail.com',
      'chidimmagabriel1995@gmail.com',
      'dominicvalentino091@gmail.com',
      'godwintrav@gmail.com',
      'preshgoldzinnybeauty@gmail.com',
      'computerscience2330@gmail.com',
      'umar232a@gmail.com',
      'Zakariya.malachi2@gmail.com',
      'adamuaumar92@yahoo.com',
      'ibrahimkibrahim194@gmail.com',
      'njosephavong@gmail.com',
      'obongudoh@gmail.com',
      'okojohn@unical.edu.ng',
      'kwopnangongchi@gmail.com',
      'adebisifaridajoy@gmail.com',
      'akinoriola07@gmail.com',
      'abubakarbello1064@gmail.com',
      'Miraclealabi1414@gmail.com',
      'ioartanddesignproduction@gmail.com',
      'mujahidsaminu993@gmail.com',
      'jfunminiyi@gmail.com',
      'khanerbaushe01@gmail.com',
      'otenejonathan26@gmail.com',
      'mitt1415@gmail.com',
      'usmanmusaari@gmail.com',
      'lawanmodu123@gmail.com',
      'Nuruinusa72@gmail.com',
      'nwachukwuwilliams008@gmail.com',
      'gloryadekeye21@gmail.com',
      'usamaabdullahi40@gmail.com',
      'condemmail@gmail.com',
      'Hannaholuwatobi8@gmail.com',
      'funombell2018@gmail.com',
      'basharbinusman1@gmail.com',
      'omijiemichael435@gmail.com',
      'lamismukhtar68@gmail.com',
      'chalkypius@gmail.com',
      'Mustaphajibreelharun@gmail.com',
      'Muhammadsani85@gmail.com',
      '3reasure117@gmail.com',
      'samueletoma26@gmail.com',
      'Jenniferibinola@gmail.com',
      'samkengolden2003@gmail.com',
      'fahatsalisu80@gmail.com',
      'fatimatzahramU5@gmail.com',
      'PG0512762@gmail.com',
      'ba4187432@gmail.com',
      'MDhanyine@gmail.com',
      'Tiwa.ogundare@gmail.com',
      'bsifedoyin@yahoo.com',
      'momohsanimomohsani948@gmail.com',
      'loritachidera831@gmail.com',
      'jayjay4greatness2015@gmail.com',
      'lancelotekong54@gmail.com',
      'daisyvishnu8@gmail.com',
      'soladimeji50@gmail.com',
      'mahirahmadatif3@gmail.com',
    ];

    const data = emails.map((email) => ({ email }));
    await this.wait
      .createQueryBuilder()
      .insert()
      .into(WaitList) // your entity name
      .values(data) // [{ email: '...' }, ...]
      .orIgnore() // ON CONFLICT DO NOTHING
      .execute();
  }

  async seedBadge() {
    const badges: IBadge[] = [
      {
        name: 'CRYPTO INITIATE',
        image:
          'https://streplestorage.s3.eu-north-1.amazonaws.com/images/streple+badge.png',
        phase: Phase.first,
      },
      {
        name: '',
        image:
          'https://streplestorage.s3.eu-north-1.amazonaws.com/images/streple_badge_2.png',
        phase: Phase.second,
      },
    ];

    for (const badge of badges) {
      const exists = await this.badge.findOne({
        where: { phase: badge.phase },
      });

      if (!exists) {
        await this.badge.save(this.badge.create(badge));
        console.log(`Created badge for: ${badge.phase}`);
      }
    }
  }

  async seedWalletForUser() {
    try {
      const users = await this.userRepo.find({ where: { isVerified: true } });
      if (!users.length) return console.log('no users');

      for (const user of users) {
        await this.usdcService.createWalletForUser({
          id: user.id,
          email: user.email,
          role: Role.follower,
          roleLevel: user.roleLevel,
          username: user.username,
        });

        console.log(`Wallet created for ${user.fullName}`);
        return;
      }
    } catch (error) {
      if (error instanceof TypeORMError) {
        return console.log(error);
      }
      throw error;
    }
  }

  async seedAll() {
    console.log('Starting database seeding...');

    await this.seedWalletForUser();

    // await this.seedRoles();
    // console.log('Roles seeded successfully');

    // await this.seedSuperAdminPermission();
    // await this.seedJunior();
    // await this.seedSenior();
    // await this.seedUsers();
    // console.log('Default Permission seeded successfully');

    // await this.seedWailList();
    // console.log('wait list created successfully');

    // await this.seedSuperAdmin();
    // console.log('Super Admin seeded successfully');

    // await this.seedBadge();
    // console.log('Seed badges successfully');

    process.exit();
  }
}
