/**
 * Expected footer content on logged-in pages.
 * Social link URLs to be confirmed in DevTools (right-click the icon → Inspect → href).
 */
export const FOOTER = {
    // The year changes, so it is matched by pattern
    copyright: /© \d{4} Sauce Labs\. All Rights Reserved\. Terms of Service \| Privacy Policy/,
    socialLinks: {
        x: 'https://x.com/saucelabs',
        facebook: 'https://www.facebook.com/saucelabs',
        linkedIn: 'https://www.linkedin.com/company/sauce-labs/',
    },
} as const;
