import { test as base, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DEFAULT_ADMIN, DEFAULT_USER } from "../utils/testHelpers";

type AuthFixtures = {
  adminPage: Page;
  userPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(DEFAULT_ADMIN.username, DEFAULT_ADMIN.password);
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await use(page);
    await context.close();
  },
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await use(page);
    await context.close();
  }
});

export { expect } from "@playwright/test";
