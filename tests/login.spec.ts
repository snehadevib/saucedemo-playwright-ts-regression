import { test, expect, type LoginPage } from '../fixtures/pages';
import { USERS, PASSWORD } from '../test-data/users';
import { LOGIN_ERRORS } from '../test-data/messages';

/**
 * Shared checks for all failed login attempts.
 * Error text, highlighted field, user remains on the login page, and login button is still visible.
 */

async function expectLoginError(loginPage: LoginPage, expectedMessage: string) {
    await test.step('Error message is displayed and highlighted fields are shown', async () => {
        await expect(loginPage.errorMessage).toHaveText(expectedMessage);
        await expect(loginPage.usernameInput).toContainClass('error');
        await expect(loginPage.passwordInput).toContainClass('error');
        await expect(loginPage.loginButton).toBeVisible();
    });

    await test.step('error message can be closed by clicking the X button', async () => {
        await loginPage.closeErrorMessage();
        await expect(loginPage.errorMessage).toBeHidden();
        await expect(loginPage.usernameInput).not.toContainClass('error');
    });
}

test.describe('Login', () => {
    // Login tests must start logged out, so ignore the saved session from the setup project
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.goto();
    });

    test(
        'Login-001: valid login with standard_user opens the inventory page',
        { tag: ['@functional', '@smoke'] },
        async ({ loginPage, page }) => {
            await loginPage.login(USERS.standard, PASSWORD);

            await expect(page).toHaveURL(/inventory\.html/);
        },
    );

    test(
        'Login-002: locked_out_user gets the locked-out error message',
        { tag: ['@smoke', '@negative'] },
        async ({ loginPage }) => {
            await loginPage.login(USERS.lockedOut, PASSWORD);

            await expectLoginError(loginPage, LOGIN_ERRORS.lockedOut);
        },
    );

    test(
        'Login-003: wrong password for standard_user gets the invalid credentials error message',
        { tag: ['@negative'] },
        async ({ loginPage }) => {
            await loginPage.login(USERS.standard, 'wrongpassword');

            await expectLoginError(loginPage, LOGIN_ERRORS.invalidCredentials);
        },
    );

    test(
        'Login-004: unknown username gets the invalid credentials error message',
        { tag: ['@negative'] },
        async ({ loginPage }) => {
            await loginPage.login('unknown_user', PASSWORD);

            await expectLoginError(loginPage, LOGIN_ERRORS.invalidCredentials);
        },
    );

    test(
        'Login-005: empty username gets the username required error message',
        { tag: ['@fieldValidation'] },
        async ({ loginPage }) => {
            await loginPage.login('', PASSWORD);

            await expectLoginError(loginPage, LOGIN_ERRORS.usernameRequired);
        },
    );

    test(
        'Login-006: empty password gets the password required error message',
        { tag: ['@fieldValidation'] },
        async ({ loginPage }) => {
            await loginPage.login(USERS.standard, '');

            await expectLoginError(loginPage, LOGIN_ERRORS.passwordRequired);
        },
    );

    test(
        'Login-007: empty username and password gets the username required error message',
        { tag: ['@fieldValidation'] },
        async ({ loginPage }) => {
            await loginPage.login('', '');

            await expectLoginError(loginPage, LOGIN_ERRORS.usernameRequired);
        },
    );

    test(
        'Login-008: direct access to the inventory page without login is blocked',
        { tag: ['@smoke', '@security'] },
        async ({ loginPage, page }) => {
            await page.goto('/inventory.html');

            await expect(page).not.toHaveURL(/inventory\.html/);
            await expectLoginError(loginPage, LOGIN_ERRORS.notLoggedIn);
        },
    );

    test('Login-009: password input is masked', { tag: ['@fieldValidation'] }, async ({ loginPage }) => {
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });
});
