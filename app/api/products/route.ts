
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getProduct, saveProduct, deleteProduct } from '@/lib/db';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic'; // Disable caching

// GET: Fetch products with filters and pagination
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

        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.max(1, parseInt(searchParams.get('limit') || '12') || 12);
        const category = searchParams.get('category') || undefined;
        const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
        const sort = (searchParams.get('sort') as any) || 'newest';
        const search = searchParams.get('search') || undefined;
        const isAdminParam = searchParams.get('admin') === 'true';
        const cookieHeader = request.headers.get('cookie') || '';
        const isAdminAuthed = cookieHeader.includes('admin_session=true');
        const isAdmin = isAdminParam && isAdminAuthed;
        const isOffer = searchParams.get('isOffer') === 'true' ? true : searchParams.get('isOffer') === 'false' ? false : undefined;
        const isTrending = searchParams.get('isTrending') === 'true' ? true : searchParams.get('isTrending') === 'false' ? false : undefined;
        const isOfferDrop = searchParams.get('isOfferDrop') === 'true' ? true : searchParams.get('isOfferDrop') === 'false' ? false : undefined;
        const isNewArrival = searchParams.get('isNewArrival') === 'true' ? true : searchParams.get('isNewArrival') === 'false' ? false : undefined;
        const tag = searchParams.get('tag') || undefined;

        const result = await import('@/lib/db').then(mod => mod.getPaginatedProducts({
            page,
            limit: isAdmin && !searchParams.has('limit') ? 1000 : limit,
            category,
            minPrice,
            maxPrice,
            sort,
            search,
            includeInactive: isAdmin,
            isOffer,
            isTrending,
            isOfferDrop,
            isNewArrival,
            tag
        }));

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new product
export async function POST(request: Request) {
    try {
        const productData = await request.json();
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

// DELETE: Delete a product (or all products with ?all=true)
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
        const cookieHeader = request.headers.get('cookie') || '';
        if (!cookieHeader.includes('admin_session=true')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE order_items SET product_id = NULL WHERE product_id IS NOT NULL');
            await client.query('DELETE FROM product_sizes');
            await client.query('DELETE FROM products');
            await client.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error('Error deleting all products:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        } finally {
            client.release();
        }
    }

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


