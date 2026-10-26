import { test, expect, type LoginPage } from '../fixtures/pages';
import { USERS, PASSWORD, TEST_USERS, INVALID_CREDENTIALS } from '../test-data/users';
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
        'Login-001: valid credentials open the inventory page',
        { tag: ['@smoke', '@integration'] },
        async ({ loginPage, inventoryPage, page }) => {
            // Data-driven: every user in TEST_USERS must be able to log in (one step per user)
            for (const { username } of Object.values(TEST_USERS)) {
                await test.step(`log in as ${username}`, async () => {
                    await loginPage.goto();
                    await loginPage.login(username, PASSWORD);

                    // Soft: a user that can't log in is reported, and the remaining users are still checked
                    await expect.soft(page, 'inventory page opens').toHaveURL(/inventory\.html/);
                    await expect
                        .soft(inventoryPage.inventoryItems.first(), 'products are shown')
                        .toBeVisible();

                    // Log out for the next user: the session is only a cookie
                    await page.context().clearCookies();
                });
            }
        },
    );

    test(
        'Login-002: a locked account is refused with the locked-out error message',
        { tag: ['@smoke', '@negative'] },
        async ({ loginPage }) => {
            await loginPage.login(USERS.lockedOut, PASSWORD);

            await expectLoginError(loginPage, LOGIN_ERRORS.lockedOut);
        },
    );

    test(
        'Login-003: a wrong password is refused with the invalid credentials error message',
        { tag: ['@negative'] },
        async ({ loginPage }) => {
            await loginPage.login(USERS.standard, INVALID_CREDENTIALS.wrongPassword);

            await expectLoginError(loginPage, LOGIN_ERRORS.invalidCredentials);
        },
    );

    test(
        'Login-004: an unknown username is refused with the invalid credentials error message',
        { tag: ['@negative'] },
        async ({ loginPage }) => {
            await loginPage.login(INVALID_CREDENTIALS.unknownUsername, PASSWORD);

            await expectLoginError(loginPage, LOGIN_ERRORS.invalidCredentials);
        },
    );

    test(
        'Login-005: empty username gets the username required error message',
        { tag: ['@fieldLevel'] },
        async ({ loginPage }) => {
            await loginPage.login('', PASSWORD);

            await expectLoginError(loginPage, LOGIN_ERRORS.usernameRequired);
        },
    );

    test(
        'Login-006: empty password gets the password required error message',
        { tag: ['@fieldLevel'] },
        async ({ loginPage }) => {
            await loginPage.login(USERS.standard, '');

            await expectLoginError(loginPage, LOGIN_ERRORS.passwordRequired);
        },
    );

    test(
        'Login-007: empty username and password gets the username required error message',
        { tag: ['@fieldLevel'] },
        async ({ loginPage }) => {
            await loginPage.login('', '');

            await expectLoginError(loginPage, LOGIN_ERRORS.usernameRequired);
        },
    );

    test(
        'Login-008: protected pages cannot be opened without login',
        { tag: ['@smoke', '@negative', '@security'] },
        async ({
            loginPage,
            inventoryPage,
            cartPage,
            checkoutInformationPage,
            checkoutOverviewPage,
            checkoutCompletePage,
            page,
        }) => {
            // Data-driven: every page that needs a login (add new protected pages here)
            const protectedPages = [
                inventoryPage,
                cartPage,
                checkoutInformationPage,
                checkoutOverviewPage,
                checkoutCompletePage,
            ];
            for (const protectedPage of protectedPages) {
                await test.step(`open ${protectedPage.path} without login`, async () => {
                    await page.goto(protectedPage.path);

                    await expect(page, 'stays on the login page').not.toHaveURL(protectedPage.path);
                    await expectLoginError(loginPage, LOGIN_ERRORS.notLoggedIn(protectedPage.path));
                });
            }
        },
    );

    test(
        'Login-009: password input is masked',
        { tag: ['@fieldLevel', '@security'] },
        async ({ loginPage }) => {
            await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
        },
    );
});
