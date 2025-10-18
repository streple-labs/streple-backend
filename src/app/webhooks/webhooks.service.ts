import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import * as crypto from 'crypto';
import { WebHookLog } from './entity';
import { Repository } from 'typeorm';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  constructor(
    @InjectRepository(WebHookLog)
    private readonly webhookLog: Repository<WebHookLog>,
    private eventEmitter: EventEmitter2,
  ) {}

  async processCircleEvent(payload: Buffer, keyId: string, signature: string) {
    try {
      // catch the public key
      // const { data } = await this.httpClient.fetchData<PublicKeyResponse>({
      //   uri: `https://api.circle.com/v2/notifications/publicKey/${keyId}`,
      //   headers: {
      //     Authorization: `Bearer ${this.configService.getOrThrow('CIRCLE_API_KEY')}`,
      //   },
      // });

      const JsonString = payload.toString('utf8');
      const JsonData = JSON.parse(JsonString);

      // Verify Circle webhook signature
      if (!this.verifyCircleSignature(JSON.stringify(JsonData), signature)) {
        throw new UnauthorizedException('Invalid signature');
      }

      // console.log(JsonData);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      void this.webhookLog.save(this.webhookLog.create(JsonData));
      this.logger.log(`Processing Circle event: ${JsonData.notificationType}`);

      // Emit internal events based on webhook type
      switch (JsonData.notificationType) {
        case 'transactions.outbound':
          await this.eventEmitter.emitAsync('tnx.outbound', JsonData);
          break;
        case 'transactions.inbound':
          await this.eventEmitter.emitAsync('tnx.inbound', JsonData);
          break;
        case 'webhooks.test':
          await this.eventEmitter.emitAsync('web.text', JsonData);
          break;
      }
      return { status: 'processed', JsonData };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private verifyCircleSignature(payload: string, signature: string): boolean {
    // Load the public key from the base64 encoded string
    // Note: The public key is static for a given publicKeyId, therefore we recommend you to cache it
    const publicKeyBase64 =
      'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAESl76SZPBJemW0mJNN4KTvYkLT8bOT4UGhFhzNk3fJqf6iuPlLQLq533FelXwczJbjg2U1PHTvQTK7qOQnDL2Tg==';
    const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');
    const publicKey = crypto.createPublicKey({
      key: publicKeyBytes,
      format: 'der',
      type: 'spki',
    });

    // Load the signature you want to verify
    const signatureBytes = Buffer.from(signature, 'base64');

    // Load the message you want to verify
    const messageBytes = Buffer.from(payload);

    // Verify the signature
    const isSignatureValid = crypto.verify(
      'sha256',
      messageBytes,
      publicKey,
      signatureBytes,
    );

    if (!isSignatureValid) return false;
    return true;
  }
}

// data: {
//   id: '879dc113-5ca4-4ff7-a6b7-54652083fcf8',
//   algorithm: 'ECDSA_SHA_256',
//   publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAESl76SZPBJemW0mJNN4KTvYkLT8bOT4UGhFhzNk3fJqf6iuPlLQLq533FelXwczJbjg2U1PHTvQTK7qOQnDL2Tg==',
//   createDate: '2023-06-28T21:47:35.107250Z'
// }
