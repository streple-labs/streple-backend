import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  public async uploadDocument(
    file: Express.Multer.File,
    folderPath: 'images' | 'documents' | 'video' = 'images',
  ): Promise<string> {
    // eslint-disable-next-line no-useless-catch
    try {
      const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}-${this.joinName(file.originalname)}`;

      const s3Key = `${folderPath}/${uniqueFileName}`;
      const bucketName = this.configService.getOrThrow('AWS_BUCKET_NAME');
      const s3Params = {
        Bucket: bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read',
      };

      await this.s3Client.send(new PutObjectCommand(s3Params));

      // return `https://${bucketName}.s3.${this.configService.getOrThrow('AWS_REGION')}.amazonaws.com/${s3Key}`;
      return `https://d38slanwovjv7z.cloudfront.net/${s3Key}`;
    } catch (error) {
      throw error;
    }
  }

  private joinName(name: string): string {
    return name.replace(/\s+/g, '-');
  }
}
