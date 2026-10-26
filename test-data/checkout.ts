import { PRODUCTS, type Product } from './products';

/**
 * Sales tax at checkout: 8%, rounded to the nearest cent.
 * Confirmed on the live site: $53.97 → $4.32, $103.96 → $8.32, $119.95 → $9.60.
 */
export const TAX_RATE = 0.08;

/** Fixed texts on the checkout overview page. */
export const ORDER_INFO = {
    payment: 'SauceCard #31337',
    shipping: 'Free Pony Express Delivery!',
} as const;

/** Fixed texts on the checkout complete page. */
export const ORDER_COMPLETE = {
    title: 'Checkout: Complete!',
    header: 'Thank you for your order!',
    text: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
} as const;

/** Fixed texts in the PDF order receipt (Generate PDF order). */
export const RECEIPT = {
    title: 'Swag Labs',
    subtitle: 'Order Receipt',
    orderDateLabel: 'Order Date',
    // Section headings, printed with letter spacing (compare with withoutSpaces)
    sectionHeadings: ['ORDER DETAILS', 'SHIP TO', 'ITEMS'],
    itemTotalLabel: 'Item total',
    taxLabel: 'Tax',
    totalLabel: 'Total',
    thankYou:
        'Thank you for your order! It has been dispatched, and will arrive just as fast as the pony can get there.',
    // swag-labs-order-2026-10-26_17-03-47.pdf: order date and time
    fileName: /^swag-labs-order-(\d{4}-\d{2}-\d{2})_\d{2}-\d{2}-\d{2}\.pdf$/,
} as const;

/** Errors on the checkout information page. */
export const CHECKOUT_ERRORS = {
    firstNameRequired: 'Error: First Name is required',
    lastNameRequired: 'Error: Last Name is required',
    postalCodeRequired: 'Error: Postal Code is required',
} as const;

/** Customer details typed on the checkout information page. Made-up data only, never real people. */
export type Customer = { firstName: string; lastName: string; postalCode: string };

export const CUSTOMERS = {
    standard: { firstName: 'Test', lastName: 'Customer', postalCode: '10115' },
    apostropheAndHyphen: { firstName: 'Anne-Marie', lastName: "O'Brien", postalCode: '02134' },
    accents: { firstName: 'Jürgen', lastName: 'Müller', postalCode: '80331' },
} as const satisfies Record<string, Customer>;

/** An order scenario: what is ordered and by whom. Expected amounts are always calculated, never stored. */
export type OrderScenario = { name: string; products: readonly Product[]; customer: Customer };

const byName = (...names: string[]) => names.map((name) => PRODUCTS.find((p) => p.name === name)!);

/**
 * Order scenarios used by data-driven checkout and receipt tests.
 * Each row covers a distinct risk; don't add rows that test the same thing.
 */
export const ORDER_SCENARIOS: readonly OrderScenario[] = [
    {
        // Smallest order; tax rounding 0.6392 → 0.64
        name: 'single item',
        products: byName('Sauce Labs Onesie'),
        customer: CUSTOMERS.standard,
    },
    {
        // Typical order; apostrophe and hyphen in the name
        name: 'typical order',
        products: byName('Sauce Labs Backpack', 'Sauce Labs Bolt T-Shirt', 'Sauce Labs Onesie'),
        customer: CUSTOMERS.apostropheAndHyphen,
    },
    {
        // Combination whose item total the app shows as $103.96000000000001 (BUG-011); accents in the name
        name: 'rounding case',
        products: byName(
            'Sauce Labs Backpack',
            'Sauce Labs Bolt T-Shirt',
            'Sauce Labs Onesie',
            'Sauce Labs Fleece Jacket',
        ),
        customer: CUSTOMERS.accents,
    },
    {
        // Maximum order; tax rounding 10.3952 → 10.40
        name: 'all products',
        products: PRODUCTS,
        customer: CUSTOMERS.standard,
    },
];

/** Formats an amount in cents as shown by the app, e.g. 5397 → "$53.97". */
const asMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** Expected overview amounts for a set of products, calculated in cents to avoid floating-point errors. */
export function expectedTotals(products: readonly Product[]) {
    const itemTotalCents = products.reduce((sum, p) => sum + Math.round(p.price * 100), 0);
    const taxCents = Math.round(itemTotalCents * TAX_RATE);
    return {
        itemTotal: asMoney(itemTotalCents),
        tax: asMoney(taxCents),
        total: asMoney(itemTotalCents + taxCents),
    };
}
