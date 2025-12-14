// lib/receipt/pdf.service.ts
// Сервис генерации PDF через Puppeteer
import puppeteer, { type Browser } from 'puppeteer';

export class PdfService {
  private static browser: Browser | null = null;

  /**
   * Получение или создание браузера
   */
  private static async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Генерация PDF из HTML
   */
  static async generatePdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Устанавливаем контент
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Генерируем PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  /**
   * Закрытие браузера (для graceful shutdown)
   */
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
