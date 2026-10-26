import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { type Customer } from '../test-data/checkout';

/**
 * Checkout step 1: the customer's name and postal code.
 */
export class CheckoutInformationPage extends BasePage {
    readonly path = '/checkout-step-one.html';
    readonly pageName = 'Checkout information page';
    readonly readyIndicator: Locator;

    readonly title: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly postalCodeInput: Locator;
    readonly continueButton: Locator;
    readonly cancelButton: Locator;
    readonly errorMessage: Locator;
    readonly errorCloseButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByTestId('title');
        this.firstNameInput = page.getByTestId('firstName');
        this.lastNameInput = page.getByTestId('lastName');
        this.postalCodeInput = page.getByTestId('postalCode');
        this.continueButton = page.getByTestId('continue');
        this.cancelButton = page.getByTestId('cancel');
        this.errorMessage = page.getByTestId('error');
        this.errorCloseButton = page.getByTestId('error-button');
        // Only exists on this page
        this.readyIndicator = this.continueButton;
    }

    // Fill in the form (empty strings leave a field empty)
    async enterCustomer(customer: Customer) {
        await this.firstNameInput.fill(customer.firstName);
        await this.lastNameInput.fill(customer.lastName);
        await this.postalCodeInput.fill(customer.postalCode);
    }

    // Close the error message by clicking the X button
    async closeErrorMessage() {
        await this.errorCloseButton.click();
    }
}
