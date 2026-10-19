import { Page, expect } from "@playwright/test";

export class VaultPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/vault");
    await this.page.waitForLoadState("networkidle");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*\/vault/);
    await expect(
      this.page.locator("text=Secure Decentralized File Vault")
    ).toBeVisible({ timeout: 10000 });
  }

  async uploadFile(filePath: string) {
    const fileChooserPromise = this.page.waitForEvent("filechooser");
    await this.page.click('text="Select file"');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  async uploadFileDirect(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  async getFileRows() {
    return this.page.locator("table tbody tr");
  }

  async expectFileListed(fileName: string) {
    await expect(
      this.page.locator(`table tbody tr:has-text("${fileName}")`).first()
    ).toBeVisible({ timeout: 15000 });
  }

  async openShareModal(fileName: string) {
    const row = this.page.locator(`table tbody tr:has-text("${fileName}")`).first();
    const shareBtn = row.locator("button").filter({ has: this.page.locator("svg.lucide-share-2, svg") }).last();
    await shareBtn.click();
    await expect(this.page.locator("text=Dynamic Access Policy")).toBeVisible({ timeout: 5000 });
  }

  async shareWithUser(targetUsername: string) {
    await this.page.fill('input[placeholder="Enter username"]', targetUsername);
    await this.page.click('button:has-text("Deploy sharing policy")');
  }

  async generateShareLink(): Promise<string> {
    await this.page.click('button:has-text("Generate")');
    const generateBtn = this.page.locator('button:has-text("Generate QR Share Link")');
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
    }
    const linkLocator = this.page.locator("span.font-mono.text-cyber-cyan\\/70");
    await linkLocator.waitFor({ timeout: 10000 });
    return (await linkLocator.textContent()) || "";
  }

  async closeShareModal() {
    await this.page.click('button:has-text("✕")');
  }

  async refreshList() {
    await this.page.click('button:has-text("Refresh")');
  }
}
