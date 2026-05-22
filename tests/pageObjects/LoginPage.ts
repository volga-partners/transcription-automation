import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByPlaceholder('you@example.com');
    this.passwordInput = page.getByPlaceholder('Enter password');
    this.signInButton = page.getByRole('button', { name: /^Sign in$/ });
  }

  async navigate(): Promise<void> {
    await this.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await expect(this.emailInput).toBeVisible({ timeout: 30000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectLoginSuccess(): Promise<void> {
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 45000,
      waitUntil: 'domcontentloaded',
    });
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  }

  /** Clears an existing session so credentials can be entered on /login. */
  private async ensureLoginFormReady(): Promise<void> {
    await this.navigate();

    const switchAccountButton = this.page.getByRole('button', {
      name: /Sign out.*use another account/i,
    });
    if (await switchAccountButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await switchAccountButton.click();
      await expect(this.emailInput).toBeVisible({ timeout: 30000 });
      return;
    }

    if (await this.emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      return;
    }

    // Rare fallback when /login redirects before the form renders.
    await this.navigate();
    await expect(this.emailInput).toBeVisible({ timeout: 30000 });
  }

  async loginAs(email: string, password: string): Promise<void> {
    await this.ensureLoginFormReady();
    await this.login(email, password);
    await this.expectLoginSuccess();
  }

  async expectSignedIn(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /Sign out/i })).toBeVisible({
      timeout: 30000,
    });
  }
}
