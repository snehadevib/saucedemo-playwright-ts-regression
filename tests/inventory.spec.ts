import { test, expect } from '../fixtures/pages';
import { USERS, PASSWORD } from '../test-data/users';
import { PRODUCTS } from '../test-data/products';

test.describe('Inventory', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.goto();
        await loginPage.login(USERS.standard, PASSWORD);
    });

    test(
        'Inventory-001: all products are displayed with correct name, description, price, image and button',
        { tag: ['@smoke', '@ui'] },
        async ({ inventoryPage }) => {
            await test.step(`all ${PRODUCTS.length} products are displayed`, async () => {
                await expect(inventoryPage.inventoryItems).toHaveCount(PRODUCTS.length);
            });

            for (const [i, product] of PRODUCTS.entries()) {
                await test.step(`product card ${i + 1}: ${product.name}`, async () => {
                    const card = inventoryPage.productCard(i);
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
                    await expect(card.button, 'button says "Add to cart"').toHaveText('Add to cart');
                });
            }
        },
    );
});
