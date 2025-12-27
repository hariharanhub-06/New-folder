"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    saveProduct,
    getProduct,
    deleteProduct as deleteProductDb,
    toggleProductStatus as toggleStatusDb,
    toggleProductOffer as toggleOfferDb,
    toggleProductTrending as toggleTrendingDb,
    updateOrderStatus as updateOrderStatusDb,
    createDiscount,
    deleteDiscount,
    deleteOrder as deleteOrderDb,
    upsertCategory,
    updateOrder as updateOrderDb
} from "./db";
import pool from "./db";
import { razorpay } from "./razorpay";

// ... existing code ...

import { Product } from "./types";

// Helper to parse FormData to Product
function parseProductFormData(formData: FormData): Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const category = formData.get("category") as string;
    const stock = parseInt(formData.get("stock") as string);
    const size = formData.get("size") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const imagesStr = formData.get("images") as string;
    const images = imagesStr ? JSON.parse(imagesStr) : [];

    // Parse sizes
    const sizesStr = formData.get("sizes") as string;
    const sizes = sizesStr ? JSON.parse(sizesStr) : undefined;

    // Parse weight (in grams)
    const weightStr = formData.get("weight") as string;
    const weight = weightStr ? parseInt(weightStr) : 750;

    const isOffer = formData.get("isOffer") === 'true';
    const isTrending = formData.get("isTrending") === 'true';
    const isNewArrival = formData.get("isNewArrival") === 'true';

    // Parse visibility tags
    const visibilityTagsStr = formData.get("visibilityTags") as string;
    const visibilityTags = visibilityTagsStr ? JSON.parse(visibilityTagsStr) : [];

    return {
        name,
        description,
        price,
        category,
        stock,
        size,
        imageUrl,
        images,
        sizes,
        weight,
        isOffer,
        isTrending,
        isNewArrival,
        visibilityTags
    };
}

export async function addProduct(formData: FormData) {
    try {
        const productData = parseProductFormData(formData);

        // Auto-create category if it doesn't exist
        if (productData.category) {
            await upsertCategory({
                name: productData.category,
                is_active: true
            });
        }

        await saveProduct({
            id: crypto.randomUUID(),
            ...productData,
            isActive: true,
        } as Product);

        revalidatePath("/admin/products");
        revalidatePath("/shop");
        revalidatePath("/");
        redirect("/admin/products");
    } catch (error) {
        console.error('❌ Add Product Error:', error);
        console.error('Error details:', {
            message: (error as Error).message,
            stack: (error as Error).stack
        });
        // Re-throw to allow client-side handling
        throw new Error(`Failed to add product: ${(error as Error).message}`);
    }
}

export async function editProduct(id: string, formData: FormData) {
    const productData = parseProductFormData(formData);

    // Auto-create category if it doesn't exist
    if (productData.category) {
        await upsertCategory({
            name: productData.category,
            is_active: true
        });
    }

    // We need to keep the existing isActive status and createdAt
    const existingProduct = await getProduct(id);

    await saveProduct({
        id, // Ensure ID is passed
        ...productData,
        isActive: existingProduct?.isActive ?? true,
        createdAt: existingProduct?.createdAt,
    } as Product);

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath(`/product/${id}`);
    redirect("/admin/products");
}

export async function removeProduct(id: string) {
    await deleteProductDb(id);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
}

export async function toggleProductStatus(id: string) {
    await toggleStatusDb(id);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
}

export async function updateOrderStatus(orderId: string, status: string, logisticsId?: string, courierName?: string) {
    await updateOrderStatusDb(orderId, status as any, logisticsId, courierName);
    revalidatePath("/admin/orders");
    revalidatePath("/admin"); // Update dashboard stats
    revalidatePath(`/order/${orderId}`);
    return { success: true };
}

export async function removeOrder(id: string) {
    await deleteOrderDb(id);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
}

export async function updateOrderDetails(orderId: string, details: any) {
    await updateOrderDb(orderId, details);
    revalidatePath("/admin/orders");
    revalidatePath(`/order/${orderId}`);
    return { success: true };
}

export async function syncRazorpayPayments() {
    try {
        const payments = await (razorpay.payments.all as any)({
            count: 50, // Get last 50 payments
        });

        const capturedPayments = payments.items.filter((p: any) => p.status === 'captured');
        let syncedCount = 0;

        for (const payment of capturedPayments) {
            // Check if payment already exists in DB
            const existingRes = await pool.query('SELECT id FROM orders WHERE razorpay_payment_id = $1 OR transaction_id = $1', [payment.id]);

            if (existingRes.rows.length === 0) {
                // Create recovery order
                const orderId = `REC-${crypto.randomUUID().slice(0, 8)}`;
                const customerName = payment.notes?.customer_name || payment.email?.split('@')[0] || 'Unknown Customer';
                const customerEmail = payment.email || '';
                const customerMobile = payment.contact || '';

                // Construct shipping address from notes if available
                const shippingAddress = {
                    street: payment.notes?.street || 'N/A',
                    city: payment.notes?.city || 'N/A',
                    state: payment.notes?.state || 'N/A',
                    country: payment.notes?.country || 'India',
                    zipCode: payment.notes?.zipCode || '000000'
                };

                await pool.query(`
                    INSERT INTO orders (
                        id, customer_name, customer_email, customer_mobile, shipping_address,
                        total_amount, shipping_cost, status, razorpay_payment_id, razorpay_order_id,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
                `, [
                    orderId,
                    customerName,
                    customerEmail,
                    customerMobile,
                    JSON.stringify(shippingAddress),
                    (payment.amount as number) / 100, // paisa to rupees
                    payment.notes?.shipping_cost || 0,
                    'Payment Confirmed',
                    payment.id,
                    payment.order_id,
                    new Date(payment.created_at * 1000).toISOString()
                ]);

                // Add a placeholder item
                await pool.query(`
                    INSERT INTO order_items (id, order_id, name, quantity, price, size, image_url)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    crypto.randomUUID(),
                    orderId,
                    payment.notes?.product_name || 'Recovered Razorpay Order',
                    1,
                    (payment.amount as number) / 100,
                    payment.notes?.size || 'N/A',
                    payment.notes?.image_url || null
                ]);

                syncedCount++;
            }
        }

        revalidatePath("/admin/orders");
        revalidatePath("/admin");
        return { success: true, count: syncedCount };
    } catch (error) {
        console.error('❌ Sync Error:', error);
        throw error;
    }
}

export async function addDiscount(formData: FormData) {
    const productId = formData.get("productId") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    const price = parseFloat(formData.get("price") as string);

    if (!productId || !quantity || !price) return;

    await createDiscount({ productId, quantity, price } as any);
    revalidatePath("/admin/discounts");
}

export async function removeDiscount(id: string) {
    await deleteDiscount(id);
    revalidatePath("/admin/discounts");
}

export async function deleteCategory(categoryToDelete: string) {
    if (!categoryToDelete) return;

    try {
        // Reassign all products with this category to 'Uncategorized'
        // Using pool directly for efficiency
        await pool.query(
            "UPDATE products SET category = 'Uncategorized' WHERE category = $1",
            [categoryToDelete]
        );

        revalidatePath("/admin/products");
        revalidatePath("/shop");
        revalidatePath("/admin/products/new"); // Updates the category dropdown
        return { success: true };
    } catch (error) {
        console.error("Failed to delete category:", error);
        throw new Error("Failed to delete category");
    }
}

export async function toggleProductOffer(id: string) {
    await toggleOfferDb(id);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
}

export async function toggleProductTrending(id: string) {
    await toggleTrendingDb(id);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
}
