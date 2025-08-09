// import { CAPABILITIES } from '@app/common';
// import { Capabilities } from '@app/users/entity';
// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';

// @Injectable()
// export class CapabilitiesSyncService implements OnModuleInit {
//   constructor(
//     @InjectRepository(Capabilities)
//     private capabilityRepo: Repository<Capabilities>,
//   ) {}

//   onModuleInit() {
//     console.log('saving...');
//     this.syncCapabilities().catch((error) => {
//       console.error('Capabilities failed:', error);
//       process.exit(1);
//     });
//   }

//   async syncCapabilities() {
//     for (const [module, actions] of Object.entries(CAPABILITIES)) {
//       for (const action of actions) {
//         const exists = await this.capabilityRepo.findOne({
//           where: { module, key: action },
//         });
//         if (!exists) {
//           await this.capabilityRepo.save({ module, key: action });
//         }
//       }
//     }
//   }
// }
