// Centralized product categories used across the application
export const PRODUCT_CATEGORIES = [
    'Hoodie',
    'T-Shirt',
    'Pant',
    'Shirt',
    'Accessory'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
