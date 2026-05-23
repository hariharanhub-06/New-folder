import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateCustomerAddress, deleteCustomerAddress, setDefaultAddress } from '@/lib/db';

function getCustomerId() {
    return cookies().get('customer_session')?.value || null;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const customerId = getCustomerId();
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const body = await request.json();
        if (body.setDefault) {
            await setDefaultAddress(params.id, customerId);
        } else {
            await updateCustomerAddress(params.id, customerId, body);
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update address error:', error);
        return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const customerId = getCustomerId();
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        await deleteCustomerAddress(params.id, customerId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete address error:', error);
        return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
    }
}
