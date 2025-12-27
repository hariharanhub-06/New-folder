
import { NextResponse } from 'next/server';
import { getProduct, saveProduct, deleteProduct } from '@/lib/db';
import pool from '@/lib/db'; // Keep pool for the list query or move list query to db.ts

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

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const category = searchParams.get('category') || undefined;
        const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
        const sort = (searchParams.get('sort') as any) || 'newest';
        const search = searchParams.get('search') || undefined;
        const isAdmin = searchParams.get('admin') === 'true';
        const isOffer = searchParams.get('isOffer') === 'true' ? true : searchParams.get('isOffer') === 'false' ? false : undefined;
        const isTrending = searchParams.get('isTrending') === 'true' ? true : searchParams.get('isTrending') === 'false' ? false : undefined;
        const isOfferDrop = searchParams.get('isOfferDrop') === 'true' ? true : searchParams.get('isOfferDrop') === 'false' ? false : undefined;
        const isNewArrival = searchParams.get('isNewArrival') === 'true' ? true : searchParams.get('isNewArrival') === 'false' ? false : undefined;

        // Admin view might want to see inactive products and potentially a larger list, 
        // but for now we stick to the requested limit or a default higher one for admin if not specified?
        // Actually, let's just respect the params. If admin view wants all, it can request a high limit.
        // For backward compatibility with simpler calls, we default to page 1.

        const result = await import('@/lib/db').then(mod => mod.getPaginatedProducts({
            page,
            limit: isAdmin && !searchParams.has('limit') ? 1000 : limit, // Default higher limit for admin if not specified
            category,
            minPrice,
            maxPrice,
            sort,
            search,
            includeInactive: isAdmin,
            isOffer,
            isTrending,
            isOfferDrop,
            isNewArrival
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


