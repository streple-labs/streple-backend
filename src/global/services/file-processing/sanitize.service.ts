import { Injectable } from '@nestjs/common';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

@Injectable()
export class SanitizeService {
  private readonly domPurify: typeof DOMPurify;

  constructor() {
    // Initialize DOMPurify with JSDOM window
    const { window } = new JSDOM('<!DOCTYPE html>');
    this.domPurify = DOMPurify(window);
  }

  sanitize(html: string): string {
    return this.domPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'b',
        'i',
        'strong',
        'em',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'div',
      ],
      ALLOWED_ATTR: ['class', 'style'], // Only allow these attributes
      FORBID_ATTR: ['onerror', 'onload'], // Explicitly block these
    });
  }
}
