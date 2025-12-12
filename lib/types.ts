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
    category: string;
    quantity: number;
    price: number;
    active: boolean;
}

export interface ProductDiscount {
    id: string;
    productId: string;
    discountPercentage: number;
    active: boolean;
    createdAt?: string;
}
