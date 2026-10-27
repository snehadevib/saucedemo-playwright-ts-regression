import { type Page, type Locator } from '@playwright/test';

/**
 * The burger menu (☰) in the header of every logged-in page. Shared by all page objects via BasePage.menu.
 */
export class MenuComponent {
    readonly openButton: Locator;
    readonly closeButton: Locator;
    readonly panel: Locator;
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
        // The menu panel; only exposed as "navigation" while open (aria-hidden when closed)
        this.panel = page.getByRole('navigation');
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
        await this.openWith(this.dynamicCatalogLink);
        await this.clickUntilVisible(this.dynamicCatalogLink, this.dynamicCatalogEntries.first());
    }

    // Open the menu and wait until its entries are visible
    async open() {
        // The button toggles, so never click it while the menu is already open
        if (await this.panel.isVisible()) return;
        // In WebKit a click right after a page appears was sometimes lost: the page's scripts were not ready yet.
        // Waiting for the load event (all scripts loaded and run) prevents that.
        await this.page.waitForLoadState('load');
        // The entries slide off-screen when closed but still count as "visible", and the Close button only
        // counts as visible after the slide animation. The menu panel is aria-hidden while closed, so the
        // navigation role appears the moment it opens: the reliable "menu is open" signal
        await this.clickUntilVisible(this.openButton, this.panel);
    }

    /**
     * Click, then wait for the result; click again only if it still has not appeared (at most 3 attempts).
     * The button toggles (open/close), so a click that arrives late must not be followed by a second click:
     * before each retry the result is checked once more. If the result never appears, the last error is reported.
     */
    private async clickUntilVisible(button: Locator, result: Locator) {
        const attempts = 3;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            if (attempt > 1 && (await result.isVisible())) return;
            await button.click();
            try {
                await result.waitFor({ state: 'visible', timeout: 5_000 });
                return;
            } catch (error) {
                if (attempt === attempts) throw error;
            }
        }
    }

    /**
     * Open the menu and make sure the entry can be clicked. In WebKit the menu sometimes closes again on its own
     * right after opening; then open it again (at most 3 attempts) instead of waiting for a hidden entry.
     */
    async openWith(entry: Locator) {
        const attempts = 3;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            await this.open();
            try {
                await entry.waitFor({ state: 'visible', timeout: 2_000 });
                return;
            } catch (error) {
                if (attempt === attempts) throw error;
            }
        }
    }

    // Close the menu with the X and wait until it is hidden
    async close() {
        await this.closeButton.click();
        await this.panel.waitFor({ state: 'hidden' });
    }

    // Open the menu and click Reset App State
    async resetAppState() {
        await this.openWith(this.resetAppStateLink);
        await this.resetAppStateLink.click();
    }
}
