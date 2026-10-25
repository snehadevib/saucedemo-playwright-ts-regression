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
    readonly quantityLabel: Locator;
    readonly descriptionLabel: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByTestId('title');
        this.cartItems = page.getByTestId('inventory-item');
        this.itemNames = page.getByTestId('inventory-item-name');
        this.itemPrices = page.getByTestId('inventory-item-price');
        this.itemQuantities = page.getByTestId('item-quantity');
        this.continueShoppingButton = page.getByTestId('continue-shopping');
        this.checkoutButton = page.getByTestId('checkout');
        this.quantityLabel = page.getByTestId('cart-quantity-label');
        this.descriptionLabel = page.getByTestId('cart-desc-label');
        // Only exists on the cart page (an empty cart has no items, but always has this button)
        this.readyIndicator = this.checkoutButton;
    }

    // Returns the locators for one item in the cart, found by its exact product name
    cartItem(name: string) {
        const item = this.cartItems.filter({
            has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
        });
        return {
            // Opens the product details page (the cart shows no image, only the name link)
            nameLink: item.getByTestId(/^item-\d+-title-link$/),
            quantity: item.getByTestId('item-quantity'),
            removeButton: item.getByRole('button', { name: 'Remove' }),
        };
    }

    // Remove a product from the cart on the cart page
    async removeFromCart(name: string) {
        await this.cartItem(name).removeButton.click();
    }
}
