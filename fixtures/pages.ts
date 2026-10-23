import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * All page objects that tests can request by name
 */
type PageFixtures = {
    /** Login page object (https://www.saucedemo.com/). Not navigated automatically. */
    loginPage: LoginPage;
    /** Inventory page object (https://www.saucedemo.com/inventory.html). Not navigated automatically. */
    inventoryPage: InventoryPage;
};

/**
 * Extended test function: provides ready-made page objects to every test, so specs never create them manually.
 * Always import `test` and `expect` from this file, not from '@playwright/test'.
 */
export const test = base.extend<PageFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    inventoryPage: async ({ page }, use) => {
        await use(new InventoryPage(page));
    },
});

/** Playwright's assertion library, re-exported so specs need only one import. */
export { expect } from '@playwright/test';

/** Page object types, re-exported for use in test helpers. */
export type { LoginPage } from '../pages/LoginPage';
export type { InventoryPage } from '../pages/InventoryPage';
