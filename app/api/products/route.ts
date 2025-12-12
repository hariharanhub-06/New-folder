
import { NextResponse } from 'next/server';
import { getProduct, saveProduct, deleteProduct } from '@/lib/db';
import pool from '@/lib/db'; // Keep pool for the list query or move list query to db.ts

// GET: Fetch all active products
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            const product = await getProduct(id);
            if (!product) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            return NextResponse.json(product);
        }

        // For the list, strictly speaking we should also fetch sizes if we want to show them in lists.
        // But for now, let's just stick to the products table for the main list if performance is concerned,
        // OR fetch all sizes?
        // Let's modify the query to just return products as before, but if we want sizes in `AdminProductList` we need them.
        // My `AdminProductList` update assumes `product.sizes` exists.
        // So I should JOIN or fetch sizes.
        // Or I can add `getProducts()` to `lib/db.ts`.

        // Let's add inline query with sizes for now, or just basic query and lazy load?
        // AdminList expects sizes.
        // Let's do a left join or separate query.

        const res = await pool.query(`
            SELECT * FROM products 
            WHERE is_active = true
            ORDER BY created_at DESC
        `);
        const rows = res.rows;

        // Populate sizes for each product (N+1 prob, but okay for small list)
        // Or better: fetch all sizes and map.
        const sizeRes = await pool.query('SELECT * FROM product_sizes');
        const sizesMap = new Map();
        sizeRes.rows.forEach(r => {
            if (!sizesMap.has(r.product_id)) sizesMap.set(r.product_id, []);
            sizesMap.get(r.product_id).push({ size: r.size, stock: r.stock, id: r.id });
        });

        const products = rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            category: row.category,
            stock: row.stock,
            imageUrl: row.image_url,
            images: row.images ? JSON.parse(row.images) : [],
            isActive: row.is_active,
            size: row.size,
            sizes: sizesMap.get(row.id) || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));

        return NextResponse.json(products);
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new product
export async function POST(request: Request) {
    try {
        const productData = await request.json();
        // saveProduct handles insert if ID missing (generates it) or provided.
        // But saveProduct takes a Product object.
        await saveProduct(productData);
        // We might want to return the ID. usage in lib/api.ts expects { success: true, id }.
        // saveProduct generates ID but doesn't return it? 
        // I should update saveProduct to return ID or handle it here.
        // Actually saveProduct in lib/db.ts:
        // const id = product.id || crypto.randomUUID();
        // It uses product.id if present.
        // If I pass productData without ID, it generates one inside but I don't get it back easily.
        // I should generate ID here if missing.

        const id = productData.id || crypto.randomUUID();
        productData.id = id;
        productData.isActive = true; // Default

        await saveProduct(productData);

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update a product
export async function PUT(request: Request) {
    try {
        const productData = await request.json();
        await saveProduct(productData);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a product
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    try {
        await deleteProduct(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


