// Flexible discount calculator for checkout
// Supports: Category Bundles, Product Bundles, Category %, Product %

import { Discount } from './types';

export interface DiscountResult {
    appliedDiscounts: Array<{
        type: string;
        description: string;
        discount: number;
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

    // Calculate original total
    const originalTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Group items by category
    const categoryGroups = items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    // Group items by product ID
    const productGroups = items.reduce((acc, item) => {
        if (!acc[item.id]) {
            acc[item.id] = [];
        }
        acc[item.id].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    let currentTotal = originalTotal;

    // 1. Apply CATEGORY BUNDLE discounts
    for (const [category, categoryItems] of Object.entries(categoryGroups)) {
        const totalQuantity = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const categoryBundleDiscount = discounts.find(
            d => d.active && d.discountType === 'bundle' && d.targetType === 'category'
                && d.category?.toUpperCase() === category.toUpperCase() && totalQuantity >= (d.quantity || 0)
        );

        if (categoryBundleDiscount && categoryBundleDiscount.quantity && categoryBundleDiscount.price) {
            const bundles = Math.floor(totalQuantity / categoryBundleDiscount.quantity);
            const bundleTotal = bundles * categoryBundleDiscount.price;
            const remainingItems = totalQuantity % categoryBundleDiscount.quantity;
            const avgPrice = categoryTotal / totalQuantity;
            const remainingTotal = remainingItems * avgPrice;

            const discountedCategoryTotal = bundleTotal + remainingTotal;
            const savings = categoryTotal - discountedCategoryTotal;

            appliedDiscounts.push({
                type: 'Category Bundle',
                description: `${category}: Buy ${categoryBundleDiscount.quantity} for ₹${categoryBundleDiscount.price} (${bundles} bundle${bundles > 1 ? 's' : ''})`,
                discount: savings
            });

            totalDiscount += savings;
            currentTotal -= categoryTotal;
            currentTotal += discountedCategoryTotal;
        }
    }

    // 2. Apply PRODUCT BUNDLE discounts
    for (const [productId, productItems] of Object.entries(productGroups)) {
        const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
        const productTotal = productItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const productBundleDiscount = discounts.find(
            d => d.active && d.discountType === 'bundle' && d.targetType === 'product'
                && d.productId === productId && totalQuantity >= (d.quantity || 0)
        );

        if (productBundleDiscount && productBundleDiscount.quantity && productBundleDiscount.price) {
            const bundles = Math.floor(totalQuantity / productBundleDiscount.quantity);
            const bundleTotal = bundles * productBundleDiscount.price;
            const remainingItems = totalQuantity % productBundleDiscount.quantity;
            const remainingTotal = remainingItems * productItems[0].price;

            const discountedProductTotal = bundleTotal + remainingTotal;
            const savings = productTotal - discountedProductTotal;

            appliedDiscounts.push({
                type: 'Product Bundle',
                description: `${productItems[0].name}: Buy ${productBundleDiscount.quantity} for ₹${productBundleDiscount.price} (${bundles} bundle${bundles > 1 ? 's' : ''})`,
                discount: savings
            });

            totalDiscount += savings;
            currentTotal -= productTotal;
            currentTotal += discountedProductTotal;
        }
    }

    // 3. Apply CATEGORY PERCENTAGE discounts
    for (const [category, categoryItems] of Object.entries(categoryGroups)) {
        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const categoryPercentDiscount = discounts.find(
            d => d.active && d.discountType === 'percentage' && d.targetType === 'category'
                && d.category?.toUpperCase() === category.toUpperCase()
        );

        if (categoryPercentDiscount && categoryPercentDiscount.percentage) {
            const savings = categoryTotal * (categoryPercentDiscount.percentage / 100);

            appliedDiscounts.push({
                type: 'Category Discount',
                description: `${category}: ${categoryPercentDiscount.percentage}% OFF`,
                discount: savings
            });

            totalDiscount += savings;
            currentTotal -= savings;
        }
    }

    // 4. Apply PRODUCT PERCENTAGE discounts
    for (const [productId, productItems] of Object.entries(productGroups)) {
        const productTotal = productItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const productPercentDiscount = discounts.find(
            d => d.active && d.discountType === 'percentage' && d.targetType === 'product'
                && d.productId === productId
        );

        if (productPercentDiscount && productPercentDiscount.percentage) {
            const savings = productTotal * (productPercentDiscount.percentage / 100);

            appliedDiscounts.push({
                type: 'Product Discount',
                description: `${productItems[0].name}: ${productPercentDiscount.percentage}% OFF`,
                discount: savings
            });

            totalDiscount += savings;
            currentTotal -= savings;
        }
    }

    discountedTotal = Math.max(0, currentTotal);

    return {
        appliedDiscounts,
        totalDiscount,
        discountedTotal,
    };
}
