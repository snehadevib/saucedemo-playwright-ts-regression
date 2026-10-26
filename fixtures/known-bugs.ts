import { test } from '@playwright/test';
import { type TestUser } from '../test-data/users';

const ISSUES_URL = 'https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues';

/** A known SauceDemo bug that also affects standard_user, tracked as a GitHub issue. */
export type KnownBug = { id: string; issue: number };

/**
 * Marks the current test as failing because of a known bug that also affects standard_user.
 * Call it at the start of the test.
 * - Every user: adds an "issue" annotation with the GitHub link to the report.
 * - standard_user (the regression gate): the test is expected to fail (test.fail), so the gate stays green.
 *   If the bug gets fixed, Playwright reports the test as "expected to fail, but passed": then remove the call.
 * - Other users: no change; the test fails normally in the defect runs.
 * - Every user: a full-page screenshot "known-bug evidence" is attached at the end (see knownBugEvidence in fixtures/pages.ts).
 */
export function knownBugInGate(bug: KnownBug | undefined) {
    if (!bug) return;
    const info = test.info();
    const user = (info.project.metadata as { user?: TestUser }).user;

    info.annotations.push({ type: 'issue', description: `${bug.id}: ${ISSUES_URL}/${bug.issue}` });
    test.fail(user === 'standard', `${bug.id} (known bug, see issue #${bug.issue})`);
}

/** Known bugs that make tests fail for standard_user. Remove an entry's usages when the issue is closed. */
export const KNOWN_BUGS = {
    itemTotalFormat: { id: 'BUG-011', issue: 11 },
    emptyOrder: { id: 'BUG-012', issue: 12 },
    stepsSkippableByUrl: { id: 'BUG-013', issue: 13 },
    spacesOnlyAccepted: { id: 'BUG-014', issue: 14 },
} as const satisfies Record<string, KnownBug>;
