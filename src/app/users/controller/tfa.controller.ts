import { AuthUser } from '@app/common';
import { SessionUser } from '@app/decorators';
import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { toDataURL } from 'qrcode';
import { TwoFaToken } from '../dto/top-up.dto';
import { TwoFAService } from '../service/twofa.service';

@Controller({
  path: 'user',
  version: VERSION_NEUTRAL,
})
@ApiBearerAuth()
@ApiTags('TwoFa Authentication')
export class TwoFaController {
  constructor(private twoFaService: TwoFAService) {}

  @Get('initiate-tfa-enabling')
  async initiateTfaEnabling(
    @SessionUser() user: AuthUser,
    @Res() response: Response,
  ): Promise<void> {
    const { secret, uri } = this.twoFaService.generateTfaSecret(user);
    await this.twoFaService.initiateTfaEnabling({
      email: user.email,
      secret,
    });

    toDataURL(uri, (error, dataUrl) => {
      if (error) throw error;
      response.send({ dataUrl, secret });
    });
  }

  @Post('enable-tfa')
  async enableTfa(
    @SessionUser() user: AuthUser,
    @Body() body: TwoFaToken,
  ): Promise<{ message: string }> {
    return this.twoFaService.enableTfaForUser({
      email: user.email,
      tfaToken: body.token,
    });
  }

  @Post('disable-tfa')
  async disableTfa(
    @SessionUser() user: AuthUser,
    @Body() body: TwoFaToken,
  ): Promise<{ message: string }> {
    return this.twoFaService.disableTfaForUser({
      email: user.email,
      tfaToken: body.token,
    });
  }
}
