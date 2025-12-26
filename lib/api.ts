// Client-Side API Library
// Replaces server actions with fetch calls to Cloudflare Workers

import { Order, Product, ProductFilters, PaginatedResponse } from './types';

const API_ENDPOINTS = {
    products: '/api/products',
    orders: '/api/orders',
    payment: '/api/payment/create-order', // Updated to likely match local, though might need verification
    upload: '/api/upload-image',
};

// Products API
export async function getProduct(id: string): Promise<Product | null> {
    try {
        const response = await fetch(`${API_ENDPOINTS.products}?id=${id}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export async function getProducts(includeInactive: boolean = false): Promise<Product[]> {
    const url = includeInactive ? `${API_ENDPOINTS.products}?admin=true` : API_ENDPOINTS.products;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    const result = await response.json();
    return result.data || result; // Handle both paginated and legacy array response just in case
}

export async function getProductsPaginated(filters: ProductFilters): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.search) params.append('search', filters.search);
    if (filters.includeInactive) params.append('admin', 'true');

    const response = await fetch(`${API_ENDPOINTS.products}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<{ success: boolean; id?: string }> {
    const response = await fetch(API_ENDPOINTS.products, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to add product');
    // Some endpoints might return { id } or just 200 OK
    try {
        return await response.json();
    } catch {
        return { success: true };
    }
}

export async function updateProduct(product: Product): Promise<{ success: boolean }> {
    const response = await fetch(API_ENDPOINTS.products, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to update product');
    return { success: true };
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_ENDPOINTS.products}?id=${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return { success: true };
}

// Orders API
export async function getOrders(): Promise<Order[]> {
    const response = await fetch(API_ENDPOINTS.orders);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
}

export async function placeOrder(order: Omit<Order, 'id'>): Promise<{ success: boolean; orderId: string }> {
    const response = await fetch(API_ENDPOINTS.orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to place order');
    return response.json();
}

export async function updateOrderStatus(
    orderId: string,
    status: string,
    transactionId?: string
): Promise<{ success: boolean }> {
    const response = await fetch(API_ENDPOINTS.orders, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, transactionId }),
    });
    if (!response.ok) throw new Error('Failed to update order status');
    return { success: true };
}

// Image Upload
export async function uploadImage(file: File): Promise<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(API_ENDPOINTS.upload, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload image');
    return response.json();
}

// Test Payment (Demo Mode)
export async function processTestPayment(
    orderId: string,
    amount: number
): Promise<{ success: boolean; transactionId: string; message: string }> {
    const response = await fetch(API_ENDPOINTS.payment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount }),
    });
    if (!response.ok) throw new Error('Payment failed');
    return response.json();
}

export async function getCategories(): Promise<string[]> {
    const response = await fetch('/api/categories', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
}
