import {
    test,
    expect,
    type InventoryPage,
    type ProductDetailsPage,
    type CartPage,
    type CheckoutInformationPage,
    type CheckoutOverviewPage,
    type CheckoutCompletePage,
} from '../fixtures/pages';
import { KNOWN_BUGS, knownBugInGate } from '../fixtures/known-bugs';
import { type CheckoutFlow } from '../flows/CheckoutFlow';
import { type BasePage } from '../pages/BasePage';
import { PRODUCTS } from '../test-data/products';
import { CUSTOMERS } from '../test-data/checkout';
import { ABOUT_URL, DYNAMIC_CATALOG, MENU_ITEMS } from '../test-data/menu';
import { LOGIN_ERRORS } from '../test-data/messages';

const [first] = PRODUCTS;
const customer = CUSTOMERS.standard;

// The page objects a test needs to reach any logged-in page
type Fixtures = {
    inventoryPage: InventoryPage;
    productDetailsPage: ProductDetailsPage;
    cartPage: CartPage;
    checkout: CheckoutFlow;
    checkoutInformationPage: CheckoutInformationPage;
    checkoutOverviewPage: CheckoutOverviewPage;
    checkoutCompletePage: CheckoutCompletePage;
};

// Every logged-in page that shows the menu, and how a test reaches it from the inventory page
const PAGES: Record<string, (f: Fixtures) => Promise<BasePage>> = {
    inventory: ({ inventoryPage }) => Promise.resolve(inventoryPage),
    'product details': async ({ inventoryPage, productDetailsPage }) => {
        await productDetailsPage.openBy(inventoryPage.productCard(first.name).nameLink);
        return productDetailsPage;
    },
    cart: async ({ inventoryPage, cartPage }) => {
        await cartPage.openBy(inventoryPage.cartLink);
        return cartPage;
    },
    'checkout information': async ({ checkout, checkoutInformationPage }) => {
        await checkout.start([first]);
        return checkoutInformationPage;
    },
    'checkout overview': async ({ checkout, checkoutOverviewPage }) => {
        await checkout.reachOverview([first], customer);
        return checkoutOverviewPage;
    },
    'checkout complete': async ({ checkout, checkoutCompletePage }) => {
        await checkout.placeOrder([first], customer);
        return checkoutCompletePage;
    },
};
const pageNames = Object.keys(PAGES);

