// toggle-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '../interface/user.interface';
export class ToggleRoleDto {
  @ApiProperty({ enum: Role, example: Role.pro })
  @IsEnum(Role)
  role: Role;
}
