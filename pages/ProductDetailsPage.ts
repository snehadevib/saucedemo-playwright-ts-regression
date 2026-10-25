import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Product details page object (one product, opened from the inventory page).
 */
export class ProductDetailsPage extends BasePage {
    // The product is chosen with ?id=N, so this path alone doesn't open a product
    readonly path = '/inventory-item.html';

    readonly name: Locator;
    readonly description: Locator;
    readonly price: Locator;
    readonly backButton: Locator;

    constructor(page: Page) {
        super(page);
        this.name = page.getByTestId('inventory-item-name');
        this.description = page.getByTestId('inventory-item-desc');
        this.price = page.getByTestId('inventory-item-price');
        this.backButton = page.getByTestId('back-to-products');
    }
}
