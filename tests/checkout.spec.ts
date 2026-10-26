import { test, expect, type CheckoutOverviewPage, type CheckoutCompletePage } from '../fixtures/pages';
import { PRODUCTS } from '../test-data/products';
import {
    CHECKOUT_ERRORS,
    CUSTOMERS,
    ORDER_COMPLETE,
    ORDER_INFO,
    ORDER_SCENARIOS,
    expectedTotals,
} from '../test-data/checkout';
import { KNOWN_BUGS, knownBugInGate, type KnownBug } from '../fixtures/known-bugs';

const [first] = PRODUCTS;
const typicalOrder = ORDER_SCENARIOS.find((s) => s.name === 'typical order')!;
const customer = CUSTOMERS.standard;

// Order scenarios whose overview totals fail for every user because of a known bug (see Checkout-005)
const OVERVIEW_KNOWN_BUGS: Record<string, KnownBug | undefined> = {
    'rounding case': KNOWN_BUGS.itemTotalFormat,
};

/**
 * Assumed requirement (not defined by SauceDemo): an order must not be confirmed.
 * Passes if Finish is missing or disabled, or if clicking it shows no order confirmation.
 */
async function expectNoOrderCanBePlaced(
    overviewPage: CheckoutOverviewPage,
    completePage: CheckoutCompletePage,
) {
    if (await overviewPage.canFinish()) {
        await overviewPage.finishButton.click();
        await expectNoOrderConfirmation(completePage);
    }
}

// Fails if the order confirmation appears within a few seconds
async function expectNoOrderConfirmation(completePage: CheckoutCompletePage) {
    const confirmed = await completePage.header
        .waitFor({ state: 'visible', timeout: 3_000 })
        .then(() => true)
        .catch(() => false);
    expect(confirmed, 'no order confirmation is shown').toBe(false);
}

