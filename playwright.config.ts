import { defineConfig, devices } from '@playwright/test';
import { TEST_USERS, type TestUser } from './test-data/users';

const browsers = [
    { name: 'chromium', device: 'Desktop Chrome' },
    { name: 'firefox', device: 'Desktop Firefox' },
    { name: 'webkit', device: 'Desktop Safari' },
];

// Every user except standard gets its own project (see projects below)
const otherUsers = (Object.keys(TEST_USERS) as TestUser[]).filter((user) => user !== 'standard');

// performanceGlitch -> performance-glitch
const toKebab = (text: string) => text.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

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

    projects: [
        // Logs in once per user and saves each session to playwright/.auth/ (see tests/auth.setup.ts)
        { name: 'setup', testMatch: /.*\.setup\.ts/ },

        // Regression gate: every test as standard_user in the three major browser engines.
        // Specs that need a logged-out browser opt out with test.use({ storageState: ... }).
        ...browsers.map(({ name, device }) => ({
            name,
            use: { ...devices[device], storageState: TEST_USERS.standard.authFile },
            metadata: { user: 'standard' },
            dependencies: ['setup'],
        })),

        // Defect run: every logged-in test as each other user, on Chromium only.
        // Project names look like "problem-user"; login tests don't depend on a user, so they're skipped here.
        ...otherUsers.map((user) => ({
            name: `${toKebab(user)}-user`,
            use: { ...devices['Desktop Chrome'], storageState: TEST_USERS[user].authFile },
            metadata: { user },
            testIgnore: /login\.spec\.ts/,
            dependencies: ['setup'],
        })),
    ],
});
