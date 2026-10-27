import { test as setup, expect } from '../fixtures/pages';
import { PASSWORD, TEST_USERS } from '../test-data/users';

// One saved session per row in TEST_USERS
for (const { username, authFile } of Object.values(TEST_USERS)) {
    setup(`authenticate as ${username}`, async ({ loginPage, inventoryPage, page }) => {
        await loginPage.goto();
        await loginPage.login(username, PASSWORD);

        // Make sure login really worked before saving the session (slow users get the full page-load budget)
        await inventoryPage.waitUntilLoaded();
        await expect(page, 'logged in on the inventory page').toHaveURL(inventoryPage.path);

        await page.context().storageState({ path: authFile });
    });
}
