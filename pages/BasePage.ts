import { type Page } from '@playwright/test';

// Common parent class for all page objects.
// Contains only what every page shares: the page reference and navigation.

export abstract class BasePage {
    readonly page: Page;

    // URL path of the page relative to baseURL, e.g. '/' or '/inventory.html'
    abstract readonly path: string;

    constructor(page: Page) {
        this.page = page;
    }

    // Open this page (baseURL from playwright.config.ts + path)
    async goto(){
        await this.page.goto(this.path);
    }
}
