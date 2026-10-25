/**
 * Page load budgets, applied to every page load by BasePage.goto() / waitUntilLoaded(). These are assumed requirements (no NFR is defined for SauceDemo), based on
 * Google's Core Web Vitals (good content load ≤ 2.5 s, poor > 4 s) and usability research
 * (users lose attention after about 10 s). In a real project they come from the non-functional requirements.
 */
export const PAGE_LOAD = {
    /** Above this the test passes with a warning annotation in the report */
    warnAfterMs: 3_000,
    /** Above this the test fails */
    failAfterMs: 10_000,
} as const;
