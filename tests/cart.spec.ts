import { test, expect } from '../fixtures/pages';
import { PRODUCTS } from '../test-data/products';

// Products used in the tests come from the catalogue, so the tests don't depend on hard-coded names
const [first, second] = PRODUCTS;

// Every change to the cart is checked where it happened, in the cart badge, and on the inventory page.
// Navigation uses the page's own links and buttons; each page load is timed (see BasePage.openBy).
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
        'Cart-004: a product can be added on the product details page',
        { tag: ['@regression'] },
        async ({ inventoryPage, productDetailsPage }) => {
            await test.step('open details by name', async () => {
                await productDetailsPage.openBy(inventoryPage.productCard(first.name).nameLink);
                await expect(productDetailsPage.name, 'details of the clicked product').toHaveText(
                    first.name,
                );
            });

            await test.step('add product on details page', async () => {
                await productDetailsPage.addToCart();

                await expect(productDetailsPage.removeButton, 'button changes to "Remove"').toBeVisible();
                await expect(productDetailsPage.cartBadge, 'badge shows 1').toHaveText('1');
            });

            await test.step('back to products: inventory shows the product as added', async () => {
                await inventoryPage.openBy(productDetailsPage.backButton);

                await expect(
                    inventoryPage.productCard(first.name).removeButton,
                    'shows "Remove"',
                ).toBeVisible();
                await expect(inventoryPage.cartBadge, 'badge still shows 1').toHaveText('1');
            });
        },
    );

    test(
        'Cart-005: a product can be removed on the product details page',
        { tag: ['@regression'] },
        async ({ inventoryPage, productDetailsPage }) => {
            await inventoryPage.addToCart(first.name);

            await test.step('open details by image', async () => {
                await productDetailsPage.openBy(inventoryPage.productCard(first.name).imageLink);
                await expect(productDetailsPage.name, 'details of the clicked product').toHaveText(
                    first.name,
                );
            });

            await test.step('remove product on details page', async () => {
                await productDetailsPage.removeFromCart();

                await expect(
                    productDetailsPage.addToCartButton,
                    'button back to "Add to cart"',
                ).toBeVisible();
                await expect(productDetailsPage.cartBadge, 'badge disappears').toBeHidden();
            });

            await test.step('back to products: inventory shows the product as not added', async () => {
                await inventoryPage.openBy(productDetailsPage.backButton);

                await expect(
                    inventoryPage.productCard(first.name).addToCartButton,
                    'shows "Add to cart"',
                ).toBeVisible();
                await expect(inventoryPage.cartBadge, 'no badge').toBeHidden();
            });
        },
    );

    test(
        'Cart-006: the cart page lists the added products',
        { tag: ['@regression'] },
        async ({ inventoryPage, cartPage }) => {
            await inventoryPage.addToCart(first.name);
            await inventoryPage.addToCart(second.name);

            await test.step('open cart (cart icon)', async () => {
                await cartPage.openBy(inventoryPage.cartLink);
            });

            await test.step('cart lists the products in the order added, with price and quantity 1', async () => {
                await expect(cartPage.title, 'page title').toHaveText('Your Cart');
                await expect(cartPage.quantityLabel, 'quantity column header').toHaveText('QTY');
                await expect(cartPage.descriptionLabel, 'description column header').toHaveText(
                    'Description',
                );
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
        'Cart-007: a product can be removed on the cart page',
        { tag: ['@regression'] },
        async ({ inventoryPage, cartPage }) => {
            await inventoryPage.addToCart(first.name);
            await inventoryPage.addToCart(second.name);

            await test.step('open cart (cart icon)', async () => {
                await cartPage.openBy(inventoryPage.cartLink);
            });

            await test.step('remove product on cart page', async () => {
                await cartPage.removeFromCart(first.name);

                await expect(cartPage.itemNames, 'only the other product is left').toHaveText([second.name]);
                await expect(
                    cartPage.cartItem(second.name).quantity,
                    'remaining item keeps quantity 1',
                ).toHaveText('1');
                await expect(cartPage.cartBadge, 'badge shows 1').toHaveText('1');
            });

            await test.step('continue shopping: inventory shows the removed product as not added', async () => {
                await inventoryPage.openBy(cartPage.continueShoppingButton);

                await expect(
                    inventoryPage.productCard(first.name).addToCartButton,
                    `${first.name} shows "Add to cart"`,
                ).toBeVisible();
                await expect(
                    inventoryPage.productCard(second.name).removeButton,
                    `${second.name} still added`,
                ).toBeVisible();
                await expect(inventoryPage.cartBadge, 'badge shows 1').toHaveText('1');
            });
        },
    );

    test(
        'Cart-008: a product can be removed on its details page opened from the cart',
        { tag: ['@regression'] },
        async ({ inventoryPage, cartPage, productDetailsPage }) => {
            await inventoryPage.addToCart(first.name);

            await test.step('open cart (cart icon)', async () => {
                await cartPage.openBy(inventoryPage.cartLink);
            });

            await test.step('open details by name from cart', async () => {
                await productDetailsPage.openBy(cartPage.cartItem(first.name).nameLink);
                await expect(productDetailsPage.name, 'details of the clicked product').toHaveText(
                    first.name,
                );
            });

            await test.step('remove product on details page', async () => {
                await productDetailsPage.removeFromCart();

                await expect(
                    productDetailsPage.addToCartButton,
                    'button back to "Add to cart"',
                ).toBeVisible();
                await expect(productDetailsPage.cartBadge, 'badge disappears').toBeHidden();
            });

            await test.step('open cart again: it is empty', async () => {
                await cartPage.openBy(productDetailsPage.cartLink);

                await expect(cartPage.cartItems, 'no items in the cart').toHaveCount(0);
            });
        },
    );

    test(
        'Cart-009: the empty cart page has no items',
        { tag: ['@regression'] },
        async ({ inventoryPage, cartPage }) => {
            await test.step('open cart (cart icon) with nothing added', async () => {
                await cartPage.openBy(inventoryPage.cartLink);
            });

            await test.step('cart is empty, buttons are shown', async () => {
                await expect(cartPage.cartItems, 'no items').toHaveCount(0);
                await expect(cartPage.cartBadge, 'no badge').toBeHidden();
                await expect(cartPage.checkoutButton, 'Checkout shown').toBeVisible();
                await expect(cartPage.continueShoppingButton, 'Continue Shopping shown').toBeVisible();
            });

            await test.step('continue shopping: inventory has no badge', async () => {
                await inventoryPage.openBy(cartPage.continueShoppingButton);

                await expect(inventoryPage.cartBadge, 'no badge').toBeHidden();
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

    test(
        'Cart-012: the cart is kept when moving between pages',
        { tag: ['@regression'] },
        async ({ inventoryPage, productDetailsPage, cartPage }) => {
            await inventoryPage.addToCart(first.name);
            await inventoryPage.addToCart(second.name);

            await test.step('open details by name', async () => {
                await productDetailsPage.openBy(inventoryPage.productCard(first.name).nameLink);

                await expect(productDetailsPage.removeButton, `${first.name} shown as added`).toBeVisible();
                await expect(productDetailsPage.cartBadge, 'badge shows 2').toHaveText('2');
            });

            await test.step('open cart (cart icon)', async () => {
                await cartPage.openBy(productDetailsPage.cartLink);

                await expect(cartPage.itemNames, 'both products in the cart').toHaveText([
                    first.name,
                    second.name,
                ]);
            });

            await test.step('continue shopping', async () => {
                await inventoryPage.openBy(cartPage.continueShoppingButton);

                await expect(inventoryPage.cartBadge, 'badge shows 2').toHaveText('2');
            });

            await test.step('open details by image', async () => {
                await productDetailsPage.openBy(inventoryPage.productCard(second.name).imageLink);

                await expect(productDetailsPage.removeButton, `${second.name} shown as added`).toBeVisible();
                await expect(productDetailsPage.cartBadge, 'badge shows 2').toHaveText('2');
            });

            await test.step('back to products', async () => {
                await inventoryPage.openBy(productDetailsPage.backButton);

                await expect(inventoryPage.cartBadge, 'badge shows 2').toHaveText('2');
                await expect(
                    inventoryPage.productCard(first.name).removeButton,
                    `${first.name} still added`,
                ).toBeVisible();
                await expect(
                    inventoryPage.productCard(second.name).removeButton,
                    `${second.name} still added`,
                ).toBeVisible();
            });
        },
    );
});
