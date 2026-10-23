import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';


/**
 * Inventory page object. Contains Locators and actions for the Inventory page.
 */
export class InventoryPage extends BasePage {
    readonly path = '/inventory.html';

    readonly inventoryItems: Locator;

    constructor(page: Page) {
        super(page);
        this.inventoryItems = page.getByTestId('inventory-item');
    }

    // Returns the locators for the parts of one product card (0 = first card)
    productCard(index: number) {
        const card = this.inventoryItems.nth(index);
        return {
            name: card.getByTestId('inventory-item-name'),
            description: card.getByTestId('inventory-item-desc'),
            price: card.getByTestId('inventory-item-price'),
            image: card.getByRole('img'),
            button: card.locator('button'),
        };
    }    
}