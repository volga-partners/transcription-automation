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

  async loginAs(email: string, password: string): Promise<void> {
    await this.navigate();
    await this.login(email, password);
    await this.expectLoginSuccess();
  }

  async expectSignedIn(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /Sign out/i })).toBeVisible({
      timeout: 30000,
    });
  }
}
