# Aegis-Cyber Automation Setup & Guide

This document describes the automated testing and browser automation tools for Aegis-Cyber.

## Architecture

The automation suite is located under `automation/playwright/`:

```
automation/playwright/
├── config/
│   └── playwright.config.ts    # Central Playwright runner configuration
├── fixtures/
│   └── auth.fixture.ts        # Reusable authenticated browser context fixture
├── pages/
│   ├── LoginPage.ts           # Login Page Object Model
│   ├── DashboardPage.ts       # Dashboard Page Object Model
│   ├── VaultPage.ts           # File Vault Page Object Model
│   └── AdminPage.ts           # Admin Panel Page Object Model
├── tests/
│   ├── auth.spec.ts           # End-to-end authentication and zero-trust tests
│   ├── admin.spec.ts          # Admin role guard and user management tests
│   └── vault.spec.ts          # File upload and provenance tests
├── utils/
│   └── testHelpers.ts         # Environment and service readiness checkers
└── README.md                  # Quick usage guide
```

## Running the Automation Suite

### 1. Prerequisites

Ensure frontend (`http://localhost:3000`) and backend (`http://localhost:5000`) are running.

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Run E2E Tests

From root:
```bash
npm run test:e2e
```

Or directly via Playwright:
```bash
npx playwright test --config=automation/playwright/config/playwright.config.ts
```

To run in headed (visible) mode:
```bash
npx playwright test --config=automation/playwright/config/playwright.config.ts --headed
```

## Automation Helpers

### Desktop Shortcut
To create a Windows desktop shortcut for launching Aegis-Cyber services:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\create_desktop_shortcut.ps1
```

### Bookmarklet
For rapid development testing, open [docs/setup/quick_login_bookmarklet.html](quick_login_bookmarklet.html) in your browser and drag the link to your bookmarks bar.
