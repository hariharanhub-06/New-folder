import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllCustomers } from '@/lib/db';

export async function GET() {
    if (!cookies().get('admin_session')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const customers = await getAllCustomers();
        return NextResponse.json({ customers });
    } catch (error: any) {
        console.error('Admin customers error:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}
