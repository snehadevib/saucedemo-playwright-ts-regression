import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { KNOWN_DEFECTS } from '../test-data/known-defects';
import { type TestUser } from '../test-data/users';

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
    /** Runs automatically: adds a "bug" annotation when this test + user is in KNOWN_DEFECTS. */
    knownDefectAnnotation: void;
};

/**
 * Extended test function: provides ready-made page objects to every test, so specs never create them manually.
 * Always import `test` and `expect` from this file, not from '@playwright/test'.
 */
export const test = base.extend<PageFixtures>({
    knownDefectAnnotation: [
        // Playwright requires the object pattern here even when no other fixtures are used
        async ({}, use, testInfo) => {
            const user = (testInfo.project.metadata as { user?: TestUser }).user;
            const testId = /^[A-Za-z]+-\d{3}/.exec(testInfo.title)?.[0];

            for (const defect of KNOWN_DEFECTS) {
                if (defect.testId === testId && (defect.user === 'all' || defect.user === user)) {
                    testInfo.annotations.push({
                        type: 'bug',
                        description: `${defect.bug}: ${defect.description}`,
                    });
                }
            }
            await use();
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
});

/** Playwright's assertion library, re-exported so specs need only one import. */
export { expect } from '@playwright/test';

/** Page object types, re-exported for use in test helpers. */
export type { LoginPage } from '../pages/LoginPage';
export type { InventoryPage } from '../pages/InventoryPage';
export type { ProductDetailsPage } from '../pages/ProductDetailsPage';
