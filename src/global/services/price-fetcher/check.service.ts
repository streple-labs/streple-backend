import { Injectable } from '@nestjs/common';

@Injectable()
export class PriceChecker {
  constructor() {}

  checkTradingConditions(currentPrices: Record<string, number>) {
    console.log({ currentPrices, interval: new Date().toISOString() });
  }
}
