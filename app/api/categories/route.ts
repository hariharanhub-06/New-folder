import { NextResponse } from 'next/server';
import db, { getUniqueCategories, getFullCategories, upsertCategory, deleteCategory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const full = searchParams.get('full') === 'true';

        if (full) {
            const categories = await getFullCategories();
            return NextResponse.json(categories);
        } else {
            const categories = await getUniqueCategories();
            return NextResponse.json(categories);
        }
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = await upsertCategory(body);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const deleteAll = searchParams.get('all') === 'true';

        if (deleteAll) {
            const cookieHeader = request.headers.get('cookie') || '';
            if (!cookieHeader.includes('admin_session=true')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            await db.query('DELETE FROM categories');
            return NextResponse.json({ success: true });
        }

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        const result = await deleteCategory(id);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
