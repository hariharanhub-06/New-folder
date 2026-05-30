import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllCustomers } from '@/lib/db';
import pool from '@/lib/db';

function isAdmin() {
    return !!cookies().get('admin_session');
}

export async function GET() {
    if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const customers = await getAllCustomers();
        return NextResponse.json({ customers });
    } catch (error: any) {
        console.error('Admin customers error:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const { searchParams } = new URL(request.url);
        const purgeUnverified = searchParams.get('purgeUnverified');

        if (purgeUnverified === 'true') {
            const res = await pool.query(`DELETE FROM customers WHERE is_verified = false`);
            return NextResponse.json({ success: true, deleted: res.rowCount });
        }

        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        await pool.query(`DELETE FROM customers WHERE id = $1`, [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete customer error:', error);
        return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
}
