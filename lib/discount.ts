// Discount calculator for checkout

import { Discount } from './types';

export interface DiscountResult {
    appliedDiscounts: Array<{
        category: string; // Will show product name for product bundles
        bundles: number;
        quantity: number;
        bundlePrice: number;
    }>;
    totalDiscount: number;
    discountedTotal: number;
}

export function calculateDiscount(
    items: Array<{ id: string; name: string; category: string; price: number; quantity: number }>,
    discounts: Discount[]
): DiscountResult {
    const appliedDiscounts: DiscountResult['appliedDiscounts'] = [];
    let totalDiscount = 0;
    let discountedTotal = 0;

    // Group items by product ID
    const productGroups = items.reduce((acc, item) => {
        if (!acc[item.id]) {
            acc[item.id] = [];
        }
        acc[item.id].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    // Check each product group for applicable discounts
    for (const [productId, productItems] of Object.entries(productGroups)) {
        const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
        const originalTotal = productItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Find applicable discount for this product
        const applicableDiscount = discounts.find(
            d => d.active && d.productId === productId && totalQuantity >= d.quantity
        );

        if (applicableDiscount) {
            // Calculate how many bundles can be formed
            const bundles = Math.floor(totalQuantity / applicableDiscount.quantity);
            const bundleTotal = bundles * applicableDiscount.price;
            const remainingItems = totalQuantity % applicableDiscount.quantity;
            const remainingTotal = remainingItems * (originalTotal / totalQuantity);

            const productDiscountedTotal = bundleTotal + remainingTotal;
            const productSavings = originalTotal - productDiscountedTotal;

            appliedDiscounts.push({
                category: productItems[0].name, // Show product name
                bundles,
                quantity: applicableDiscount.quantity,
                bundlePrice: applicableDiscount.price,
            });

            totalDiscount += productSavings;
            discountedTotal += productDiscountedTotal;
        } else {
            // No discount applies, use original price
            discountedTotal += originalTotal;
        }
    }

    return {
        appliedDiscounts,
        totalDiscount,
        discountedTotal,
    };
}
