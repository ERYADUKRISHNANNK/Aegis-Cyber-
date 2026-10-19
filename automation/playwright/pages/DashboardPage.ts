import { Page, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/dashboard");
    await this.page.waitForLoadState("networkidle");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*\/dashboard/);
    await expect(this.page.locator("text=Aegis Fusion").or(this.page.locator("text=Security Operations Center"))).toBeVisible({ timeout: 10000 });
  }

  async logout() {
    // Look for logout button in sidebar/header
    const logoutBtn = this.page.locator('button:has-text("Logout"), button:has-text("Disconnect"), button[title="Logout"]').first();
    await logoutBtn.click();
    await this.page.waitForURL(/.*\/login/, { timeout: 10000 });
  }
}
