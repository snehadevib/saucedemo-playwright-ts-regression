/** Expected entries of the burger menu, in display order (confirmed in DevTools). */
export const MENU_ITEMS = ['All Items', 'Dynamic Catalog', 'About', 'Logout', 'Reset App State'] as const;

/** Entries of the Dynamic Catalog sub-menu and the pages they open (confirmed in DevTools and by hand). */
export const DYNAMIC_CATALOG = [
    {
        name: 'Lazy Load',
        testId: 'dynamic-catalog-lazy-load-link',
        path: '/dynamic-catalog-lazy-load.html',
        title: 'Dynamic Catalog - Lazy Load',
    },
    {
        name: 'Spinner',
        testId: 'dynamic-catalog-spinner-link',
        path: '/dynamic-catalog-spinner.html',
        title: 'Dynamic Catalog - Spinner',
    },
    {
        name: 'Slider',
        testId: 'dynamic-catalog-slider-link',
        path: '/dynamic-catalog-slider.html',
        title: 'Dynamic Catalog - Slider',
    },
] as const;

/** The About link leads to the Sauce Labs website (external, so only the address is checked). */
export const ABOUT_URL = 'https://saucelabs.com/';
