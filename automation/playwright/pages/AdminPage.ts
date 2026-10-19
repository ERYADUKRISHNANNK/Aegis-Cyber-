import { Page, expect } from "@playwright/test";

export class AdminPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/admin");
    await this.page.waitForLoadState("networkidle");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*\/admin/);
    await expect(this.page.locator("text=System Administration Panel")).toBeVisible({ timeout: 10000 });
  }

  async expectAccessDeniedOrRedirect() {
    // Non-admin should be redirected to /dashboard or /login or see forbidden
    await expect(this.page).not.toHaveURL(/.*\/admin/);
  }
}
