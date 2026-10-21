import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { USERS, PASSWORD } from '../test-data/users';
import { LOGIN_ERRORS } from '../test-data/messages';

test.describe('Login', () => {
    test(
        'Login-001: valid login with standard_user opens the inventory page',
        { tag: ['@functional', '@smoke'] },
        async ({ page }) => {
            const loginPage = new LoginPage(page);

            await loginPage.goto();
            await loginPage.login(USERS.standard, PASSWORD);

            await expect(page).toHaveURL(/inventory\.html/);
        },
    );

    test(
        'Login-002: locked_out_user gets the locked-out error message',
        { tag: ['@smoke', '@negative'] },
        async ({ page }) => {
            const loginPage = new LoginPage(page);

            await loginPage.goto();
            await loginPage.login(USERS.lockedOut, PASSWORD);

            await expect(loginPage.errorMessage).toHaveText(LOGIN_ERRORS.lockedOut);
            await expect(loginPage.loginButton).toBeVisible();
        },
    );

    test(
        'Login-003: wrong password for standard_user gets the invalid credentials error message',
        { tag: ['@negative'] },
        async ({ page }) => {
            const loginPage = new LoginPage(page);

            await loginPage.goto();
            await loginPage.login(USERS.standard, 'wrongpassword');

            await expect(loginPage.errorMessage).toHaveText(LOGIN_ERRORS.invalidCredentials);
            await expect(loginPage.loginButton).toBeVisible();
        },
    );
});