test.describe('Checkout', () => {
    // Already logged in; every test starts on the inventory page with an empty cart
    test.beforeEach(async ({ inventoryPage }) => {
        await inventoryPage.goto();
    });

    test.describe('Information', () => {
        test(
            'Checkout-001: required fields on the information page show an error that can be closed',
            { tag: ['@fieldLevel'] },
            async ({ checkout, checkoutInformationPage: infoPage }) => {
                await checkout.start([first]);

                // Data-driven: one row per missing field, plus all empty (the first missing field is reported)
                const cases = [
                    {
                        title: 'first name empty',
                        data: { ...customer, firstName: '' },
                        error: CHECKOUT_ERRORS.firstNameRequired,
                    },
                    {
                        title: 'last name empty',
                        data: { ...customer, lastName: '' },
                        error: CHECKOUT_ERRORS.lastNameRequired,
                    },
                    {
                        title: 'postal code empty',
                        data: { ...customer, postalCode: '' },
                        error: CHECKOUT_ERRORS.postalCodeRequired,
                    },
                    {
                        title: 'all fields empty',
                        data: { firstName: '', lastName: '', postalCode: '' },
                        error: CHECKOUT_ERRORS.firstNameRequired,
                    },
                ];
                for (const c of cases) {
                    await test.step(c.title, async () => {
                        await infoPage.enterCustomer(c.data);
                        await infoPage.continueButton.click();

                        await expect(infoPage.errorMessage, 'error message').toHaveText(c.error);
                        await expect(infoPage.page, 'stays on the information page').toHaveURL(infoPage.path);
                    });
                }

                await test.step('close the error', async () => {
                    await infoPage.closeErrorMessage();
                    await expect(infoPage.errorMessage, 'error disappears').toBeHidden();
                });
            },
        );

        test(
            'Checkout-002: fields with only spaces are not accepted',
            { tag: ['@fieldLevel'] },
            async ({ checkout, checkoutInformationPage: infoPage }) => {
                // Assumed requirement: spaces-only input counts as empty
                knownBugInGate(KNOWN_BUGS.spacesOnlyAccepted);
                await checkout.start([first]);

                await infoPage.enterCustomer({ firstName: '   ', lastName: '   ', postalCode: '   ' });
                await infoPage.continueButton.click();

                await expect(infoPage.errorMessage, 'error message').toHaveText(
                    CHECKOUT_ERRORS.firstNameRequired,
                );
                await expect(infoPage.page, 'stays on the information page').toHaveURL(infoPage.path);
            },
        );

        test(
            'Checkout-003: cancel on the information page returns to the cart unchanged',
            { tag: ['@integration'] },
            async ({ checkout, checkoutInformationPage: infoPage, cartPage }) => {
                await checkout.start([first]);

                await test.step('cancel', async () => {
                    await cartPage.openBy(infoPage.cancelButton);
                });

                await expect(cartPage.itemNames, 'cart unchanged').toHaveText([first.name]);
                await expect(cartPage.cartBadge, 'badge shows 1').toHaveText('1');
            },
        );
    });

    test.describe('Overview', () => {
        test(
            'Checkout-004: the overview lists the ordered products',
            { tag: ['@integration'] },
            async ({ checkout, checkoutOverviewPage: overview }) => {
                const { products } = typicalOrder;
                await checkout.reachOverview(products, customer);

                await expect(overview.title, 'page title').toHaveText('Checkout: Overview');
                await expect(overview.itemNames, 'names').toHaveText(products.map((p) => p.name));
                await expect(overview.itemDescriptions, 'descriptions').toHaveText(
                    products.map((p) => p.description),
                );
                await expect(overview.itemPrices, 'prices').toHaveText(
                    products.map((p) => `$${p.price.toFixed(2)}`),
                );
                await expect(overview.itemQuantities, 'quantity 1 each').toHaveText(products.map(() => '1'));
            },
        );

        // Data-driven: one test per order scenario (expected amounts are calculated, see expectedTotals)
        for (const scenario of ORDER_SCENARIOS) {
            test(
                `Checkout-005: item total, tax and total are correct (${scenario.name})`,
                { tag: ['@functional'] },
                async ({ checkout, checkoutOverviewPage: overview }) => {
                    knownBugInGate(OVERVIEW_KNOWN_BUGS[scenario.name]);
                    await checkout.reachOverview(scenario.products, scenario.customer);
                    const expected = expectedTotals(scenario.products);

                    // Soft: all three amounts are reported, even if one is wrong
                    await expect
                        .soft(overview.itemTotal, 'item total')
                        .toHaveText(`Item total: ${expected.itemTotal}`);
                    await expect.soft(overview.tax, 'tax (8%)').toHaveText(`Tax: ${expected.tax}`);
                    await expect.soft(overview.total, 'total').toHaveText(`Total: ${expected.total}`);
                },
            );
        }

        test(
            'Checkout-006: the overview shows payment and shipping information',
            { tag: ['@functional'] },
            async ({ checkout, checkoutOverviewPage: overview }) => {
                await checkout.reachOverview(typicalOrder.products, customer);

                await expect(overview.paymentLabel, 'payment heading').toHaveText('Payment Information:');
                await expect(overview.paymentValue, 'payment method').toHaveText(ORDER_INFO.payment);
                await expect(overview.shippingLabel, 'shipping heading').toHaveText('Shipping Information:');
                await expect(overview.shippingValue, 'shipping method').toHaveText(ORDER_INFO.shipping);
                await expect(overview.totalsLabel, 'totals heading').toHaveText('Price Total');
            },
        );

        test(
            'Checkout-007: the overview is kept after a page reload',
            { tag: ['@functional'] },
            async ({ checkout, checkoutOverviewPage: overview }) => {
                const { products } = typicalOrder;
                await checkout.reachOverview(products, customer);
                const expected = expectedTotals(products);

                await test.step('reload overview', async () => {
                    await overview.reload();
                });

                await expect(overview.itemNames, 'same products').toHaveText(products.map((p) => p.name));
                await expect(overview.total, 'same total').toHaveText(`Total: ${expected.total}`);
            },
        );

        test(
            'Checkout-008: cancel on the overview returns to the inventory page with the cart unchanged',
            { tag: ['@integration'] },
            async ({ checkout, checkoutOverviewPage: overview, inventoryPage }) => {
                const { products } = typicalOrder;
                await checkout.reachOverview(products, customer);

                await test.step('cancel', async () => {
                    await inventoryPage.openBy(overview.cancelButton);
                });

                await expect(inventoryPage.cartBadge, 'badge unchanged').toHaveText(String(products.length));
                for (const product of products) {
                    await expect(
                        inventoryPage.productCard(product.name).removeButton,
                        `${product.name} still added`,
                    ).toBeVisible();
                }
            },
        );

        test(
            'Checkout-009: no order can be placed with an empty cart',
            { tag: ['@negative'] },
            async ({ checkout, checkoutOverviewPage: overview, checkoutCompletePage: complete }) => {
                // Assumed requirement: Finish is disabled, or clicking it does not confirm an order
                knownBugInGate(KNOWN_BUGS.emptyOrder);
                await checkout.reachOverview([], customer);

                await expect
                    .soft(overview.itemTotal, 'empty item total shown as currency')
                    .toHaveText('Item total: $0.00');
                await expectNoOrderCanBePlaced(overview, complete);
            },
        );

        test(
            'Checkout-010: the overview cannot be opened directly without the information step',
            { tag: ['@negative', '@security'] },
            async ({ inventoryPage, checkoutOverviewPage: overview }) => {
                // Assumed requirement: skipping the information step by URL is not possible
                knownBugInGate(KNOWN_BUGS.stepsSkippableByUrl);
                await inventoryPage.addToCart(first.name);

                await test.step('open the overview URL directly', async () => {
                    await overview.openUrlDirectly();
                });

                await expect(overview.page, 'redirected away from the overview').not.toHaveURL(overview.path);
            },
        );
    });

    test.describe('Complete', () => {
        test(
            'Checkout-011: the complete page confirms the order',
            { tag: ['@functional', '@ui'] },
            async ({ checkout, checkoutCompletePage: complete }) => {
                await checkout.placeOrder(typicalOrder.products, customer);

                await expect(complete.title, 'page title').toHaveText(ORDER_COMPLETE.title);
                await expect(complete.image, 'confirmation image').toBeVisible();
                await expect(complete.header, 'thank-you heading').toHaveText(ORDER_COMPLETE.header);
                await expect(complete.text, 'dispatch text').toHaveText(ORDER_COMPLETE.text);
                await expect(complete.backHomeButton, 'Back Home shown').toBeVisible();
                await expect(complete.generatePdfButton, 'Generate PDF order shown').toBeVisible();
                await expect(complete.cartBadge, 'cart badge gone').toBeHidden();
            },
        );

        test(
            'Checkout-012: Back Home returns to the inventory page with an empty cart',
            { tag: ['@integration'] },
            async ({ checkout, checkoutCompletePage: complete, inventoryPage }) => {
                const { products } = typicalOrder;
                await checkout.placeOrder(products, customer);

                await test.step('back home', async () => {
                    await inventoryPage.openBy(complete.backHomeButton);
                });

                await expect(inventoryPage.cartBadge, 'no badge').toBeHidden();
                for (const product of products) {
                    await expect(
                        inventoryPage.productCard(product.name).addToCartButton,
                        `${product.name} shows "Add to cart"`,
                    ).toBeVisible();
                }
            },
        );

        test(
            'Checkout-013: the complete page cannot be opened directly without an order',
            { tag: ['@negative', '@security'] },
            async ({ checkoutCompletePage: complete }) => {
                // Assumed requirement: no order confirmation without an order
                knownBugInGate(KNOWN_BUGS.stepsSkippableByUrl);

                await test.step('open the complete URL directly', async () => {
                    await complete.openUrlDirectly();
                });

                await expectNoOrderConfirmation(complete);
            },
        );
    });

    test.describe('Navigation', () => {
        test(
            'Checkout-014: the cart icon on the checkout pages leads to the unchanged cart',
            { tag: ['@integration'] },
            async ({
                checkout,
                cartPage,
                checkoutInformationPage: infoPage,
                checkoutOverviewPage: overview,
            }) => {
                await checkout.start([first]);

                await test.step('cart icon on the information page', async () => {
                    await cartPage.openBy(infoPage.cartLink);
                    await expect(cartPage.itemNames, 'cart unchanged').toHaveText([first.name]);
                });

                await test.step('cart icon on the overview page', async () => {
                    await infoPage.openBy(cartPage.checkoutButton);
                    await infoPage.enterCustomer(customer);
                    await overview.openBy(infoPage.continueButton);

                    await cartPage.openBy(overview.cartLink);
                    await expect(cartPage.itemNames, 'cart unchanged').toHaveText([first.name]);
                });
            },
        );
    });

    test.describe('End to end', () => {
        test(
            'Checkout-015: an order with several products can be completed',
            { tag: ['@smoke', '@e2e'] },
            async ({
                inventoryPage,
                cartPage,
                checkoutInformationPage: infoPage,
                checkoutOverviewPage: overview,
                checkoutCompletePage: complete,
            }) => {
                // Every step is written out (not via the checkout helper), so the whole journey shows in the report
                const { products, customer: buyer } = typicalOrder;

                await test.step('add products and open cart', async () => {
                    for (const product of products) {
                        await inventoryPage.addToCart(product.name);
                    }
                    await cartPage.openBy(inventoryPage.cartLink);
                    await expect(cartPage.itemNames).toHaveText(products.map((p) => p.name));
                });

                await test.step('checkout: enter information', async () => {
                    await infoPage.openBy(cartPage.checkoutButton);
                    await infoPage.enterCustomer(buyer);
                });

                await test.step('continue: overview shows the order total', async () => {
                    await overview.openBy(infoPage.continueButton);
                    await expect(overview.total).toHaveText(`Total: ${expectedTotals(products).total}`);
                });

                await test.step('finish: order is confirmed and the cart is empty', async () => {
                    await complete.openBy(overview.finishButton);
                    await expect(complete.header).toHaveText(ORDER_COMPLETE.header);
                    await expect(complete.cartBadge).toBeHidden();
                });
            },
        );

        test(
            'Checkout-016: going back after an order does not place a second order',
            { tag: ['@negative'] },
            async ({ checkout, checkoutOverviewPage: overview, checkoutCompletePage: complete }) => {
                // Assumed requirement: one order per checkout
                knownBugInGate(KNOWN_BUGS.emptyOrder);
                await checkout.placeOrder(typicalOrder.products, customer);

                await test.step('browser back to the overview', async () => {
                    await overview.goBack();
                });

                await expectNoOrderCanBePlaced(overview, complete);
            },
        );
    });
});
