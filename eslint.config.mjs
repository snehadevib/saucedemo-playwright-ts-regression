// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    {
        ignores: [
            'node_modules/',
            'playwright-report/',
            'test-results/',
            'blob-report/',
            'playwright/.cache/',
        ],
    },

    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                // Type information is needed for the promise rules below
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // A missing `await` on an action or assertion makes a test pass silently
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
        },
    },

    // Playwright best practices for specs, fixtures and page objects
    {
        ...playwright.configs['flat/recommended'],
        files: ['tests/**/*.ts', 'fixtures/**/*.ts', 'pages/**/*.ts'],
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            'playwright/no-focused-test': 'error',
            'playwright/no-wait-for-timeout': 'error',
            'playwright/no-page-pause': 'error',
            'playwright/prefer-web-first-assertions': 'error',
            // Shared assertion helpers count as assertions (add new helpers here)
            'playwright/expect-expect': [
                'warn',
                { assertFunctionNames: ['expectLoginError', 'openEachProductBy'] },
            ],
        },
    },

    // This file itself is plain JS, so it gets no type-checked rules
    {
        files: ['**/*.mjs'],
        ...tseslint.configs.disableTypeChecked,
    },

    // Must be last: turns off rules that conflict with Prettier formatting
    prettier,
);
