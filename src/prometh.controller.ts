import { Public } from '@app/decorators';
import { Controller, Get, Res } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';

@Controller()
@Public()
export class PromethController extends PrometheusController {
  @Get()
  index(@Res({ passthrough: true }) response: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return super.index(response);
  }
}
