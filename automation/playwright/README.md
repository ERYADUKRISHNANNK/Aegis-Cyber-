# Aegis-Cyber Playwright Automation Suite

Production-ready end-to-end browser automation suite for Aegis-Cyber.

## Directory Structure

- `config/`: Playwright configuration (`playwright.config.ts`)
- `pages/`: Page Object Models (`LoginPage.ts`, `DashboardPage.ts`, `AdminPage.ts`)
- `tests/`: End-to-end specifications (`auth.spec.ts`, `admin.spec.ts`)
- `utils/`: Test helpers and service readiness checks (`testHelpers.ts`)

## Commands

```bash
# Run tests headless
npx playwright test --config=automation/playwright/config/playwright.config.ts

# Run tests in headed browser
npx playwright test --config=automation/playwright/config/playwright.config.ts --headed

# View HTML report
npx playwright show-report
```
