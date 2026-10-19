import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DEFAULT_ADMIN } from "../utils/testHelpers";

test.describe("Aegis-Cyber Authentication & Route Protection", () => {
  test("unauthenticated user is redirected to /login when accessing protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*\/login/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/.*\/login/);

    await page.goto("/vault");
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("login with invalid credentials displays error message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("non_existent_user_999", "wrong_password_123");
    const error = await loginPage.getErrorMessage();
    expect(error.length).toBeGreaterThan(0);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("admin user can login and access dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(DEFAULT_ADMIN.username, DEFAULT_ADMIN.password);
    await dashboardPage.expectLoaded();
  });
});
