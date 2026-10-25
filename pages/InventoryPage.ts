import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Values of the sort dropdown options. */
export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * Inventory page object. Contains Locators and actions for the Inventory page.
 */
export class InventoryPage extends BasePage {
    readonly path = '/inventory.html';
    readonly pageName = 'Inventory page';
    readonly readyIndicator: Locator;

    readonly inventoryItems: Locator;
    readonly itemNames: Locator;
    readonly itemPrices: Locator;
    readonly sortDropdown: Locator;
    readonly activeSortOption: Locator;

    // Header and footer (shared by all logged-in pages; candidates for a Header component later)
    readonly title: Locator;
    readonly appLogo: Locator;
    readonly menuButton: Locator;
    readonly cartLink: Locator;
    readonly cartBadge: Locator;
    readonly footer: Locator;
    readonly footerCopy: Locator;
    readonly socialX: Locator;
    readonly socialFacebook: Locator;
    readonly socialLinkedIn: Locator;

    constructor(page: Page) {
        super(page);
        this.inventoryItems = page.getByTestId('inventory-item');
        this.itemNames = page.getByTestId('inventory-item-name');
        this.itemPrices = page.getByTestId('inventory-item-price');
        // Loaded once the first product is shown
        this.readyIndicator = this.inventoryItems.first();
        this.sortDropdown = page.getByTestId('product-sort-container');
        this.activeSortOption = page.getByTestId('active-option');

        this.title = page.getByTestId('title');
        this.appLogo = page.getByText('Swag Labs', { exact: true });
        this.menuButton = page.getByTestId('open-menu');
        this.cartLink = page.getByTestId('shopping-cart-link');
        this.cartBadge = page.getByTestId('shopping-cart-badge');
        this.footer = page.getByTestId('footer');
        this.footerCopy = page.getByTestId('footer-copy');
        this.socialX = page.getByTestId('social-x');
        this.socialFacebook = page.getByTestId('social-facebook');
        this.socialLinkedIn = page.getByTestId('social-linkedin');
    }

    // Choose a sort order from the dropdown
    async sortBy(option: SortOption) {
        await this.sortDropdown.selectOption(option);
    }

    // Add a product to the cart from the inventory page
    async addToCart(name: string) {
        await this.productCard(name).addToCartButton.click();
    }

    // Remove a product from the cart from the inventory page
    async removeFromCart(name: string) {
        await this.productCard(name).removeButton.click();
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
            // Links to the details page; N in item-N is the product id, not the position on the page
            nameLink: card.getByTestId(/^item-\d+-title-link$/),
            imageLink: card.getByTestId(/^item-\d+-img-link$/),
            addToCartButton: card.getByRole('button', { name: 'Add to cart' }),
            removeButton: card.getByRole('button', { name: 'Remove' }),
        };
    }
}
