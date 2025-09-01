import * as WebSocket from 'ws';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PriceCache } from './price-caches';
import { PriceChecker } from './check.service';

@Injectable()
export class BinanceGateway implements OnModuleInit {
  private ws: WebSocket;
  private readonly symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];

  constructor(
    private readonly priceCache: PriceCache,
    private readonly priceChecker: PriceChecker,
  ) {}

  onModuleInit() {
    const stream = this.symbols
      .map((s) => `${s.toLowerCase()}@trade`)
      .join('/');
    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

    this.ws.on('message', (buf: Buffer) => {
      try {
        const data: { s: string; p: string } = JSON.parse(buf.toString());
        const symbol = data.s;
        const price = parseFloat(data.p);

        // Update cache and check if significant change occurred
        const shouldUpdate = this.priceCache.set(symbol, price);

        if (shouldUpdate) {
          // Get all current prices and check trading conditions
          const currentPrices = this.priceCache.getAllPrices();
          this.priceChecker.checkTradingConditions(currentPrices);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    this.ws.on('error', console.error);
    this.ws.on('close', () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => this.onModuleInit(), 5000);
    });
  }
}
