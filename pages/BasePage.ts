import { test, errors, type Page, type Locator } from '@playwright/test';
import { PAGE_LOAD } from '../test-data/performance';
import { MenuComponent } from './components/MenuComponent';

/**
 * Common parent class for all page objects.
 * Contains only what every page shares: the page reference, navigation and timed page loads.
 */
export abstract class BasePage {
    readonly page: Page;

    // URL path of the page relative to baseURL, e.g. '/' or '/inventory.html'
    abstract readonly path: string;

    // Name used in load-time messages, e.g. 'Inventory page'
    abstract readonly pageName: string;

    // An element that is only shown once the page has loaded, e.g. the product list
    abstract readonly readyIndicator: Locator;

    // Header parts shown on every logged-in page (inventory, details, cart, checkout)
    readonly cartLink: Locator;
    readonly cartBadge: Locator;
    readonly menu: MenuComponent;

    constructor(page: Page) {
        this.page = page;
        this.cartLink = page.getByTestId('shopping-cart-link');
        this.cartBadge = page.getByTestId('shopping-cart-badge');
        this.menu = new MenuComponent(page);
    }

    // Open this page's URL directly, without waiting for it to load (e.g. to check that it is blocked)
    async openUrlDirectly() {
        await this.page.goto(this.path);
    }

    // Reload the current page and wait until this page has loaded again
    async reload() {
        const start = Date.now();
        await this.page.reload();
        await this.waitUntilLoaded(start);
    }

    // Browser Back button
    async goBack() {
        await this.page.goBack();
    }

    /**
     * Click something that opens this page, and wait until it has loaded.
     * The load is timed from the click (warning over budget, failure over the hard limit).
     */
    async openBy(link: Locator) {
        const clickedAt = Date.now();
        await link.click();
        await this.waitUntilLoaded(clickedAt);
    }

    // Open this page (baseURL from playwright.config.ts + path) and wait until it has loaded
    async goto() {
        const start = Date.now();
        await this.page.goto(this.path);
        await this.waitUntilLoaded(start);
    }

    /**
     * Wait until the page has loaded, and record how long it took.
     * Call it after an action that opens this page (e.g. a click), so every page load is timed.
     * - always: adds a "load time" annotation to the report
     * - over PAGE_LOAD.warnAfterMs: adds a "warning" annotation, the test continues
     * - over PAGE_LOAD.failAfterMs: fails with "<page> did not load within N s"
     */
    async waitUntilLoaded(start = Date.now()) {
        try {
            await this.readyIndicator.waitFor({ state: 'visible', timeout: PAGE_LOAD.failAfterMs });
        } catch (error) {
            // Only a timeout means "too slow"; any other error (e.g. a bad locator) is reported as it is
            if (error instanceof errors.TimeoutError) {
                throw new Error(`${this.pageName} did not load within ${PAGE_LOAD.failAfterMs / 1000} s`, {
                    cause: error,
                });
            }
            throw error;
        }

        const loadMs = Date.now() - start;
        const annotations = test.info().annotations;
        annotations.push({ type: 'load time', description: `${this.pageName}: ${loadMs} ms` });
        if (loadMs > PAGE_LOAD.warnAfterMs) {
            annotations.push({
                type: 'warning',
                description: `${this.pageName} loaded in ${loadMs} ms (budget ${PAGE_LOAD.warnAfterMs} ms)`,
            });
        }
    }
}
