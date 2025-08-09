import { Privileges, RoleModel } from '@app/users/entity';
import { UsersModule } from '@app/users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoleModel, Privileges]), UsersModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
