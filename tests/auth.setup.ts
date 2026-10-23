import { test as setup, expect } from '../fixtures/pages';
import { USERS, PASSWORD } from '../test-data/users';

const authFile = 'playwright/.auth/standard.json';

setup('authenticate as standard_user', async ({ loginPage, inventoryPage, page }) => {
    await loginPage.goto();
    await loginPage.login(USERS.standard, PASSWORD);

    // Make sure login really worked before saving the session
    await expect(inventoryPage.inventoryItems.first()).toBeVisible();

    await page.context().storageState({ path: authFile });
});
