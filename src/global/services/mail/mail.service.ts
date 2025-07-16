import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow('MAIL_HOST'),
      port: this.config.getOrThrow('MAIL_PORT'),
      secure: true,
      auth: {
        user: this.config.getOrThrow('MAIL_USER'),
        pass: this.config.getOrThrow('MAIL_PASS'),
      },
      pool: true,
    });
  }

  public async sendMail(
    email: string,
    templateName: string,
    subject: string,
    context: Record<string, any>,
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

      // Email details
      const mailDetails = {
        from: `"Streple" <${this.config.getOrThrow('MAIL_USER')}>`,
        to: email,
        subject: subject,
        html: html,
      };

      // Send email
      const info = await this.transporter.sendMail(mailDetails);
      console.log('Email sent successfully:', info.response);
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
