
import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Fetch all active products
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            const res = await db.query('SELECT * FROM products WHERE id = $1', [id]);
            const row = res.rows[0];

            if (!row) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            const product = {
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
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
            return NextResponse.json(product);
        }

        const res = await db.query(`
            SELECT * FROM products 
            WHERE is_active = true
            ORDER BY created_at DESC
        `);
        const rows = res.rows;

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
        const product = await request.json();
        const id = product.id || crypto.randomUUID();

        await db.query(`
            INSERT INTO products (id, name, description, price, category, stock, image_url, images, is_active, size)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            id,
            product.name,
            product.description || '',
            product.price,
            product.category,
            product.stock || 0,
            product.imageUrl || '',
            JSON.stringify(product.images || []),
            true,
            product.size || ''
        ]);

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update a product
export async function PUT(request: Request) {
    try {
        const product = await request.json();

        await db.query(`
            UPDATE products 
            SET name = $1, description = $2, price = $3, category = $4, 
                stock = $5, image_url = $6, images = $7, size = $8, is_active = $9
            WHERE id = $10
        `, [
            product.name,
            product.description || '',
            product.price,
            product.category,
            product.stock || 0,
            product.imageUrl || '',
            JSON.stringify(product.images || []),
            product.size || '',
            product.isActive,
            product.id
        ]);

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
        await db.query('DELETE FROM products WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
