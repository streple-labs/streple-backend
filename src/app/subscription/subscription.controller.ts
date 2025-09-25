import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { SubscriptionService } from './service';
import { CancelSubscription, CreateSub, FindManySubscription } from './input';
import { SessionUser } from '@app/decorators';
import { AuthUser } from '@app/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller({ version: VERSION_NEUTRAL })
@ApiBearerAuth()
@ApiTags('Subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('create-subscription')
  @ApiOperation({ summary: 'Create new subscription for a user' })
  @ApiBody({ type: CreateSub })
  createSubscription(@Body() dto: CreateSub, @SessionUser() user: AuthUser) {
    return this.subscriptionService.createSubscription(dto, user);
  }

  @Post('cancel-subscription')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiBody({ type: CancelSubscription, required: false })
  cancelSubscription(
    @Body() dto: CancelSubscription,
    @SessionUser() user: AuthUser,
  ) {
    return this.subscriptionService.cancelSubscription(user, dto.reason);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Find Many subscriptions' })
  findManySubscription(@Query() query: FindManySubscription) {
    return this.subscriptionService.getUserSubscriptions(query);
  }

  @Get('subscription-history')
  @ApiOperation({ summary: 'Find Many history subscriptions' })
  findManySubscriptionHistory(@Query() query: FindManySubscription) {
    return this.subscriptionService.getSubscriptionHistory(query);
  }

  @Get('active-subscription')
  @ApiOperation({ summary: 'Get the active subscription of current user' })
  activeSubscription(@SessionUser() user: AuthUser) {
    return this.subscriptionService.getActiveSubscription(user);
  }
}
