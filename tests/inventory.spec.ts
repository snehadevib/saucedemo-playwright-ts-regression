import { test, expect } from '../fixtures/pages';
import { PRODUCTS } from '../test-data/products';

test.describe('Inventory', () => {
    // Already logged in via storageState from the setup project
    test.beforeEach(async ({ inventoryPage }) => {
        await inventoryPage.goto();
    });

    test(
        'Inventory-002: products are sorted by Name (A to Z) by default',
        { tag: ['@regression'] },
        async ({ inventoryPage }) => {
            await expect(inventoryPage.sortDropdown, 'dropdown value is "az"').toHaveValue('az');
            await expect(inventoryPage.activeSortOption, 'label shows "Name (A to Z)"').toHaveText(
                'Name (A to Z)',
            );
            await expect(inventoryPage.itemNames, 'products listed A to Z').toHaveText(
                PRODUCTS.map((p) => p.name),
            );
        },
    );

    test(
        'Inventory-001: all products are displayed with correct name, description, price, image and button',
        { tag: ['@regression'] },
        async ({ inventoryPage }) => {
            await test.step(`all ${PRODUCTS.length} products are displayed`, async () => {
                await expect(inventoryPage.inventoryItems).toHaveCount(PRODUCTS.length);
            });

            // Each product is found by its name, so this test doesn't depend on the sort order
            for (const product of PRODUCTS) {
                await test.step(`product: ${product.name}`, async () => {
                    const card = inventoryPage.productCard(product.name);
                    const priceText = `$${product.price.toFixed(2)}`;

                    await expect(card.name, `name is "${product.name}"`).toHaveText(product.name);
                    await expect(card.description, 'description matches catalogue').toHaveText(
                        product.description,
                    );
                    await expect(card.price, `price is ${priceText}`).toHaveText(priceText);
                    await expect(card.image, `image alt text is "${product.name}"`).toHaveAttribute(
                        'alt',
                        product.name,
                    );
                    await expect(card.image, `image shows ${product.image}`).toHaveAttribute(
                        'src',
                        new RegExp(`/${product.image}-`),
                    );
                    await expect(card.addToCartButton, 'shows "Add to cart" button').toBeVisible();
                });
            }
        },
    );

    test(
        'Inventory-003: inventory page layout is displayed',
        { tag: ['@smoke'] },
        async ({ inventoryPage }) => {
            await expect(inventoryPage.title, 'page title').toHaveText('Products');
            await expect(inventoryPage.appLogo, 'app logo').toBeVisible();
            await expect(inventoryPage.menuButton, 'menu button').toBeVisible();
            await expect(inventoryPage.cartLink, 'cart icon').toBeVisible();
            // toBeHidden also passes when the badge doesn't exist, which is the case for an empty cart
            await expect(inventoryPage.cartBadge, 'no cart badge when cart is empty').toBeHidden();
            await expect(inventoryPage.sortDropdown, 'sort dropdown').toBeVisible();
            await expect(inventoryPage.footer, 'footer').toBeVisible();
        },
    );

    test(
        'Inventory-004: all product images are loaded',
        { tag: ['@regression', '@ui'] },
        async ({ inventoryPage }) => {
            for (const product of PRODUCTS) {
                await test.step(`image: ${product.name}`, async () => {
                    const image = inventoryPage.productCard(product.name).image;
                    // naturalWidth is 0 when the browser could not load the image
                    await expect
                        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth), {
                            message: `${product.name} image is loaded`,
                        })
                        .toBeGreaterThan(0);
                });
            }
        },
    );
});
