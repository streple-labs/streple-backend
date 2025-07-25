import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';

@Injectable()
export class HtmlChunkerService {
  private readonly chunkSize: number = 255; // Target words per chunk

  chunkHtml(html: string): string[] {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let wordCount = 0;

    const traverse = (node: Node) => {
      if (node.nodeType === dom.window.Node.TEXT_NODE) {
        const text = node.textContent || '';
        const words = text.split(/\s+/).filter((w) => w.length > 0);

        if (wordCount + words.length <= this.chunkSize) {
          currentChunk.push(node.textContent || '');
          wordCount += words.length;
        } else {
          // Handle overflow
          const remainingWords = this.chunkSize - wordCount;
          const splitPoint = text
            .split(/\s+/)
            .reduce((acc, word) => {
              if (acc.length < remainingWords) return [...acc, word];
              return acc;
            }, [] as string[])
            .join(' ').length;

          const firstPart = text.substring(0, splitPoint);
          const secondPart = text.substring(splitPoint);

          if (firstPart.trim()) {
            currentChunk.push(firstPart);
            chunks.push(this.wrapChunk(currentChunk));
          }

          // Reset for new chunk
          currentChunk = [secondPart];
          wordCount = secondPart
            .split(/\s+/)
            .filter((w) => w.length > 0).length;
        }
      } else if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const attrs = Array.from(element.attributes)
          .map((attr) => `${attr.name}="${attr.value}"`)
          .join(' ');

        currentChunk.push(`<${tagName}${attrs ? ' ' + attrs : ''}>`);
        Array.from(node.childNodes).forEach(traverse);
        currentChunk.push(`</${tagName}>`);
      }
    };

    Array.from(document.body.childNodes).forEach(traverse);

    // Add the last chunk if it has content
    if (currentChunk.length > 0 || wordCount > 0) {
      chunks.push(this.wrapChunk(currentChunk));
    }

    return chunks;
  }

  private wrapChunk(chunkParts: string[]): string {
    const chunkContent = chunkParts.join('');
    return `<div class="content-chunk">${chunkContent}</div>`;
  }

  private getWordCount(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }
}
