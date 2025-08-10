// toggle-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { assignPermission, Roles } from '../interface';
import { Role } from '../interface/user.interface';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CAPABILITIES } from '@app/common';

export interface toggle {
  role: Role;
  roles?: Roles;
}
export class ToggleRoleDto implements toggle {
  @ApiProperty({ enum: Role, example: Role.pro })
  @IsIn([Role.follower, Role.pro])
  role: Role;
}

export class AssignRole implements assignPermission {
  @IsString()
  @IsNotEmpty()
  @IsIn([Role.marketer, Role.publish])
  roleName: Role;

  @IsInt()
  @IsIn([2, 3])
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  roleLevel: number;

  @IsArray()
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn(Object.values(CAPABILITIES), { each: true })
  permission: string[];
}
