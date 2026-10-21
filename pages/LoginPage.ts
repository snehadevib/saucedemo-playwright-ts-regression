import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login page object. Contains Locators and actions for the Login page.
 */
export class LoginPage extends BasePage {
    readonly path = '/';

    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorMessage: Locator;
    readonly errorCloseButton: Locator;

    constructor(page: Page) {
        super(page);
        this.usernameInput = page.getByTestId('username');
        this.passwordInput = page.getByTestId('password');
        this.loginButton = page.getByTestId('login-button');
        this.errorMessage = page.getByTestId('error');
        this.errorCloseButton = page.getByTestId('error-button');
    }

    // Fill in the Login form and submit it.
    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    // Close the error message by clicking the X button.
    async closeErrorMessage() {
        await this.errorCloseButton.click();
    }
}