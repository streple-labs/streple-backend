import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';
import { HttpClientService } from '../httpclient';

@Injectable()
export class MailService {
  constructor(private readonly httpClientService: HttpClientService) {}

  public async sendMail(
    email: string,
    templateName: string,
    subject: string,
    context: Record<string, any>,
    withReply?: boolean,
  ) {
    try {
      const templateFile = path.resolve(
        __dirname,
        'templates',
        `${templateName}.hbs`,
      );
      const templateHtml = fs.readFileSync(templateFile, 'utf8');

      const compiledTemplate = handlebars.compile(templateHtml);
      const html = compiledTemplate(context);

      const response = await this.httpClientService.postData({
        uri: 'https://streple-mailer.vercel.app/send-mail',
        body: {
          email,
          subject,
          context: html,
          withReply,
        },
      });
      console.log(response);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException({
        status: false,
        message: 'Failed to send email please try again',
        error: 'Server Error',
        statusCode: 500,
      });
    }
  }
}
