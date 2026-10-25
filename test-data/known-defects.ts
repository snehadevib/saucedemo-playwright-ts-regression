import { type TestUser } from './users';

/** A test that currently fails for one user because of a known bug. */
export type KnownDefect = {
    /** Test ID from the start of the test title, e.g. 'Inventory-001' */
    testId: string;
    /** Which TEST_USERS row the test fails for; 'all' when the bug affects every user */
    user: TestUser | 'all';
    /** Bug ID from the bug register in README.md */
    bug: string;
    description: string;
};

/**
 * Known bugs, linked to the tests that catch them. Tests never mention bugs themselves:
 * a fixture adds a "bug" annotation to the report for each matching test + user.
 * When a bug is fixed, delete its rows here; the test then passes for that user.
 */
export const KNOWN_DEFECTS: readonly KnownDefect[] = [
    {
        testId: 'Inventory-001',
        user: 'problem',
        bug: 'BUG-001',
        description: 'problem_user sees the same image for every product',
    },
    // BUG-002 breaks every sort option, so all sorting tests fail for problem_user
    ...['Inventory-005', 'Inventory-006', 'Inventory-007', 'Inventory-008'].map((testId) => ({
        testId,
        user: 'problem' as const,
        bug: 'BUG-002',
        description: 'problem_user: choosing any sort option has no effect',
    })),
    ...['Inventory-009', 'Inventory-010'].map((testId) => ({
        testId,
        user: 'problem' as const,
        bug: 'BUG-006',
        description: "problem_user: clicking a product opens a different product's details page",
    })),
];
