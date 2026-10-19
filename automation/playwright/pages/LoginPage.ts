import { Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async login(username: string, password: string) {
    await this.page.fill('input[placeholder="Enter username"]', username);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button:has-text("Verify identity gateway")');
  }

  async getErrorMessage(): Promise<string> {
    const errorBanner = this.page.locator("div.border-red-800\\/70 span");
    await errorBanner.waitFor({ timeout: 5000 });
    return (await errorBanner.textContent()) || "";
  }

  async expectOnLoginPage() {
    await expect(this.page).toHaveURL(/.*\/login/);
  }
}
