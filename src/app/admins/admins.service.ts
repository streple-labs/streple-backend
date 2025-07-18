import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { SignupDto } from 'src/app/auth/dto/signup.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin) private readonly repo: Repository<Admin>,
  ) {}

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  async findById(id: string) {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException();
    return admin;
  }

  async createAdmin(dto: SignupDto) {
    const adminExists = await this.findByEmail(dto.email);
    if (adminExists) throw new BadRequestException('Admin already exists');

    const admin = this.repo.create(dto);
    admin.password = await bcrypt.hash(dto.password, 10);

    await this.repo.save(admin);
    return { message: 'Admin account created successfully' };
  }
}
