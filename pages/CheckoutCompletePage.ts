import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Checkout complete: the order confirmation, with Back Home and the PDF receipt.
 */
export class CheckoutCompletePage extends BasePage {
    readonly path = '/checkout-complete.html';
    readonly pageName = 'Checkout complete page';
    readonly readyIndicator: Locator;

    readonly title: Locator;
    readonly image: Locator;
    readonly header: Locator;
    readonly text: Locator;
    readonly backHomeButton: Locator;
    readonly generatePdfButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByTestId('title');
        this.image = page.getByTestId('pony-express');
        this.header = page.getByTestId('complete-header');
        this.text = page.getByTestId('complete-text');
        this.backHomeButton = page.getByTestId('back-to-products');
        this.generatePdfButton = page.getByRole('button', { name: 'Generate PDF order' });
        // The confirmation header only exists here (the details page also has a 'back-to-products' button)
        this.readyIndicator = this.header;
    }

    // Click "Generate PDF order" and return the downloaded receipt
    async downloadReceipt() {
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            this.generatePdfButton.click(),
        ]);
        return download;
    }
}
