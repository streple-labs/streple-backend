// src/file-processor/file-processor.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { SanitizeService } from './sanitize.service';
import { HtmlChunkerService } from './html-chunker.service';

@Injectable()
export class FileProcessorService {
  private readonly supportedFormats = ['.docx', '.doc', '.pdf'];
  constructor(
    private readonly sanitizeService: SanitizeService,
    private readonly htmlChunker: HtmlChunkerService,
  ) {}

  private isSupportedFormat(filename: string): boolean {
    return this.supportedFormats.some((format) =>
      filename.toLowerCase().endsWith(format),
    );
  }

  async extractTextFromDocx(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error);
      }
      throw new BadRequestException('Failed to process DOCX file');
    }
  }

  async extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
    try {
      const data = new PDFParse({ data: fileBuffer });
      const { text } = await data.getText();
      return text;
    } catch (error: unknown) {
      // Proper error handling without unsafe returns
      if (error instanceof Error) {
        console.error('PDF processing error:', error.message);
        throw new BadRequestException(
          `Failed to process PDF file: ${error.message}`,
        );
      }
      throw new BadRequestException('Failed to process PDF file');
    }
  }

  async processCourseDocument(
    fileBuffer: Buffer,
    originalname: string,
  ): Promise<string> {
    let html: string;

    if (originalname.endsWith('.docx')) {
      const result = await mammoth.convertToHtml({ buffer: fileBuffer });
      html = result.value;
    } else if (originalname.endsWith('.pdf')) {
      const data = new PDFParse({ data: fileBuffer });
      const { text } = await data.getText();
      html = `<div>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`;
    } else {
      throw new Error('Unsupported file type');
    }

    const sanitized = this.sanitizeService.sanitize(html);
    // return this.htmlChunker.chunkHtml(sanitized);
    return sanitized;
  }

  processCourseContent(content: string): string {
    try {
      const sanitized = this.sanitizeService.sanitize(content);
      // return this.htmlChunker.chunkHtml(sanitized);
      return sanitized;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Content processing failed:', error.message);
        throw new BadRequestException(
          `Failed to process content: ${error.message}`,
        );
      }
      throw new BadRequestException('Failed to process content');
    }
  }
}
