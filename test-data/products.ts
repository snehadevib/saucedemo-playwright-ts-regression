/** One product of the saucedemo catalogue. */
export type Product = {
    name: string;
    description: string;
    price: number;
    image: string;
};

/**
 * Expected saucedemo catalogue, in the default sort order (Name A to Z).
 * Extracted from the live site; treated like seeded test data.
 */
export const PRODUCTS: readonly Product[] = [
    {
        name: 'Sauce Labs Backpack',
        description:
            'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
        price: 29.99,
        image: 'sauce-backpack',
    },
    {
        name: 'Sauce Labs Bike Light',
        description:
            "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.",
        price: 9.99,
        image: 'bike-light',
    },
    {
        name: 'Sauce Labs Bolt T-Shirt',
        description:
            'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.',
        price: 15.99,
        image: 'bolt-shirt',
    },
    {
        name: 'Sauce Labs Fleece Jacket',
        description:
            "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.",
        price: 49.99,
        image: 'sauce-pullover',
    },
    {
        name: 'Sauce Labs Onesie',
        description:
            "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.",
        price: 7.99,
        image: 'red-onesie',
    },
    {
        name: 'Test.allTheThings() T-Shirt (Red)',
        description:
            'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
        price: 15.99,
        image: 'red-tatt',
    },
];
