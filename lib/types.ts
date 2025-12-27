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
    isOffer?: boolean; // If true, product is highlighted in Best Offers
    isTrending?: boolean; // If true, shown in Trending Now homepage section
    isOfferDrop?: boolean; // If true, shown in Offer Drops carousel on shop page
    isNewArrival?: boolean; // Manual override for New Arrivals
    size?: string;
    sizes?: ProductSize[];
    weight?: number;              // Weight in grams
    discountPercentage?: number;  // Individual product discount
    activeDiscount?: Discount;    // The best applicable discount (bundle or percentage)
    visibilityTags?: string[];    // Array of header tags for visibility control
    createdAt?: string;
    updatedAt?: string;
}

export interface OrderItem {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
    size?: string;
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
    status: 'Payment Confirmed' | 'Parcel Prepared' | 'Couried' | 'Delivered' | 'Cancelled';
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

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ProductFilters {
    page?: number;
    limit?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
    search?: string;
    includeInactive?: boolean;
    isOffer?: boolean; // Filter by offer status
    isTrending?: boolean; // Filter by trending status
    isOfferDrop?: boolean; // Filter by offer drop status
    isNewArrival?: boolean; // Filter by new arrival status
    tag?: string;           // Filter by visibility tag
}
