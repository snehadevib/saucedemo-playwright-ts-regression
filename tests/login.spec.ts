import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { USERS, PASSWORD } from '../test-data/users';

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
});