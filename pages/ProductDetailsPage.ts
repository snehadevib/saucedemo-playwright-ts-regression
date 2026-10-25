import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Product details page object (one product, opened from the inventory page).
 */
export class ProductDetailsPage extends BasePage {
    // The product is chosen with ?id=N, so this path alone doesn't open a product
    readonly path = '/inventory-item.html';
    readonly pageName = 'Product details page';
    readonly readyIndicator: Locator;

    readonly name: Locator;
    readonly description: Locator;
    readonly price: Locator;
    readonly backButton: Locator;
    readonly addToCartButton: Locator;
    readonly removeButton: Locator;

    constructor(page: Page) {
        super(page);
        this.name = page.getByTestId('inventory-item-name');
        this.description = page.getByTestId('inventory-item-desc');
        this.price = page.getByTestId('inventory-item-price');
        this.backButton = page.getByTestId('back-to-products');
        this.addToCartButton = page.getByTestId('add-to-cart');
        this.removeButton = page.getByTestId('remove');
        // Must only exist on this page: the inventory page also has 'inventory-item-name'
        this.readyIndicator = this.backButton;
    }

    // Add the shown product to the cart
    async addToCart() {
        await this.addToCartButton.click();
    }

    // Remove the shown product from the cart
    async removeFromCart() {
        await this.removeButton.click();
    }
}
