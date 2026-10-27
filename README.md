# saucedemo-playwright-ts-regression

[![Playwright tests](https://github.com/snehadevib/saucedemo-playwright-ts-regression/actions/workflows/playwright.yml/badge.svg)](https://github.com/snehadevib/saucedemo-playwright-ts-regression/actions/workflows/playwright.yml)

Regression test suite for [SauceDemo](https://www.saucedemo.com), built with Playwright and TypeScript.

**Approach:** one suite, run as every SauceDemo user. `standard_user` on Chromium, Firefox and WebKit is the **regression gate** (must be green, runs in CI on every push); the special users are **defect runs** that expose their injected bugs, tracked as [GitHub issues](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues).

| Area      | Tests          | What is covered                                                         | Bugs caught                                                  |
| --------- | -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| Login     | 9              | Valid and invalid logins, required fields, protected pages, masking     | —                                                            |
| Inventory | 11 + 1 planned | Product details, layout, images, sorting, footer, product details page  | BUG-001, 002, 006, 007, 008, 009; BUG-005 (planned test)     |
| Cart      | 12             | Add and remove on every page, badge, cart page, state across pages      | BUG-003, 006, 010                                            |
| Checkout  | 16             | Required fields, totals and tax, cancel paths, direct URLs, end to end  | BUG-003, 011, 012, 013, 014, 015, 016, 017                   |
| Receipt   | 2              | PDF download and its content against the order                          | BUG-015, 017                                                 |
| Menu      | 6              | Menu on every page, logout, reset app state, all items, dynamic catalog | BUG-004, 015, 017, 018                                       |
| **Total** | **56**         | Every test runs for every user; plus timed page loads on every page     | **18 bugs** ([list](#bugs)), 3 [observations](#observations) |

## Prerequisites

- Node.js 22 or newer
- Git

## Setup

```bash
npm ci
npx playwright install
```

## Running tests

There are two kinds of runs:

- **Regression gate**: `standard_user`, the normal user. Every test must pass; a red gate means something is really broken.
  Known bugs that also affect `standard_user` are marked as expected failures (see [Bugs](#bugs)), so they count as passed while the bug exists.
- **Defect runs**: the special users (`problem_user`, `error_user`, ...), which SauceDemo breaks on purpose.
  Their tests **are expected to fail**: each failure shows one of that user's defects. They never block a release.
  The known bugs of `standard_user` are only marked as expected in the gate, so in the defect runs they fail as normal tests.

| Command                                        | What it runs                                                          | Expected result                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `npm run test:gate`                            | **Regression gate**: `standard_user` on Chromium, Firefox, WebKit     | ✅ All passed (this is what CI runs on every push)              |
| `npm run test:smoke`                           | `@smoke` tests only, Chromium, `standard_user`                        | ✅ All passed (quick check in about a minute)                   |
| `npm run test:chromium` / `firefox` / `webkit` | The gate in one browser only                                          | ✅ All passed                                                   |
| `npm test`                                     | Everything: the gate **plus** all defect runs                         | ❌ Fails: gate tests pass, the defect-run failures make it red  |
| `npm run test:users`                           | **Defect runs** for all special users (see [Test users](#test-users)) | ❌ Fails: the failures are the users' defects                   |
| `npm run test:problem`                         | Defect run as `problem_user`                                          | ❌ Fails: the user's defects plus the shared known bugs         |
| `npm run test:error`                           | Defect run as `error_user`                                            | ❌ Fails: the user's defects plus the shared known bugs         |
| `npm run test:visual`                          | Defect run as `visual_user`                                           | ❌ Fails: the user's defects plus the shared known bugs         |
| `npm run test:performance`                     | Defect run as `performance_glitch_user`                               | ❌ Fails on the shared known bugs only; slow pages get warnings |
| `npm run test:headed`                          | All tests with the browser visible                                    | Same as `npm test`                                              |
| `npm run test:ui`                              | Playwright UI mode: pick and watch tests interactively                | —                                                               |
| `npm run test:debug`                           | Step through a test with the Playwright Inspector                     | —                                                               |
| `npm run report`                               | Open the HTML report of the last run                                  | —                                                               |
| `npm run codegen`                              | Record locators against SauceDemo                                     | —                                                               |

Locally a failed test is retried once (twice on CI). A test that passes only on retry is reported as **flaky**:
the run stays green, but the flaky test is listed in the summary so it can be fixed.

Any script takes extra Playwright options after `--`, for example one spec or one test ID:

```bash
npm run test:problem -- tests/inventory.spec.ts
npm run test:gate -- -g "Inventory-005"
```

## Code quality

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run typecheck` | TypeScript type check                                     |
| `npm run lint`      | ESLint (TypeScript + Playwright rules)                    |
| `npm run lint:fix`  | ESLint with auto-fix                                      |
| `npm run format`    | Format all files with Prettier                            |
| `npm run check`     | Typecheck + lint + format check (run before every commit) |

ESLint's `no-floating-promises` rule catches a missing `await`, the most common cause of tests that pass silently.

## CI

GitHub Actions ([`.github/workflows/playwright.yml`](.github/workflows/playwright.yml), [runs](https://github.com/snehadevib/saucedemo-playwright-ts-regression/actions)):

- **On every push and pull request to `main`:** `npm run check`, then the regression gate (`npm run test:gate`). A red run blocks the change.
- **Defect runs on demand:** Actions → **Playwright tests** → **Run workflow**, tick "Also run the defect runs". This job is allowed to fail, because its failures are the special users' defects.
- **Report:** every run uploads the HTML report as an artifact (`gate-report`, `users-report`; kept 14 days). Download it from the run's page, unzip it and open `index.html`.
- On CI, failed tests are retried twice and run with one worker; check the summary for **flaky** tests even when the run is green.

## Project structure

```
├── fixtures/
│   └── pages.ts            # Extended `test` that provides page objects and the checkout flow; import test/expect from here
├── flows/
│   └── CheckoutFlow.ts     # Shared checkout steps (add products → information → overview → finish)
├── helpers/
│   └── pdf.ts              # readPdfText(), isPdf(): PDF checks with pdf-parse
├── pages/
│   ├── BasePage.ts         # Shared parent: path, goto(), openBy(), timed page loads, cart icon and badge
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── ProductDetailsPage.ts
│   ├── CartPage.ts
│   ├── CheckoutInformationPage.ts
│   ├── CheckoutOverviewPage.ts
│   ├── CheckoutCompletePage.ts
│   ├── DynamicCatalogPage.ts   # Lazy Load / Spinner / Slider demo pages (title and products only)
│   └── components/
│       └── MenuComponent.ts    # Burger menu, shared by all pages via BasePage.menu
├── test-data/
│   ├── users.ts            # SauceDemo users, password, TEST_USERS (one row per user tests run as)
│   ├── messages.ts         # Expected UI messages
│   ├── products.ts         # Expected product catalogue (default A–Z order)
│   ├── checkout.ts         # Tax rate, customers, order scenarios, expected totals, checkout texts
│   ├── footer.ts           # Expected footer text and social links
│   ├── menu.ts             # Expected menu items and the About link
│   └── performance.ts      # Page load budget (warning) and hard limit (failure)
├── tests/
│   ├── auth.setup.ts       # Logs in once per TEST_USERS row and saves each session
│   ├── login.spec.ts
│   ├── inventory.spec.ts
│   ├── cart.spec.ts
│   ├── checkout.spec.ts
│   ├── receipt.spec.ts     # PDF order receipt: download and content (reads the PDF text with pdf-parse)
│   └── menu.spec.ts
└── playwright.config.ts    # Builds one project per browser and per user from TEST_USERS
```

## Framework conventions

- **Page Object Model:** page objects hold locators and actions, never assertions. Specs get them from fixtures (`async ({ loginPage }) => ...`) and never create them with `new`.
- **Locators:** use `getByTestId` (SauceDemo's `data-test` attribute) or `getByRole`. No CSS or XPath.
- **Login sessions:** the `setup` project logs in once per user in `TEST_USERS` and saves each session to `playwright/.auth/`. Every project starts already logged in as its user. Specs that need a logged-out browser opt out:
  ```ts
  test.use({ storageState: { cookies: [], origins: [] } });
  ```
- **Test data:** no hard-coded test data in specs. Use `test-data/`.
- **Assertions:** web-first assertions only (`toHaveText`, `toHaveURL`, ...). No `waitForTimeout`.
- **Steps and messages:** use `test.step` and assertion messages, so the HTML report reads as evidence.

## Test users

The user is a test **dimension**, like the browser, not something each test chooses. `playwright.config.ts` builds the projects from `TEST_USERS` in `test-data/users.ts`:

| Project                         | User                      | Browsers  | Purpose                                |
| ------------------------------- | ------------------------- | --------- | -------------------------------------- |
| `chromium`, `firefox`, `webkit` | `standard_user`           | All three | **Regression gate**: must be green     |
| `problem-user`                  | `problem_user`            | Chromium  | **Defect run**: shows this user's bugs |
| `error-user`                    | `error_user`              | Chromium  | Defect run                             |
| `visual-user`                   | `visual_user`             | Chromium  | Defect run                             |
| `performance-glitch-user`       | `performance_glitch_user` | Chromium  | Defect run                             |

- Every logged-in test runs for every user automatically. Tests contain no user lists and no `if (user === ...)`: each test asserts the correct behaviour, the same for every user.
- Login tests run in the standard projects only, because they start logged out.
- `locked_out_user` can't log in, so it is used only in the login tests.
- **Adding a user:** add one row to `TEST_USERS`. Its session and project are created automatically.
- **Browsers are set in `playwright.config.ts`, not per user:** `standard_user` runs on all three browsers, every other user on Chromium. SauceDemo's faults are in the app logic and look the same in every browser. Add a per-user browser setting only if a user's bug turns out to be browser-specific.

**Why every test runs per user here:** SauceDemo's users are not roles. They are the same shopper with deliberately injected faults, so every test should pass for every user, and a failure points to a bug. In a real application, users would be **roles or account types** (admin vs customer, free vs premium). The main suite would run as one standard user, and role-specific behaviour would get its own tests with role-specific expected results.

## Test case conventions

### IDs

- Sequential per page: `Login-001`, `Inventory-001`, `Cart-001`, `Menu-001`.
- The ID is part of the test title: `'Inventory-002: products are sorted by Name (A to Z) by default'`.
- IDs are permanent. Never renumber. A new test always gets the next free number, even if it belongs between existing tests logically.
- A deleted test's ID is retired, never reused.
- Grouping comes from the spec file and `test.describe` blocks, not from the numbers.
- A test title describes the **functionality**, never a bug or a user. One test ID covers all users.

### Tags

The whole suite is the regression suite, so there is no `@regression` tag. The regression gate (`npm run test:gate`) is the release check.

| Dimension | Tags                                                              | Rule                                                                                   |
| --------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Suite     | `@smoke`                                                          | Only on the few critical tests (quick health check). Every other test has no suite tag |
| Category  | `@fieldLevel`, `@negative`, `@functional`, `@integration`, `@e2e` | **Exactly one on every test**                                                          |
| Topic     | `@security`, `@ui`                                                | Only where it applies                                                                  |

| Category       | Meaning                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `@fieldLevel`  | Validation of a single input (required, empty, masked)                                                                   |
| `@negative`    | An invalid or forbidden action is refused (locked user, wrong password, blocked URL, empty or duplicate order)           |
| `@functional`  | One feature on one page works (sorting, layout, totals, menu items)                                                      |
| `@integration` | Several pages or features work together, state is carried across (cart ↔ details ↔ inventory, Cancel, Back Home, logout) |
| `@e2e`         | A complete user journey (order from inventory to confirmation)                                                           |

Run one category or topic with `npx playwright test --grep @negative`. Tag names are camelCase. Add a new tag only when you will actually filter or report by it. Users and bugs are not tags: users are projects, and bugs are GitHub issues.

### Bugs and failure triage

Bugs are tracked outside the framework, as [GitHub issues](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues). Test titles and assertions never mention bugs: a test asserts the correct behaviour and simply fails while a bug exists. The only link is the `knownBugInGate` marker for bugs that also affect `standard_user` (see [below](#known-bugs-in-the-regression-gate)).

When a test fails:

1. Check the [open issues](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues?q=is%3Aissue+is%3Aopen+label%3Abug). Each issue lists the tests and user (project) that catch it under **Caught by**.
2. **Known bug:** nothing to change.
3. **New bug:** create an issue (title `[BUG-00N] ...`, steps, expected, actual, caught by, screenshot) and add it to the [bug list](#bugs).
4. **Broken test** (wrong locator, wrong test data, timing): fix the test.

When an issue is closed, the test starts passing for that user without any code change.

In a larger setup, step 1 is automated by a reporting or test-management tool (Allure, ReportPortal, Xray) that links failures to tickets.

### Known bugs in the regression gate

Bugs that only affect special users fail in the defect runs, which is their purpose. A bug that **also affects `standard_user`** would turn the regression gate red on every run and hide new failures. Those tests call `knownBugInGate(...)` (`fixtures/known-bugs.ts`) at the start:

- In the `standard_user` projects the test is **expected to fail** (`test.fail()`), so the gate stays green while the bug exists.
- Every run adds an **issue** annotation with the GitHub link to the report.
- Every run attaches a full-page screenshot **"known-bug evidence"**. A test that fails as expected counts as passed, so Playwright would otherwise delete its failure screenshot, video and trace. For a full trace, run the single test with `--trace on`.
- If the bug gets fixed, Playwright reports the test as **"expected to fail, but passed"**: remove the call, and close the issue.
- In the special-user projects nothing changes: the test fails normally.

Currently marked: Menu-004 (BUG-004), Checkout-002 (BUG-014), Checkout-005 rounding case (BUG-011), Checkout-009 and 016 (BUG-012), Checkout-010 and 013 (BUG-013).

## Test cases

Status: ✅ automated · 📝 planned. Every logged-in test runs for every test user; see [Bugs](#bugs) for which user fails where.

### Login (`login.spec.ts`)

| ID        | Test case                                                                                                                                   | Expected result                                                              | Tags                         | Status |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------- | ------ |
| Login-001 | Valid credentials open the inventory page (data-driven: every user in `TEST_USERS`, one step each)                                          | Inventory page with products, for every user                                 | `@smoke @integration`        | ✅     |
| Login-002 | A locked account is refused                                                                                                                 | "Sorry, this user has been locked out."; stays on the login page             | `@smoke @negative`           | ✅     |
| Login-003 | A wrong password is refused                                                                                                                 | "Username and password do not match any user in this service"                | `@negative`                  | ✅     |
| Login-004 | An unknown username is refused                                                                                                              | "Username and password do not match any user in this service"                | `@negative`                  | ✅     |
| Login-005 | Empty username                                                                                                                              | "Username is required"                                                       | `@fieldLevel`                | ✅     |
| Login-006 | Empty password                                                                                                                              | "Password is required"                                                       | `@fieldLevel`                | ✅     |
| Login-007 | Empty username and password                                                                                                                 | "Username is required" (username is checked first)                           | `@fieldLevel`                | ✅     |
| Login-008 | Protected pages (inventory, cart, checkout information, overview, complete) cannot be opened without login (data-driven, one step per page) | Login page with "You can only access '&lt;page&gt;' when you are logged in." | `@smoke @negative @security` | ✅     |
| Login-009 | Password input is masked                                                                                                                    | Password field has type `password`                                           | `@fieldLevel @security`      | ✅     |

Login tests start logged out and run in the standard projects only. Usernames and invalid credentials are test data (`test-data/users.ts`), not part of the test titles.

### Inventory (`inventory.spec.ts`)

| ID            | Test case                            | Expected result                                                                     | Tags                     | Status                         |
| ------------- | ------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------ | ------------------------------ |
| Inventory-001 | All products show their details      | 6 products; name, description, price, image and "Add to cart" match the catalogue   | `@functional`            | ✅                             |
| Inventory-002 | Default sort order                   | Dropdown value `az`, label "Name (A to Z)", products listed A→Z                     | `@functional`            | ✅                             |
| Inventory-003 | Page layout                          | Title "Products", logo, cart icon with no badge, menu button, sort dropdown, footer | `@smoke @functional @ui` | ✅                             |
| Inventory-004 | Product images load                  | Every image has `naturalWidth > 0`                                                  | `@functional @ui`        | ✅                             |
| Inventory-005 | Sort Name (Z to A)                   | Products listed Z→A                                                                 | `@functional`            | ✅                             |
| Inventory-006 | Sort Price (low to high)             | Prices ascending; equal prices ($15.99 × 2) handled                                 | `@functional`            | ✅                             |
| Inventory-007 | Sort Price (high to low)             | Prices descending                                                                   | `@functional`            | ✅                             |
| Inventory-008 | Sort resets on reload                | After Z→A and reload: value `az`, label "Name (A to Z)", A→Z order                  | `@functional`            | ✅                             |
| Inventory-009 | Open product by name                 | Details page shows the same name, description and price                             | `@integration`           | ✅                             |
| Inventory-010 | Open product by image                | Same details page as clicking the name                                              | `@integration`           | ✅                             |
| Inventory-011 | Footer                               | Copyright text; X, Facebook and LinkedIn `href`s correct                            | `@functional @ui`        | ✅                             |
| Inventory-012 | Sort dropdown arrow icon (candidate) | Clicking the arrow opens or focuses the sort dropdown                               | `@functional`            | 📝 decide after DevTools check |

### Cart (`cart.spec.ts`)

| ID       | Test case                                                  | Expected result                                                                                           | Navigation steps (shown in the report)                                                                      | Tags                 | Status |
| -------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------- | ------ |
| Cart-001 | Add a product from the inventory page                      | "Remove" shown, no second "Add to cart", badge 1                                                          | —                                                                                                           | `@smoke @functional` | ✅     |
| Cart-002 | Remove a product on the inventory page, then add it again  | After remove: "Add to cart" back, badge gone. After re-add: "Remove", badge 1                             | —                                                                                                           | `@functional`        | ✅     |
| Cart-003 | Add all products                                           | All show "Remove", badge 6                                                                                | —                                                                                                           | `@functional`        | ✅     |
| Cart-004 | Add a product from the product details page                | Details shows "Remove", badge 1; on inventory that product shows "Remove"                                 | open details by name → back to products                                                                     | `@integration`       | ✅     |
| Cart-005 | Remove a product on the product details page               | Details shows "Add to cart", badge gone; on inventory that product shows "Add to cart"                    | open details by image → back to products                                                                    | `@integration`       | ✅     |
| Cart-006 | Cart page lists the added products                         | Names in the order added, prices, quantity 1 each (column headers QTY and Description)                    | open cart (cart icon)                                                                                       | `@integration`       | ✅     |
| Cart-007 | Remove a product on the cart page                          | Item gone, remaining item keeps quantity 1, badge 1; on inventory the removed product shows "Add to cart" | open cart (cart icon) → continue shopping                                                                   | `@integration`       | ✅     |
| Cart-008 | Remove a product on its details page, opened from the cart | Details opens for that product; after Remove: "Add to cart", badge gone; cart page is empty               | open cart (cart icon) → open details by name from cart → open cart again                                    | `@integration`       | ✅     |
| Cart-009 | Empty cart page                                            | No items; Checkout and Continue Shopping shown; back on inventory no badge                                | open cart (cart icon) → continue shopping                                                                   | `@functional`        | ✅     |
| Cart-010 | Cart kept after a page reload                              | Badge 2; both products show "Remove"                                                                      | —                                                                                                           | `@functional`        | ✅     |
| Cart-011 | Cart kept after changing the sort order                    | Badge 2; both products show "Remove"                                                                      | —                                                                                                           | `@functional`        | ✅     |
| Cart-012 | Cart kept when moving between pages                        | After every step: badge 2, both products still added                                                      | open details by name → open cart (cart icon) → continue shopping → open details by image → back to products | `@integration`       | ✅     |

Every change to the cart is checked in three places: on the page where it happened, in the cart badge, and on the inventory page afterwards. Navigation to product details uses both the name and the image link, each shown as a named step in the report; Inventory-009 and 010 separately check both links for all products.

Access without login is covered by Login-008, which checks every protected page (inventory, cart, checkout pages).

### Checkout (`checkout.spec.ts`)

Grouped by page. Expected amounts are calculated from the catalogue (`test-data/checkout.ts`: 8% tax, rounded to the nearest cent, confirmed on the live site). Tests marked _assumed requirement_ assert behaviour SauceDemo does not define; a failure there is reported as a bug or an observation after review.

| ID           | Group       | Test case                                                                                                                    | Expected result                                                                                              | Tags                  | Status                               |
| ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------- | ------------------------------------ |
| Checkout-001 | Information | Required fields (data-driven: each field empty, all empty) and the error can be closed                                       | Matching "… is required" error; stays on the page; X closes the error                                        | `@fieldLevel`         | ✅                                   |
| Checkout-002 | Information | Fields with only spaces are not accepted                                                                                     | "First Name is required"; stays on the page (_assumed requirement_)                                          | `@fieldLevel`         | ✅ known bug BUG-014                 |
| Checkout-003 | Information | Cancel returns to the cart unchanged                                                                                         | Cart lists the product; badge 1                                                                              | `@integration`        | ✅                                   |
| Checkout-004 | Overview    | Lists the ordered products                                                                                                   | Names, descriptions, prices, quantity 1                                                                      | `@integration`        | ✅                                   |
| Checkout-005 | Overview    | Item total, tax and total are correct (one test per order scenario: single item, typical order, rounding case, all products) | Item total = sum; tax 8% rounded; total = sum + tax; `$x.xx`                                                 | `@functional`         | ✅ known bug BUG-011 (rounding case) |
| Checkout-006 | Overview    | Payment and shipping information shown                                                                                       | "SauceCard #31337", "Free Pony Express Delivery!", "Price Total"                                             | `@functional`         | ✅                                   |
| Checkout-007 | Overview    | Kept after a page reload                                                                                                     | Same products and total                                                                                      | `@functional`         | ✅                                   |
| Checkout-008 | Overview    | Cancel returns to inventory with the cart unchanged                                                                          | Badge and "Remove" buttons unchanged                                                                         | `@integration`        | ✅                                   |
| Checkout-009 | Overview    | No order can be placed with an empty cart                                                                                    | Finish disabled, or no order confirmation; empty item total shown as `$0.00` (_assumed requirement_)         | `@negative`           | ✅ known bug BUG-012                 |
| Checkout-010 | Overview    | Cannot be opened directly without the information step                                                                       | Redirected away from the overview URL (_assumed requirement_)                                                | `@negative @security` | ✅ known bug BUG-013                 |
| Checkout-011 | Complete    | Page confirms the order                                                                                                      | Title, image, "Thank you for your order!", dispatch text, Back Home and Generate PDF order shown, badge gone | `@functional @ui`     | ✅                                   |
| Checkout-012 | Complete    | Back Home returns to inventory with an empty cart                                                                            | No badge; ordered products show "Add to cart"                                                                | `@integration`        | ✅                                   |
| Checkout-013 | Complete    | Cannot be opened directly without an order                                                                                   | No order confirmation shown (_assumed requirement_)                                                          | `@negative @security` | ✅ known bug BUG-013                 |
| Checkout-014 | Navigation  | Cart icon on the information and overview pages leads to the unchanged cart                                                  | Cart lists the product after each                                                                            | `@integration`        | ✅                                   |
| Checkout-015 | End to end  | An order with several products can be completed                                                                              | Every step in the report; order confirmed; cart empty                                                        | `@smoke @e2e`         | ✅                                   |
| Checkout-016 | End to end  | Going back after an order does not place a second order                                                                      | No second order confirmation (_assumed requirement_)                                                         | `@negative`           | ✅ known bug BUG-012                 |

### Receipt (`receipt.spec.ts`)

| ID          | Test case                                                   | Expected result                                                                                                  | Tags           | Status |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| Receipt-001 | The PDF receipt downloads                                   | File `swag-labs-order-<today>_<time>.pdf`; a valid PDF                                                           | `@integration` | ✅     |
| Receipt-002 | The receipt matches the order (one test per order scenario) | Header, today's date, ship-to name and postal code, products with prices, item total, tax, total, thank-you text | `@integration` | ✅     |

### Menu (`menu.spec.ts`)

The menu is one shared component (`pages/components/MenuComponent.ts`, available as `.menu` on every page object), so it is checked for presence on every page, and its actions once.

| ID       | Test case                                                        | Pages                                                                      | Expected result                                                                                                                      | Tags                         | Status               |
| -------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | -------------------- |
| Menu-001 | The menu opens, lists all items and closes (one test per page)   | inventory, product details, cart, checkout information, overview, complete | All Items, Dynamic Catalog, About, Logout, Reset App State in order; About links to `https://saucelabs.com/`; X closes it            | `@functional`                | ✅                   |
| Menu-002 | Logout returns to the login page and Back does not re-enter      | inventory                                                                  | Login page; after Back: login form with the "not logged in" error, no products                                                       | `@smoke @negative @security` | ✅                   |
| Menu-003 | Reset App State empties the cart                                 | inventory                                                                  | Badge disappears; cart page has no items                                                                                             | `@integration`               | ✅                   |
| Menu-004 | Reset App State resets the product buttons                       | inventory                                                                  | Buttons back to "Add to cart" without a reload                                                                                       | `@functional`                | ✅ known bug BUG-004 |
| Menu-005 | All Items returns to the inventory page (one test per page)      | product details, cart, checkout information, overview, complete            | Inventory page with title "Products"                                                                                                 | `@integration`               | ✅                   |
| Menu-006 | Dynamic Catalog opens its sub-menu and each entry opens its page | inventory                                                                  | Sub-menu lists Lazy Load, Spinner, Slider; each opens its URL with its title and shows products (Spinner: after the spinner is gone) | `@integration`               | ✅                   |

The Dynamic Catalog pages themselves are only smoke-checked here; see [Out of scope and next steps](#out-of-scope-and-next-steps).

## Bugs

The [GitHub issues](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues) are the single source of truth: steps, evidence, severity and status live there. This list is only an overview.

| Bug                                                                                   | Summary                                                                                      | Caught by                                                                                                       |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [BUG-001](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/1)  | `problem_user`: every product shows the same wrong image                                     | Inventory-001 (`problem-user`)                                                                                  |
| [BUG-002](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/2)  | `problem_user`: choosing any sort option has no effect                                       | Inventory-005 to 008 (`problem-user`)                                                                           |
| [BUG-003](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/3)  | `error_user`: some products can't be added to or removed from the cart                       | Cart-002, 003, 005, 008; Checkout-004, 005, 007, 008, 015 (`error-user`)                                        |
| [BUG-004](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/4)  | Reset App State leaves product buttons on "Remove"                                           | Menu-004 (all users; marked as known in the gate)                                                               |
| [BUG-005](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/5)  | Sort dropdown: clicking the arrow icon doesn't open the options                              | Inventory-012 (candidate)                                                                                       |
| [BUG-006](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/6)  | `problem_user`: clicking a product opens a different product's details page                  | Inventory-009, 010, Cart-004, 005, 008, 012 (`problem-user`)                                                    |
| [BUG-007](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/7)  | `error_user`: sorting shows "Sorting is broken!" alert, order unchanged                      | Inventory-005 to 008 (`error-user`)                                                                             |
| [BUG-008](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/8)  | `error_user`: product details page shows no description                                      | Inventory-009, 010 (`error-user`)                                                                               |
| [BUG-009](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/9)  | `visual_user`: inventory list shows random wrong prices                                      | Inventory-001, 006, 007 (`visual-user`)                                                                         |
| [BUG-010](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/10) | `problem_user`: some products can't be added to or removed from the cart                     | Cart-002, 003 (`problem-user`)                                                                                  |
| [BUG-011](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/11) | Checkout overview: item total not formatted as currency (`$103.96000000000001`, `$0`)        | Checkout-005 (rounding case), 009 (all users)                                                                   |
| [BUG-012](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/12) | An order can be placed with an empty cart (also after Back + Finish)                         | Checkout-009, 016 (all users)                                                                                   |
| [BUG-013](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/13) | Checkout steps can be skipped by opening their URL directly                                  | Checkout-010, 013 (all users)                                                                                   |
| [BUG-014](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/14) | Checkout information: fields with only spaces are accepted                                   | Checkout-002 (all users)                                                                                        |
| [BUG-015](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/15) | `problem_user`: last name is typed into the First Name field, so checkout can't be completed | All checkout tests past the information page, Receipt-001, 002, Menu-001/005 on checkout pages (`problem-user`) |
| [BUG-016](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/16) | `error_user`: Last Name is not required on the checkout information page                     | Checkout-001 (`error-user`)                                                                                     |
| [BUG-017](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/17) | `error_user`: clicking Finish does not complete the order                                    | Checkout-011, 012, 016, Receipt-001, 002, Menu-001/005 on the complete page (`error-user`)                      |
| [BUG-018](https://github.com/snehadevib/saucedemo-playwright-ts-regression/issues/18) | `problem_user`: the About link in the menu leads to an error page (`/error/404`)             | Menu-001 (`problem-user`)                                                                                       |

## Performance checks

There are no separate performance test cases. **Every page load in every test is timed** by the page objects: `goto()` and `waitUntilLoaded()` in `BasePage` wait for the page's `readyIndicator` (e.g. the first product on the inventory page) and judge the time against two thresholds from `test-data/performance.ts`:

| Load time | Result                                                    |
| --------- | --------------------------------------------------------- |
| ≤ 3 s     | Pass                                                      |
| 3–10 s    | Pass with a **warning** annotation in the report          |
| > 10 s    | The test fails: "_&lt;page&gt;_ did not load within 10 s" |

Every page load also adds a `load time` annotation, so the report shows the timings of every test. After an action that opens a page (e.g. clicking a product), the test calls `waitUntilLoaded()` on that page so the load is timed too.

The per-test time limit is 60 s (`playwright.config.ts`): a test that opens many pages needs room for slow users, while each single page is judged by the thresholds above. Tests run headless by default, because visible browser windows make timings slower and less stable.

UI tests give an early signal about speed, not a reliable measurement: timings vary with the machine, network and parallel runs. The thresholds are assumed requirements (based on Google's Core Web Vitals and usability research), because SauceDemo has no defined NFRs. Real performance testing uses dedicated tools: Lighthouse CI for page speed, k6 or JMeter for load, and production monitoring.

A warning is logged as an observation, not a bug. Only a failure above the hard limit becomes a bug.

## Observations

Findings without a defined expected behaviour (UX) or within the hard performance limit (warnings). Reported for discussion with the product owner, not raised as bugs.

| #     | Observation                                                                                                                                                                                                                                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OBS-1 | The sort control uses a filter (funnel) icon but only offers sorting. Users may expect filter options. Suggest a sort icon, or add filtering if it's planned.                                                                                                                                                                                            |
| OBS-2 | A product can be added to the cart only once (no quantity). Users who want two of the same item can't do so.                                                                                                                                                                                                                                             |
| OBS-3 | Performance: for `performance_glitch_user` the inventory page loads in about 5–7 s on every visit (budget 3 s; `standard_user` about 1 s). Login and product details pages are unaffected. Shown as `warning` annotations in the `performance-glitch-user` project. Above Google's "poor" threshold (4 s): candidate for a low-severity performance bug. |

## Out of scope and next steps

Deliberately not automated yet, so the core purchase flow could be covered in depth first.

| Area                       | What would be tested                                                                                                                     | Notes from exploration                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic Catalog: Lazy Load | More products load when scrolling, until the end; every product and size appears exactly once; complete size sets at the catalogue price | **To investigate:** "Test.allTheThings() T-Shirt (Red) (L)" appeared twice; "Sauce Labs Bolt T-Shirt (S)" was not seen in the first rows |
| Dynamic Catalog: Spinner   | The spinner shows while loading, then all products appear with correct names and prices                                                  | Products are listed by product ID, not A→Z like the inventory page                                                                       |
| Dynamic Catalog: Slider    | One product at a time, one dot per product; clicking a dot shows that product; automatic advance and wrap-around                         | Navigation is by the dots (no arrows); also listed by product ID                                                                         |
| Inventory-012              | Sort dropdown arrow icon (BUG-005)                                                                                                       | Decide after checking in DevTools whether the icon blocks clicks                                                                         |
| Visual and accessibility   | Screenshot baselines (`toHaveScreenshot`), especially for `visual_user`; axe accessibility scan                                          |                                                                                                                                          |
