import { test, expect, type InventoryPage, type ProductDetailsPage } from '../fixtures/pages';
import { PRODUCTS } from '../test-data/products';
import { FOOTER } from '../test-data/footer';
import { PAGE_LOAD } from '../test-data/performance';

// Expected name orders, calculated from the catalogue so they stay correct if it changes
const namesAtoZ = PRODUCTS.map((p) => p.name).sort((a, b) => a.localeCompare(b));
const namesZtoA = [...namesAtoZ].reverse();

test.describe('Inventory', () => {
    // Already logged in: each project starts with its user's saved session (see TEST_USERS)
    test.beforeEach(async ({ inventoryPage }) => {
        await inventoryPage.goto();
    });

    test(
        'Inventory-002: products are sorted by Name (A to Z) by default',
        { tag: ['@functional'] },
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
        { tag: ['@functional'] },
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
        { tag: ['@smoke', '@functional', '@ui'] },
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
        { tag: ['@functional', '@ui'] },
        async ({ inventoryPage }) => {
            for (const product of PRODUCTS) {
                await test.step(`image: ${product.name}`, async () => {
                    const image = inventoryPage.productCard(product.name).image;
                    // naturalWidth is 0 when the browser could not load the image
                    await expect
                        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth), {
                            message: `${product.name} image is loaded`,
                            // Same hard limit as page loads: images can be slow when many browsers run at once
                            timeout: PAGE_LOAD.failAfterMs,
                        })
                        .toBeGreaterThan(0);
                });
            }
        },
    );

    test.describe('Sorting', () => {
        // Price sorts compare prices, not names: two products share $15.99, so their order is undefined
        const prices = PRODUCTS.map((p) => p.price);
        const asPriceText = (list: number[]) => list.map((price) => `$${price.toFixed(2)}`);
        const pricesLowToHigh = asPriceText([...prices].sort((a, b) => a - b));
        const pricesHighToLow = asPriceText([...prices].sort((a, b) => b - a));

        test('Inventory-005: sort by Name (Z to A)', { tag: ['@functional'] }, async ({ inventoryPage }) => {
            await inventoryPage.sortBy('za');

            await expect(inventoryPage.activeSortOption, 'label').toHaveText('Name (Z to A)');
            await expect(inventoryPage.itemNames, 'names Z to A').toHaveText(namesZtoA);
        });

        test(
            'Inventory-006: sort by Price (low to high)',
            { tag: ['@functional'] },
            async ({ inventoryPage }) => {
                await inventoryPage.sortBy('lohi');

                await expect(inventoryPage.activeSortOption, 'label').toHaveText('Price (low to high)');
                await expect(inventoryPage.itemPrices, 'prices ascending').toHaveText(pricesLowToHigh);
            },
        );

        test(
            'Inventory-007: sort by Price (high to low)',
            { tag: ['@functional'] },
            async ({ inventoryPage }) => {
                await inventoryPage.sortBy('hilo');

                await expect(inventoryPage.activeSortOption, 'label').toHaveText('Price (high to low)');
                await expect(inventoryPage.itemPrices, 'prices descending').toHaveText(pricesHighToLow);
            },
        );

        test(
            'Inventory-008: sort order resets to Name (A to Z) after reload',
            { tag: ['@functional'] },
            async ({ inventoryPage, page }) => {
                await test.step('sort Z to A', async () => {
                    await inventoryPage.sortBy('za');
                    await expect(inventoryPage.itemNames).toHaveText(namesZtoA);
                });

                await test.step('reload: default sort is back', async () => {
                    await page.reload();
                    await expect(inventoryPage.sortDropdown, 'value').toHaveValue('az');
                    await expect(inventoryPage.activeSortOption, 'label').toHaveText('Name (A to Z)');
                    await expect(inventoryPage.itemNames, 'names A to Z').toHaveText(namesAtoZ);
                });
            },
        );
    });

    test.describe('Product details', () => {
        type LinkPart = 'nameLink' | 'imageLink';

        // Click the given link of every product and check its details page matches the catalogue
        async function openEachProductBy(
            link: LinkPart,
            inventoryPage: InventoryPage,
            productDetailsPage: ProductDetailsPage,
        ) {
            for (const product of PRODUCTS) {
                await test.step(`open: ${product.name}`, async () => {
                    await inventoryPage.goto();
                    // Time the details page load from the click (warning over budget, failure over the hard limit)
                    const clickedAt = Date.now();
                    await inventoryPage.productCard(product.name)[link].click();
                    await productDetailsPage.waitUntilLoaded(clickedAt);

                    await expect(productDetailsPage.page, 'details page URL').toHaveURL(
                        /\/inventory-item\.html\?id=\d+$/,
                    );
                    await expect(productDetailsPage.name, 'name').toHaveText(product.name);
                    await expect(productDetailsPage.description, 'description').toHaveText(
                        product.description,
                    );
                    await expect(productDetailsPage.price, 'price').toHaveText(
                        `$${product.price.toFixed(2)}`,
                    );
                    await expect(productDetailsPage.backButton, 'back button').toBeVisible();
                });
            }
        }

        test(
            'Inventory-009: clicking a product name opens its details page',
            { tag: ['@integration'] },
            async ({ inventoryPage, productDetailsPage }) => {
                await openEachProductBy('nameLink', inventoryPage, productDetailsPage);
            },
        );

        test(
            'Inventory-010: clicking a product image opens its details page',
            { tag: ['@integration'] },
            async ({ inventoryPage, productDetailsPage }) => {
                await openEachProductBy('imageLink', inventoryPage, productDetailsPage);
            },
        );
    });

    test(
        'Inventory-011: footer shows copyright and social links',
        { tag: ['@functional', '@ui'] },
        async ({ inventoryPage }) => {
            await expect(inventoryPage.footerCopy, 'copyright text').toHaveText(FOOTER.copyright);
            await expect(inventoryPage.socialX, 'X link').toHaveAttribute('href', FOOTER.socialLinks.x);
            await expect(inventoryPage.socialFacebook, 'Facebook link').toHaveAttribute(
                'href',
                FOOTER.socialLinks.facebook,
            );
            await expect(inventoryPage.socialLinkedIn, 'LinkedIn link').toHaveAttribute(
                'href',
                FOOTER.socialLinks.linkedIn,
            );
        },
    );
});
