export interface ProductSize {
    size: string;
    stock: number;
    id?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    imageUrl: string;
    images?: string[];
    isActive: boolean;
    size?: string;
    sizes?: ProductSize[];
    discountPercentage?: number;  // Individual product discount
    createdAt?: string;
    updatedAt?: string;
}

export interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    customerName: string;
    customerEmail: string;
    customerMobile: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    items: OrderItem[];
    totalAmount: number;
    shippingCost: number;
    status: 'New Order' | 'Payment Confirmed' | 'Parcel Prepared' | 'Couried' | 'Delivered' | 'Cancelled';
    transactionId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    cashfreeOrderId?: string;
    cashfreePaymentId?: string;
    logisticsId?: string;
    courierName?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Discount {
    id: string;
    discountType: 'bundle' | 'percentage';  // Type of discount
    targetType: 'category' | 'product';     // What it applies to
    category?: string;      // For category-based discounts
    productId?: string;     // For product-based discounts
    quantity?: number;      // For bundle discounts
    price?: number;         // For bundle discounts (bundle price)
    percentage?: number;    // For percentage discounts
    active: boolean;
}

export interface ProductDiscount {
    id: string;
    productId: string;
    discountPercentage: number;
    active: boolean;
    createdAt?: string;
}
