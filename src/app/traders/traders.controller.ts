import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TradersService } from './traders.service';
import { CreateTraderDto } from './dto/create-trader.dto';
import { UpdateTraderDto } from './dto/update-trader.dto';

@Controller('traders')
export class TradersController {
  constructor(private readonly tradersService: TradersService) {}

  @Post()
  create(@Body() createTraderDto: CreateTraderDto) {
    return this.tradersService.create(createTraderDto);
  }

  @Get()
  findAll() {
    return this.tradersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tradersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTraderDto: UpdateTraderDto) {
    return this.tradersService.update(+id, updateTraderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tradersService.remove(+id);
  }
}
