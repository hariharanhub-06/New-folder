// Centralized product categories used across the application
export const PRODUCT_CATEGORIES = [
    'Shirt',
    'Pants',
    't-Shirt',
    'Trousers',
    'Accessories',
    'Shoes',
    'Caps'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
