/**
 * Saucedemo test users. All users have the same password.
 */
export const PASSWORD = 'secret_sauce';

export const USERS = {
    standard: 'standard_user',
    lockedOut: 'locked_out_user',
    problem: 'problem_user',
    performanceGlitch: 'performance_glitch_user',
    error: 'error_user',
    visual: 'visual_user',
} as const;

/** Credentials that must be refused by the login form. */
export const INVALID_CREDENTIALS = {
    unknownUsername: 'unknown_user',
    wrongPassword: 'wrongpassword',
} as const;

/**
 * Users that logged-in tests run as. Each row gets its own saved session (tests/auth.setup.ts)
 * and its own Playwright project (playwright.config.ts), so every test runs once per user.
 * To add a user, add a row here. locked_out_user can't log in, so it is only used in login tests.
 */
export const TEST_USERS = {
    standard: { username: USERS.standard, authFile: 'playwright/.auth/standard.json' },
    problem: { username: USERS.problem, authFile: 'playwright/.auth/problem.json' },
    error: { username: USERS.error, authFile: 'playwright/.auth/error.json' },
    visual: { username: USERS.visual, authFile: 'playwright/.auth/visual.json' },
    performanceGlitch: {
        username: USERS.performanceGlitch,
        authFile: 'playwright/.auth/performance-glitch.json',
    },
} as const;

export type TestUser = keyof typeof TEST_USERS;
