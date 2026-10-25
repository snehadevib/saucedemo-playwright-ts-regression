import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Cart page object. Lists the products added to the cart.
 */
export class CartPage extends BasePage {
    readonly path = '/cart.html';
    readonly pageName = 'Cart page';
    readonly readyIndicator: Locator;

    readonly title: Locator;
    readonly cartItems: Locator;
    readonly itemNames: Locator;
    readonly itemPrices: Locator;
    readonly itemQuantities: Locator;
    readonly continueShoppingButton: Locator;
    readonly checkoutButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByTestId('title');
        this.cartItems = page.getByTestId('inventory-item');
        this.itemNames = page.getByTestId('inventory-item-name');
        this.itemPrices = page.getByTestId('inventory-item-price');
        this.itemQuantities = page.getByTestId('item-quantity');
        this.continueShoppingButton = page.getByTestId('continue-shopping');
        this.checkoutButton = page.getByTestId('checkout');
        // Only exists on the cart page (an empty cart has no items, but always has this button)
        this.readyIndicator = this.checkoutButton;
    }
}
