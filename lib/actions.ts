"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    saveProduct,
    deleteProduct,
    toggleProductStatus as toggleStatusDb,
    updateOrderStatus as updateOrderStatusDb,
    getProduct,
    createDiscount,
    deleteDiscount
} from "./db";

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

    return {
        name,
        description,
        price,
        category,
        stock,
        size,
        imageUrl,
        images,
        sizes
    };
}

export async function addProduct(formData: FormData) {
    try {
        const productData = parseProductFormData(formData);

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
    revalidatePath(`/product/${id}`);
    redirect("/admin/products");
}

export async function removeProduct(id: string) {
    await deleteProduct(id);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
}

export async function toggleProductStatus(id: string) {
    await toggleStatusDb(id);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
}

export async function updateOrderStatus(orderId: string, status: string, logisticsId?: string, courierName?: string) {
    await updateOrderStatusDb(orderId, status as any, logisticsId, courierName);
    revalidatePath("/admin/orders");
    revalidatePath("/admin"); // Update dashboard stats
    revalidatePath(`/order/${orderId}`);
    return { success: true };
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
