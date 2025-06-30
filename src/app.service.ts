import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getInfo() {
    return {
      name: 'CopyTrading API',
      version: '1.0.0',
      status: 'OK',
      docs: '/docs',
      timestamp: new Date().toISOString(),
    };
  }
}
