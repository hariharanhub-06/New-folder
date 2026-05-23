import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getCustomerAddresses, addCustomerAddress } from '@/lib/db';

function getCustomerId() {
    return cookies().get('customer_session')?.value || null;
}

export async function GET() {
    const customerId = getCustomerId();
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const addresses = await getCustomerAddresses(customerId);
    return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
    const customerId = getCustomerId();
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const { label, name, mobile, street, city, state, country, pincode, isDefault } = await request.json();
        if (!name || !mobile || !street || !city || !state || !pincode) {
            return NextResponse.json({ error: 'All address fields are required' }, { status: 400 });
        }
        const id = crypto.randomUUID();
        await addCustomerAddress({ id, customerId, label: label || 'Home', name, mobile, street, city, state, country: country || 'India', pincode, isDefault: !!isDefault });
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Add address error:', error);
        return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
    }
}