test.describe('Menu', () => {
    // Already logged in; every test starts on the inventory page with an empty cart
    test.beforeEach(async ({ inventoryPage }) => {
        await inventoryPage.goto();
    });

    // Data-driven: the menu is the same component on every page, so check that it is there and complete
    for (const pageName of pageNames) {
        test(
            `Menu-001: the menu opens, lists all items and closes (${pageName} page)`,
            { tag: ['@regression'] },
            async ({
                inventoryPage,
                productDetailsPage,
                cartPage,
                checkout,
                checkoutInformationPage,
                checkoutOverviewPage,
                checkoutCompletePage,
            }) => {
                // Playwright needs the fixtures listed explicitly; collect them for the page map
                const fixtures = {
                    inventoryPage,
                    productDetailsPage,
                    cartPage,
                    checkout,
                    checkoutInformationPage,
                    checkoutOverviewPage,
                    checkoutCompletePage,
                };

                const currentPage = await test.step(`go to the ${pageName} page`, () =>
                    PAGES[pageName](fixtures));

                const { menu } = currentPage;

                await test.step('open the menu: all items are listed', async () => {
                    await menu.open();
                    await expect(menu.items, 'menu items in order').toHaveText([...MENU_ITEMS]);
                    await expect(menu.aboutLink, 'About leads to the Sauce Labs website').toHaveAttribute(
                        'href',
                        ABOUT_URL,
                    );
                });

                await test.step('close the menu with X', async () => {
                    await menu.close();
                    await expect(menu.logoutLink, 'menu is closed').toBeHidden();
                });
            },
        );
    }

    test(
        'Menu-002: logout returns to the login page and Back does not re-enter',
        { tag: ['@smoke', '@security'] },
        async ({ inventoryPage, loginPage }) => {
            await test.step('logout', async () => {
                await inventoryPage.menu.open();
                await loginPage.openBy(inventoryPage.menu.logoutLink);
                await expect(loginPage.page, 'on the login page').toHaveURL(loginPage.path);
            });

            await test.step('browser back: still logged out', async () => {
                await loginPage.goBack();
                await expect(loginPage.loginButton, 'login form shown').toBeVisible();
                await expect(loginPage.errorMessage, 'not-logged-in error').toHaveText(
                    LOGIN_ERRORS.notLoggedIn(inventoryPage.path),
                );
                await expect(inventoryPage.inventoryItems, 'no products shown').toHaveCount(0);
            });
        },
    );

    test(
        'Menu-003: Reset App State empties the cart',
        { tag: ['@regression'] },
        async ({ inventoryPage, cartPage }) => {
            await inventoryPage.addToCart(first.name);

            await test.step('reset app state', async () => {
                await inventoryPage.menu.resetAppState();
                await expect(inventoryPage.cartBadge, 'badge disappears').toBeHidden();
            });

            await test.step('cart is empty', async () => {
                await inventoryPage.menu.close();
                await cartPage.openBy(inventoryPage.cartLink);
                await expect(cartPage.cartItems, 'no items in the cart').toHaveCount(0);
            });
        },
    );

    test(
        'Menu-004: Reset App State resets the product buttons',
        { tag: ['@regression'] },
        async ({ inventoryPage }) => {
            // Confirmed by hand: the buttons only reset after a page reload
            knownBugInGate(KNOWN_BUGS.resetKeepsRemoveButtons);
            await inventoryPage.addToCart(first.name);

            await inventoryPage.menu.resetAppState();

            await expect(
                inventoryPage.productCard(first.name).addToCartButton,
                'button back to "Add to cart" without a reload',
            ).toBeVisible();
        },
    );

    // Data-driven: All Items only matters on pages other than inventory
    for (const pageName of pageNames.filter((name) => name !== 'inventory')) {
        test(
            `Menu-005: All Items returns to the inventory page (${pageName} page)`,
            { tag: ['@regression'] },
            async ({
                inventoryPage,
                productDetailsPage,
                cartPage,
                checkout,
                checkoutInformationPage,
                checkoutOverviewPage,
                checkoutCompletePage,
            }) => {
                // Playwright needs the fixtures listed explicitly; collect them for the page map
                const fixtures = {
                    inventoryPage,
                    productDetailsPage,
                    cartPage,
                    checkout,
                    checkoutInformationPage,
                    checkoutOverviewPage,
                    checkoutCompletePage,
                };

                const currentPage = await test.step(`go to the ${pageName} page`, () =>
                    PAGES[pageName](fixtures));

                await test.step('All Items', async () => {
                    await currentPage.menu.open();
                    await inventoryPage.openBy(currentPage.menu.allItemsLink);
                    await expect(inventoryPage.title, 'inventory page title').toHaveText('Products');
                });
            },
        );
    }

    test(
        'Menu-006: Dynamic Catalog opens its sub-menu and each entry opens its page',
        { tag: ['@regression'] },
        async ({ inventoryPage, dynamicCatalogPage }) => {
            await test.step('expand Dynamic Catalog: all entries are listed', async () => {
                await inventoryPage.menu.openDynamicCatalog();
                await expect(
                    inventoryPage.menu.dynamicCatalogEntries,
                    'sub-menu entries in order',
                ).toHaveText(DYNAMIC_CATALOG.map((entry) => entry.name));
            });

            // Data-driven: one step per entry. Each page counts as loaded when its first product is shown,
            // so the Spinner page is waited for (and timed) until the spinner is gone.
            for (const entry of DYNAMIC_CATALOG) {
                await test.step(`open ${entry.name}`, async () => {
                    await inventoryPage.goto();
                    await inventoryPage.menu.openDynamicCatalog();
                    await dynamicCatalogPage.openBy(inventoryPage.menu.dynamicCatalogEntry(entry.testId));

                    await expect(dynamicCatalogPage.page, 'page URL').toHaveURL(entry.path);
                    await expect(dynamicCatalogPage.title, 'page title').toHaveText(entry.title);
                    await expect(
                        dynamicCatalogPage.productPrices.first(),
                        'products are shown',
                    ).toBeVisible();
                });
            }
        },
    );
});
