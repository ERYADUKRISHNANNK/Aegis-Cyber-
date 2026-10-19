import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { AdminPage } from "../pages/AdminPage";
import { DEFAULT_ADMIN, DEFAULT_USER } from "../utils/testHelpers";

test.describe("Aegis-Cyber Role-Based Authorization", () => {
  test("admin user can access /admin panel", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminPage(page);

    await loginPage.goto();
    await loginPage.login(DEFAULT_ADMIN.username, DEFAULT_ADMIN.password);
    await adminPage.goto();
    await adminPage.expectLoaded();
  });

  test("normal user is redirected away from /admin panel", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminPage(page);

    await loginPage.goto();
    await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
    await adminPage.goto();
    await adminPage.expectAccessDeniedOrRedirect();
  });
});
