import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    // Look for test files in the "tests" directory, relative to this configuration file.
    testDir: './tests',

    // Run all tests in parallel.
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,

    // Retry on CI only.
    retries: process.env.CI ? 2 : 0,

    // Opt out of parallel tests on CI.
    workers: process.env.CI ? 1 : undefined,

    // Limit the whole test run, so that it fails with a report instead of hanging.
    globalTimeout: 30 * 60 * 1000,

    // HTML report + readable console output
    reporter: [['html', { open: 'never' }], ['list']],

    use: {
        // Base URL to use in actions like `await page.goto('/')`.
        baseURL: 'https://www.saucedemo.com',

        // Headed locally for visibility; headless on CI (no display available)
        headless: !!process.env.CI,

        // Saucedemo marks elements with data-test="..." -> page.getByTestId('...')
        testIdAttribute: 'data-test',

        // Evidence for failed tests only
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    // Run every test in the three major browser engines
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
});
