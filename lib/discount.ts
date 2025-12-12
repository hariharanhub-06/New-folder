// Discount calculator for checkout

import { Discount } from './types';

export interface DiscountResult {
    appliedDiscounts: Array<{
        category: string;
        bundles: number;
        quantity: number;
        bundlePrice: number;
    }>;
    totalDiscount: number;
    discountedTotal: number;
}

export function calculateDiscount(
    items: Array<{ category: string; price: number; quantity: number }>,
    discounts: Discount[]
): DiscountResult {
    const appliedDiscounts: DiscountResult['appliedDiscounts'] = [];
    let totalDiscount = 0;
    let discountedTotal = 0;

    // Group items by category
    const categoryGroups = items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    // Check each category for applicable discounts
    for (const [category, categoryItems] of Object.entries(categoryGroups)) {
        const totalQuantity = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
        const originalTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Find applicable discount for this category (case-insensitive)
        const applicableDiscount = discounts.find(
            d => d.active && d.category.toUpperCase() === category.toUpperCase() && totalQuantity >= d.quantity
        );

        if (applicableDiscount) {
            // Calculate how many bundles can be formed
            const bundles = Math.floor(totalQuantity / applicableDiscount.quantity);
            const bundleTotal = bundles * applicableDiscount.price;
            const remainingItems = totalQuantity % applicableDiscount.quantity;
            const remainingTotal = remainingItems * (originalTotal / totalQuantity);

            const categoryDiscountedTotal = bundleTotal + remainingTotal;
            const categorySavings = originalTotal - categoryDiscountedTotal;

            appliedDiscounts.push({
                category,
                bundles,
                quantity: applicableDiscount.quantity,
                bundlePrice: applicableDiscount.price,
            });

            totalDiscount += categorySavings;
            discountedTotal += categoryDiscountedTotal;
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
