import { AuthUser } from '@app/common';
import { SessionUser } from '@app/decorators';
import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateGameProgress, GamifieldOnboard } from './dto/gamifield.dto';
import { GamifiedService } from './gamified.service';

@Controller({
  path: 'gamified',
  version: VERSION_NEUTRAL,
})
@ApiTags('GAMIFIED')
@ApiBearerAuth()
export class GamifiedController {
  constructor(private readonly gamifiedService: GamifiedService) {}

  @Post('onboarding')
  @ApiOperation({ summary: 'Get user onboarding questions' })
  @ApiBody({ type: GamifieldOnboard })
  create(@Body() create: GamifieldOnboard, @SessionUser() user: AuthUser) {
    return this.gamifiedService.create(create, user);
  }

  @Post('tracker')
  @ApiOperation({ summary: 'Track user progess' })
  @ApiBody({ type: CreateGameProgress })
  trackerUserProgress(
    @Body() create: CreateGameProgress,
    @SessionUser() user: AuthUser,
  ) {
    return this.gamifiedService.trackUserProgress(create, user);
  }
}
