import { readFile } from 'node:fs/promises';
import { test, expect } from '../fixtures/pages';
import { isPdf, readPdfText, withoutSpaces } from '../helpers/pdf';
import { ORDER_SCENARIOS, RECEIPT, expectedTotals } from '../test-data/checkout';

const typicalOrder = ORDER_SCENARIOS.find((s) => s.name === 'typical order')!;

// Today's date in the two formats the receipt uses (the browser runs on this machine, in its time zone)
const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const todayInFileName = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const todayInReceipt = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

test.describe('Receipt', () => {
    // Already logged in; every test starts on the inventory page with an empty cart
    test.beforeEach(async ({ inventoryPage }) => {
        await inventoryPage.goto();
    });

    test(
        'Receipt-001: the order receipt downloads as a PDF',
        { tag: ['@regression'] },
        async ({ checkout, checkoutCompletePage: complete }) => {
            await checkout.placeOrder(typicalOrder.products, typicalOrder.customer);

            const download = await test.step('generate PDF order', async () => complete.downloadReceipt());

            await test.step('file name contains today’s date', () => {
                const fileName = download.suggestedFilename();
                expect(fileName, 'file name format').toMatch(RECEIPT.fileName);
                expect(RECEIPT.fileName.exec(fileName)?.[1], 'order date in the file name').toBe(
                    todayInFileName,
                );
            });

            await test.step('file is a valid PDF', async () => {
                const file = await readFile(await download.path());
                expect(file.length, 'file is not empty').toBeGreaterThan(0);
                expect(isPdf(file), 'file starts with %PDF').toBe(true);
            });
        },
    );

    // Data-driven: one test per order scenario (different products and customer names)
    for (const scenario of ORDER_SCENARIOS) {
        test(
            `Receipt-002: the receipt matches the order (${scenario.name})`,
            { tag: ['@regression'] },
            async ({ checkout, checkoutCompletePage: complete }, testInfo) => {
                const { products, customer } = scenario;
                const expected = expectedTotals(products);
                await checkout.placeOrder(products, customer);

                const text = await test.step('generate PDF order and read its text', async () => {
                    const download = await complete.downloadReceipt();
                    const file = await readFile(await download.path());
                    // Keep the receipt in the report as evidence
                    await testInfo.attach('receipt.pdf', { body: file, contentType: 'application/pdf' });
                    return readPdfText(file);
                });

                // Soft: every missing or wrong part of the receipt is reported, not just the first
                await test.step('header, section headings and order date', () => {
                    expect.soft(text, 'title').toContain(RECEIPT.title);
                    expect.soft(text, 'subtitle').toContain(RECEIPT.subtitle);
                    // Headings are letter-spaced in the PDF ("S H I P TO"), so compare without spaces
                    for (const heading of RECEIPT.sectionHeadings) {
                        expect
                            .soft(withoutSpaces(text), `heading "${heading}"`)
                            .toContain(withoutSpaces(heading));
                    }
                    expect.soft(text, 'order date label').toContain(RECEIPT.orderDateLabel);
                    expect.soft(text, 'order date is today').toContain(todayInReceipt);
                });

                await test.step('ship to: customer name and postal code', () => {
                    expect
                        .soft(text, 'customer name')
                        .toContain(`${customer.firstName} ${customer.lastName}`);
                    expect.soft(text, 'postal code').toContain(customer.postalCode);
                });

                await test.step('ordered products with prices', () => {
                    for (const product of products) {
                        expect.soft(text, `product: ${product.name}`).toContain(product.name);
                        expect
                            .soft(text, `price of ${product.name}`)
                            .toContain(`$${product.price.toFixed(2)}`);
                    }
                });

                await test.step('item total, tax and total', () => {
                    expect
                        .soft(text, 'item total')
                        .toContain(`${RECEIPT.itemTotalLabel} ${expected.itemTotal}`);
                    expect.soft(text, 'tax (8%)').toContain(`${RECEIPT.taxLabel} ${expected.tax}`);
                    expect.soft(text, 'total').toContain(`${RECEIPT.totalLabel} ${expected.total}`);
                });

                await test.step('thank-you text', () => {
                    expect.soft(text, 'thank-you text').toContain(RECEIPT.thankYou);
                });
            },
        );
    }
});
