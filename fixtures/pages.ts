import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { CartPage } from '../pages/CartPage';

/**
 * All page objects that tests can request by name
 */
type PageFixtures = {
    /** Login page object (https://www.saucedemo.com/). Not navigated automatically. */
    loginPage: LoginPage;
    /** Inventory page object (https://www.saucedemo.com/inventory.html). Not navigated automatically. */
    inventoryPage: InventoryPage;
    /** Product details page object (https://www.saucedemo.com/inventory-item.html?id=N). Not navigated automatically. */
    productDetailsPage: ProductDetailsPage;
    /** Cart page object (https://www.saucedemo.com/cart.html). Not navigated automatically. */
    cartPage: CartPage;
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
    productDetailsPage: async ({ page }, use) => {
        await use(new ProductDetailsPage(page));
    },
    cartPage: async ({ page }, use) => {
        await use(new CartPage(page));
    },
});

/** Playwright's assertion library, re-exported so specs need only one import. */
export { expect } from '@playwright/test';

/** Page object types, re-exported for use in test helpers. */
export type { LoginPage } from '../pages/LoginPage';
export type { InventoryPage } from '../pages/InventoryPage';
export type { ProductDetailsPage } from '../pages/ProductDetailsPage';
export type { CartPage } from '../pages/CartPage';
