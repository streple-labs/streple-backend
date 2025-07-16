import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Admins')
@ApiBearerAuth()
@Controller('admins')
@UseGuards(JwtAuthGuard)
export class AdminsController {
  @Get('dashboard')
  getDashboard(@Req() req: Request) {
    const user = req.user as { id: string; role: string; email: string };

    console.log('user:', user);
    if (user.role !== 'admin') {
      throw new ForbiddenException('Access denied: Admins only');
    }

    return `Welcome Admin ${user.email}`;
  }
}
