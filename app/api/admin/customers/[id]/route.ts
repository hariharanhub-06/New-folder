import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCustomerWithOrders } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    if (!cookies().get('admin_session')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await getCustomerWithOrders(params.id);
        if (!result) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Admin customer detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}
