import { type InventoryPage } from '../pages/InventoryPage';
import { type CartPage } from '../pages/CartPage';
import { type CheckoutInformationPage } from '../pages/CheckoutInformationPage';
import { type CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { type CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { type Product } from '../test-data/products';
import { type Customer } from '../test-data/checkout';

/**
 * The steps every checkout test needs to reach a given page, built from the page objects.
 * Each step uses the app's own buttons, so every page load is timed (see BasePage.openBy).
 * Starts on the inventory page.
 */
export class CheckoutFlow {
    constructor(
        private readonly inventoryPage: InventoryPage,
        private readonly cartPage: CartPage,
        private readonly informationPage: CheckoutInformationPage,
        private readonly overviewPage: CheckoutOverviewPage,
        private readonly completePage: CheckoutCompletePage,
    ) {}

    // Inventory → add the products → cart → Checkout: ends on the information page
    async start(products: readonly Product[]) {
        for (const product of products) {
            await this.inventoryPage.addToCart(product.name);
        }
        await this.cartPage.openBy(this.inventoryPage.cartLink);
        await this.informationPage.openBy(this.cartPage.checkoutButton);
    }

    // ...then fill in the customer and Continue: ends on the overview page
    async reachOverview(products: readonly Product[], customer: Customer) {
        await this.start(products);
        await this.informationPage.enterCustomer(customer);
        await this.overviewPage.openBy(this.informationPage.continueButton);
    }

    // ...then Finish: ends on the complete page
    async placeOrder(products: readonly Product[], customer: Customer) {
        await this.reachOverview(products, customer);
        await this.completePage.openBy(this.overviewPage.finishButton);
    }
}
