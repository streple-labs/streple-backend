import { Injectable } from '@nestjs/common';

@Injectable()
export class PriceCache {
  private currentPrices = new Map<string, number>();
  private readonly UPDATE_THRESHOLD = 0.002;

  set(symbol: string, price: number): boolean {
    const normalizedSymbol = symbol.toUpperCase();
    const currentPrice = this.currentPrices.get(normalizedSymbol);

    // If no previous price or significant change, update
    if (!currentPrice || this.isSignificantChange(currentPrice, price)) {
      this.currentPrices.set(normalizedSymbol, price);
      return true;
    }
    return false;
  }

  private isSignificantChange(oldPrice: number, newPrice: number): boolean {
    const change = Math.abs((newPrice - oldPrice) / oldPrice);
    return change >= this.UPDATE_THRESHOLD;
  }

  getAllPrices(): Record<string, number> {
    return Object.fromEntries(this.currentPrices);
  }

  getPrice(symbol: string): number | undefined {
    return this.currentPrices.get(symbol.toUpperCase());
  }
}
