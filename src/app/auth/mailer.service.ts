// src/auth/mailer.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.MAIL_USER) {
  throw new Error('Missing MAIL_USER in environment variables');
}

if (!process.env.MAIL_PASS) {
  throw new Error('Missing MAIL_PASS in environment variables');
}

type OtpPurpose = 'verify' | 'reset';

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER as string,
      pass: process.env.MAIL_PASS as string,
    },
  });

  async sendOtpEmail(to: string, otp: string, purpose: OtpPurpose) {
    const verifySubject = `[Streple] Verify Your Email Address to Complete Registration`;
    const verifyText = `
    [Streple] Email Verification Code\n\n
    Thanks for signing up on Streple.\n\n
    Your verification code is: ${otp}\n\n
    This code expires in 10 minutes. Do not share it with anyone.\n\n
    If you did not create an account, please ignore this message.\n\n
    —
    \nStreple.com
    `;

    const resetSubject = `[Streple] Password Reset Request`;
    const resetText = `
      [Streple] Password Reset Code\n\n
      We received a request to reset the password for your Streple account.\n\n
      Your password reset code is: ${otp}\n\n
      This code expires in 10 minutes. Do not share it with anyone.\n\n
      If you did not request a password reset, please ignore this message.\n\n
      —
      \nStreple.com
    `;

    const subject = purpose === 'verify' ? verifySubject : resetSubject;
    const text = purpose === 'verify' ? verifyText : resetText;
    const html =
      purpose === 'verify'
        ? this.generateVerifyHtml(otp)
        : this.generateResetHtml(otp);

    try {
      await this.transporter.sendMail({
        from: `"Streple" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.log(`Failed to send OTP email to ${to}:`, error);
    }
  }

  private generateVerifyHtml(otp: string): string {
    const currentYear = new Date().getFullYear();
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Streple Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="600" style="background-color: #ffffff; border-radius: 8px; padding: 40px;">
              <tr>
                <td align="center" style="font-size: 24px; font-weight: bold; color: #333;">
                  Verify Your Email Address
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 16px; color: #555;">
                  Thank you for signing up on <strong>Streple</strong>. To complete your registration and secure your
                  account, please verify your email address.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 16px; color: #555;">
                  Your One-Time Password (OTP) is:
                </td>
              </tr>
              <tr>
                <td style="padding-top: 10px; font-size: 28px; font-weight: bold; color: #000;">
                  ${otp}
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 14px; color: #888;">
                  This code will expire in 10 minutes. Do not share this code with anyone.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 14px; color: #888;">
                  If you did not request this, please ignore this email.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 40px; font-size: 12px; color: #aaa;">
                  This is an automated message from <a href="https://www.streple.com" style="color: #888;">Streple.com</a>,
                  please do not reply.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 10px; font-size: 11px; color: #ccc;">
                  &copy; ${currentYear} Streple. All Rights Reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  private generateResetHtml(otp: string): string {
    const currentYear = new Date().getFullYear();
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Streple Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="600" style="background-color: #ffffff; border-radius: 8px; padding: 40px;">
              <tr>
                <td align="center" style="font-size: 24px; font-weight: bold; color: #333;">
                  Reset Your Password
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 16px; color: #555;">
                  We received a request to reset the password associated with your <strong>Streple</strong> account.
                  Use the One-Time Password (OTP) below to proceed with resetting your password.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 16px; color: #555;">
                  Your One-Time Password (OTP) is:
                </td>
              </tr>
              <tr>
                <td style="padding-top: 10px; font-size: 28px; font-weight: bold; color: #000;">
                  ${otp}
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 14px; color: #888;">
                  This code will expire in 10 minutes. Do not share this code with anyone.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 14px; color: #888;">
                  If you did not request a password reset, you can safely ignore this email.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 40px; font-size: 12px; color: #aaa;">
                  This is an automated message from <a href="https://www.streple.com" style="color: #888;">Streple.com</a>,
                  please do not reply.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 10px; font-size: 11px; color: #ccc;">
                  &copy; ${currentYear} Streple. All Rights Reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }
}
