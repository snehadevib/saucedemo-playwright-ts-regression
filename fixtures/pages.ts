import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// All page objects that tests can request by name
type PageFixtures = {
  loginPage: LoginPage;
};

/**
 * Extended test function: provides ready-made page objects to every test.
 */
export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';