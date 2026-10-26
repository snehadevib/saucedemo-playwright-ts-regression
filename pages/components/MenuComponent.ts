import { type Page, type Locator } from '@playwright/test';

/**
 * The burger menu (☰) in the header of every logged-in page. Shared by all page objects via BasePage.menu.
 */
export class MenuComponent {
    readonly openButton: Locator;
    readonly closeButton: Locator;
    readonly items: Locator;
    readonly allItemsLink: Locator;
    readonly dynamicCatalogLink: Locator;
    readonly aboutLink: Locator;
    readonly logoutLink: Locator;
    readonly resetAppStateLink: Locator;
    // Sub-menu of Dynamic Catalog (Lazy Load, Spinner, Slider), collapsed until Dynamic Catalog is clicked
    readonly dynamicCatalogEntries: Locator;
    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        // The data-test ids 'open-menu' / 'close-menu' sit on the icon images, which are covered by the real buttons
        // (Playwright refuses to click covered elements), so click the buttons by role and name
        this.openButton = page.getByRole('button', { name: 'Open Menu' });
        this.closeButton = page.getByRole('button', { name: 'Close Menu' });
        this.allItemsLink = page.getByTestId('inventory-sidebar-link');
        this.dynamicCatalogLink = page.getByTestId('dynamic-catalog-sidebar-link');
        this.aboutLink = page.getByTestId('about-sidebar-link');
        this.logoutLink = page.getByTestId('logout-sidebar-link');
        this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
        // All menu entries, in display order
        this.items = page.getByTestId(/-sidebar-link$/);
        // The entries are <a> elements with role="button", so find them by data-test, not by role
        this.dynamicCatalogEntries = page
            .getByTestId('dynamic-catalog-submenu')
            .getByTestId(/^dynamic-catalog-.+-link$/);
    }

    // A Dynamic Catalog sub-menu entry by its data-test id (see DYNAMIC_CATALOG in test-data/menu.ts)
    dynamicCatalogEntry(testId: string) {
        return this.page.getByTestId(testId);
    }

    // Open the menu and expand the Dynamic Catalog sub-menu
    async openDynamicCatalog() {
        await this.open();
        await this.dynamicCatalogLink.click();
        await this.dynamicCatalogEntries.first().waitFor({ state: 'visible' });
    }

    // Open the menu and wait until its entries are visible
    async open() {
        await this.openButton.click();
        await this.logoutLink.waitFor({ state: 'visible' });
    }

    // Close the menu with the X and wait until it is hidden
    async close() {
        await this.closeButton.click();
        await this.logoutLink.waitFor({ state: 'hidden' });
    }

    // Open the menu and click Reset App State
    async resetAppState() {
        await this.open();
        await this.resetAppStateLink.click();
    }
}
