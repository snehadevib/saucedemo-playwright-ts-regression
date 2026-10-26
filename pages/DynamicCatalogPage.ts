import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The Dynamic Catalog demo pages (Lazy Load, Spinner, Slider), opened from the menu.
 * Only what all three share is modelled: the title and the product prices.
 * Their own behaviour (lazy loading, spinner, slider navigation) is out of scope for now (see README).
 */
export class DynamicCatalogPage extends BasePage {
    // One object for three pages; tests open them through the menu, not by this path
    readonly path = '/dynamic-catalog-lazy-load.html';
    readonly pageName = 'Dynamic Catalog page';
    readonly readyIndicator: Locator;

    readonly title: Locator;
    readonly productPrices: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByTestId('title');
        // Every product card shows a price like "$29.99"
        this.productPrices = page.getByText(/^\$\d+\.\d{2}$/);
        // Loaded once the first product is shown (on the Spinner page: after the spinner is gone)
        this.readyIndicator = this.productPrices.first();
    }
}
