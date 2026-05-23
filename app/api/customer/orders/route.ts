import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCustomerOrders } from '@/lib/db';

export async function GET() {
    try {
        const customerId = cookies().get('customer_session')?.value;
        if (!customerId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const orders = await getCustomerOrders(customerId);
        return NextResponse.json({ orders });
    } catch (error: any) {
        console.error('Customer orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
