import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Inventory page object. Contains Locators and actions for the Inventory page.
 */
export class InventoryPage extends BasePage {
    readonly path = '/inventory.html';

    readonly inventoryItems: Locator;
    readonly itemNames: Locator;
    readonly sortDropdown: Locator;
    readonly activeSortOption: Locator;

    constructor(page: Page) {
        super(page);
        this.inventoryItems = page.getByTestId('inventory-item');
        this.itemNames = page.getByTestId('inventory-item-name');
        this.sortDropdown = page.getByTestId('product-sort-container');
        this.activeSortOption = page.getByTestId('active-option');
    }

    // Returns the locators for the parts of one product card, found by its exact product name
    productCard(name: string) {
        const card = this.inventoryItems.filter({
            has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
        });
        return {
            name: card.getByTestId('inventory-item-name'),
            description: card.getByTestId('inventory-item-desc'),
            price: card.getByTestId('inventory-item-price'),
            image: card.getByRole('img'),
            addToCartButton: card.getByRole('button', { name: 'Add to cart' }),
            removeButton: card.getByRole('button', { name: 'Remove' }),
        };
    }
}
