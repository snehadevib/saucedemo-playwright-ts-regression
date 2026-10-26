import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInformationPage } from '../pages/CheckoutInformationPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { DynamicCatalogPage } from '../pages/DynamicCatalogPage';
import { CheckoutFlow } from '../flows/CheckoutFlow';

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
    /** Checkout step 1 (https://www.saucedemo.com/checkout-step-one.html). Not navigated automatically. */
    checkoutInformationPage: CheckoutInformationPage;
    /** Checkout step 2 (https://www.saucedemo.com/checkout-step-two.html). Not navigated automatically. */
    checkoutOverviewPage: CheckoutOverviewPage;
    /** Checkout complete (https://www.saucedemo.com/checkout-complete.html). Not navigated automatically. */
    checkoutCompletePage: CheckoutCompletePage;
    /** Dynamic Catalog demo pages (Lazy Load, Spinner, Slider). Opened through the menu. */
    dynamicCatalogPage: DynamicCatalogPage;
    /** Checkout steps shared by checkout tests (add products, fill information, finish). Starts on inventory. */
    checkout: CheckoutFlow;
    /** Runs automatically: attaches a screenshot to tests marked with knownBugInGate (see fixtures/known-bugs.ts). */
    knownBugEvidence: void;
};

/**
 * Extended test function: provides ready-made page objects to every test, so specs never create them manually.
 * Always import `test` and `expect` from this file, not from '@playwright/test'.
 */
export const test = base.extend<PageFixtures>({
    // A known-bug test that fails as expected counts as passed, so Playwright deletes its failure
    // screenshot, video and trace. Keep a screenshot as evidence of the bug instead.
    knownBugEvidence: [
        async ({ page }, use, testInfo) => {
            await use();
            const hasKnownBug = testInfo.annotations.some((a) => a.type === 'issue');
            if (hasKnownBug && !page.isClosed()) {
                await testInfo.attach('known-bug evidence', {
                    body: await page.screenshot({ fullPage: true }),
                    contentType: 'image/png',
                });
            }
        },
        { auto: true },
    ],
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
    checkoutInformationPage: async ({ page }, use) => {
        await use(new CheckoutInformationPage(page));
    },
    checkoutOverviewPage: async ({ page }, use) => {
        await use(new CheckoutOverviewPage(page));
    },
    checkoutCompletePage: async ({ page }, use) => {
        await use(new CheckoutCompletePage(page));
    },
    dynamicCatalogPage: async ({ page }, use) => {
        await use(new DynamicCatalogPage(page));
    },
    checkout: async (
        { inventoryPage, cartPage, checkoutInformationPage, checkoutOverviewPage, checkoutCompletePage },
        use,
    ) => {
        await use(
            new CheckoutFlow(
                inventoryPage,
                cartPage,
                checkoutInformationPage,
                checkoutOverviewPage,
                checkoutCompletePage,
            ),
        );
    },
});

/** Playwright's assertion library, re-exported so specs need only one import. */
export { expect } from '@playwright/test';

/** Page object types, re-exported for use in test helpers. */
export type { LoginPage } from '../pages/LoginPage';
export type { InventoryPage } from '../pages/InventoryPage';
export type { ProductDetailsPage } from '../pages/ProductDetailsPage';
export type { CartPage } from '../pages/CartPage';
export type { CheckoutInformationPage } from '../pages/CheckoutInformationPage';
export type { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
export type { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
export type { DynamicCatalogPage } from '../pages/DynamicCatalogPage';
