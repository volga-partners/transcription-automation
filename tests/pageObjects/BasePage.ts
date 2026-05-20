import { Page } from '@playwright/test';
import { waitForStablePage } from '@utils/selectors';

type ManagedPage = Page & {
  __overlayHandlersRegistered?: boolean;
};

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
    const managedPage = page as ManagedPage;

    if (!managedPage.__overlayHandlersRegistered) {
      managedPage.__overlayHandlersRegistered = true;
      void this.registerOverlayHandlers();
    }

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

  private async registerOverlayHandlers(): Promise<void> {
    await this.page.addLocatorHandler(this.page.getByRole('dialog', { name: /Audio editor/i }), async () => {
      const close = this.page.getByRole('dialog', { name: /Audio editor/i }).getByRole('button', {
        name: /Close/i,
      });
      if (await close.isVisible().catch(() => false)) {
        await close.click();
      }
    });

    await this.page.addLocatorHandler(
      this.page.getByRole('dialog', { name: /Transcription Complete!/i }),
      async () => {
        const dialog = this.page.getByRole('dialog', { name: /Transcription Complete!/i });
        const close = dialog.getByRole('button', { name: /Close/i });
        if (await close.isVisible().catch(() => false)) {
          await close.click();
        }
      },
    );

    await this.page.addLocatorHandler(
      this.page.getByRole('button', { name: /Hide workflow guide/i }),
      async (button) => {
        if (await button.isVisible().catch(() => false)) {
          await button.click();
        }
      },
    );
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await waitForStablePage(this.page);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
