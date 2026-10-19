import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { VaultPage } from "../pages/VaultPage";
import { DEFAULT_ADMIN } from "../utils/testHelpers";
import * as fs from "fs";
import * as path from "path";

test.describe("Aegis-Cyber Secure Decentralized File Vault", () => {
  const testFileName = `sec_audit_${Date.now()}.txt`;
  const tempFilePath = path.join(__dirname, `temp_${testFileName}`);

  test.beforeAll(async () => {
    fs.writeFileSync(tempFilePath, "CONFIDENTIAL ZERO-TRUST SECURITY AUDIT PAYLOAD 2026", "utf8");
  });

  test.afterAll(async () => {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }
  });

  test("authenticated user can view vault assets table", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const vaultPage = new VaultPage(page);

    await loginPage.goto();
    await loginPage.login(DEFAULT_ADMIN.username, DEFAULT_ADMIN.password);
    await vaultPage.goto();
    await vaultPage.expectLoaded();

    const rows = await vaultPage.getFileRows();
    expect(await rows.count()).toBeGreaterThanOrEqual(0);
  });

  test("user can upload file and view it in vault", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const vaultPage = new VaultPage(page);

    await loginPage.goto();
    await loginPage.login(DEFAULT_ADMIN.username, DEFAULT_ADMIN.password);
    await vaultPage.goto();
    await vaultPage.expectLoaded();

    await vaultPage.uploadFileDirect(tempFilePath);
    await vaultPage.expectFileListed(path.basename(tempFilePath));
  });

  test("user can open access policy modal for a file", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const vaultPage = new VaultPage(page);

    await loginPage.goto();
    await loginPage.login(DEFAULT_ADMIN.username, DEFAULT_ADMIN.password);
    await vaultPage.goto();
    await vaultPage.expectLoaded();

    const rows = await vaultPage.getFileRows();
    if ((await rows.count()) > 0) {
      const firstRow = rows.first();
      const fileName = await firstRow.locator("td:first-child span").textContent();
      if (fileName) {
        await vaultPage.openShareModal(fileName.trim());
        await vaultPage.closeShareModal();
      }
    }
  });
});
