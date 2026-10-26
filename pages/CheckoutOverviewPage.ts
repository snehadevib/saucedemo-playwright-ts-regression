import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Checkout step 2: the ordered products, payment and shipping information, and the totals.
 */
export class CheckoutOverviewPage extends BasePage {
    readonly path = '/checkout-step-two.html';
    readonly pageName = 'Checkout overview page';
    readonly readyIndicator: Locator;

    readonly title: Locator;
    readonly items: Locator;
    readonly itemNames: Locator;
    readonly itemDescriptions: Locator;
    readonly itemPrices: Locator;
    readonly itemQuantities: Locator;
    readonly paymentLabel: Locator;
    readonly paymentValue: Locator;
    readonly shippingLabel: Locator;
    readonly shippingValue: Locator;
    readonly totalsLabel: Locator;
    readonly itemTotal: Locator;
    readonly tax: Locator;
    readonly total: Locator;
    readonly finishButton: Locator;
    readonly cancelButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByTestId('title');
        this.items = page.getByTestId('inventory-item');
        this.itemNames = page.getByTestId('inventory-item-name');
        this.itemDescriptions = page.getByTestId('inventory-item-desc');
        this.itemPrices = page.getByTestId('inventory-item-price');
        this.itemQuantities = page.getByTestId('item-quantity');
        this.paymentLabel = page.getByTestId('payment-info-label');
        this.paymentValue = page.getByTestId('payment-info-value');
        this.shippingLabel = page.getByTestId('shipping-info-label');
        this.shippingValue = page.getByTestId('shipping-info-value');
        this.totalsLabel = page.getByTestId('total-info-label');
        this.itemTotal = page.getByTestId('subtotal-label');
        this.tax = page.getByTestId('tax-label');
        this.total = page.getByTestId('total-label');
        this.finishButton = page.getByTestId('finish');
        this.cancelButton = page.getByTestId('cancel');
        // Only exists on this page (also shown with an empty cart)
        this.readyIndicator = this.finishButton;
    }

    // True when a Finish button is shown and can be clicked (checked once the page has settled)
    async canFinish() {
        await this.page.waitForLoadState();
        return (await this.finishButton.count()) > 0 && (await this.finishButton.isEnabled());
    }
}
