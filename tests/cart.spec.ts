import { test, expect } from '../fixtures/pages';
import { PRODUCTS } from '../test-data/products';

// Products used in the tests come from the catalogue, so the tests don't depend on hard-coded names
const [first, second] = PRODUCTS;

// Planned (see README): Cart-004, 005, 007, 008, 009 and 012
test.describe('Cart', () => {
    // Already logged in; every test starts with an empty cart (fresh browser context)
    test.beforeEach(async ({ inventoryPage }) => {
        await inventoryPage.goto();
    });

    test(
        'Cart-001: adding a product from the inventory page updates its button and the cart badge',
        { tag: ['@smoke'] },
        async ({ inventoryPage }) => {
            const card = inventoryPage.productCard(first.name);

            await test.step('add product on inventory', async () => {
                await inventoryPage.addToCart(first.name);
            });

            await test.step('button changes to "Remove", product can only be added once', async () => {
                await expect(card.removeButton, 'button changes to "Remove"').toBeVisible();
                await expect(
                    card.addToCartButton,
                    'no second "Add to cart" for the same product',
                ).toHaveCount(0);
                await expect(inventoryPage.cartBadge, 'badge shows 1').toHaveText('1');
            });
        },
    );

    test(
        'Cart-002: a product removed on the inventory page can be added again',
        { tag: ['@regression'] },
        async ({ inventoryPage }) => {
            const card = inventoryPage.productCard(first.name);
            await inventoryPage.addToCart(first.name);

            await test.step('remove product on inventory', async () => {
                await inventoryPage.removeFromCart(first.name);

                await expect(card.addToCartButton, 'button back to "Add to cart"').toBeVisible();
                await expect(inventoryPage.cartBadge, 'badge disappears').toBeHidden();
            });

            await test.step('add the same product again', async () => {
                await inventoryPage.addToCart(first.name);

                await expect(card.removeButton, 'button changes to "Remove" again').toBeVisible();
                await expect(inventoryPage.cartBadge, 'badge shows 1 again').toHaveText('1');
            });
        },
    );

    test(
        'Cart-003: all products can be added to the cart',
        { tag: ['@regression'] },
        async ({ inventoryPage }) => {
            for (const product of PRODUCTS) {
                await test.step(`add: ${product.name}`, async () => {
                    await inventoryPage.addToCart(product.name);
                    // Soft: a product that can't be added is reported, and the remaining products are still tried
                    await expect
                        .soft(inventoryPage.productCard(product.name).removeButton, 'button shows "Remove"')
                        .toBeVisible();
                });
            }

            await expect(inventoryPage.cartBadge, `badge shows ${PRODUCTS.length}`).toHaveText(
                String(PRODUCTS.length),
            );
        },
    );

    test(
        'Cart-006: the cart page lists the added products',
        { tag: ['@regression'] },
        async ({ inventoryPage, cartPage }) => {
            await inventoryPage.addToCart(first.name);
            await inventoryPage.addToCart(second.name);

            await test.step('open cart (cart icon)', async () => {
                // Time the cart page load from the click (warning over budget, failure over the hard limit)
                const clickedAt = Date.now();
                await inventoryPage.cartLink.click();
                await cartPage.waitUntilLoaded(clickedAt);
            });

            await test.step('cart lists the products in the order added, with price and quantity 1', async () => {
                await expect(cartPage.title, 'page title').toHaveText('Your Cart');
                await expect(cartPage.itemNames, 'added products, in the order added').toHaveText([
                    first.name,
                    second.name,
                ]);
                await expect(cartPage.itemPrices, 'prices').toHaveText(
                    [first, second].map((p) => `$${p.price.toFixed(2)}`),
                );
                await expect(cartPage.itemQuantities, 'quantity 1 each').toHaveText(['1', '1']);
            });
        },
    );

    test(
        'Cart-010: the cart is kept after a page reload',
        { tag: ['@regression'] },
        async ({ inventoryPage }) => {
            await inventoryPage.addToCart(first.name);
            await inventoryPage.addToCart(second.name);

            await test.step('reload inventory page', async () => {
                await inventoryPage.goto();
            });

            await expect(inventoryPage.cartBadge, 'badge still shows 2').toHaveText('2');
            await expect(
                inventoryPage.productCard(first.name).removeButton,
                `${first.name} still added`,
            ).toBeVisible();
            await expect(
                inventoryPage.productCard(second.name).removeButton,
                `${second.name} still added`,
            ).toBeVisible();
        },
    );

    test(
        'Cart-011: the cart is kept after changing the sort order',
        { tag: ['@regression'] },
        async ({ inventoryPage }) => {
            await inventoryPage.addToCart(first.name);
            await inventoryPage.addToCart(second.name);

            await test.step('sort Z to A', async () => {
                await inventoryPage.sortBy('za');
            });

            await expect(inventoryPage.cartBadge, 'badge still shows 2').toHaveText('2');
            await expect(
                inventoryPage.productCard(first.name).removeButton,
                `${first.name} still added`,
            ).toBeVisible();
            await expect(
                inventoryPage.productCard(second.name).removeButton,
                `${second.name} still added`,
            ).toBeVisible();
        },
    );
});
