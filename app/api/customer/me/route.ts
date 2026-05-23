import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCustomerById } from '@/lib/db';

export async function GET() {
    try {
        const customerId = cookies().get('customer_session')?.value;
        if (!customerId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const customer = await getCustomerById(customerId);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({ customer });
    } catch (error: any) {
        console.error('Customer me error:', error);
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}
