import { Page } from '@playwright/test';
import { waitForStablePage } from '@utils/selectors';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;

    page.on('pageerror', (error) => {
      const msg = error.message || '';
      const suppressed = [
        'ResizeObserver loop',
        'hydration',
        'ChunkLoadError',
        'networkidle',
      ];
      if (suppressed.some((keyword) => msg.includes(keyword))) {
        return;
      }
      console.error('Page error:', error);
    });
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await waitForStablePage(this.page);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
