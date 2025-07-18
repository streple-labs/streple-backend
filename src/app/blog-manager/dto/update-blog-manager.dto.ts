import { PartialType } from '@nestjs/swagger';
import { CreateBlogManagerDto } from './create-blog-manager.dto';

export class UpdateBlogManagerDto extends PartialType(CreateBlogManagerDto) {}
