import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: Request) {
    const customerId = cookies().get('customer_session')?.value;
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const { currentPassword, newPassword } = await request.json();
        if (!currentPassword || !newPassword) return NextResponse.json({ error: 'All fields required' }, { status: 400 });
        if (newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });

        const res = await pool.query('SELECT password_hash FROM customers WHERE id = $1', [customerId]);
        const customer = res.rows[0];
        if (!customer) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

        const valid = await bcrypt.compare(currentPassword, customer.password_hash);
        if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

        const newHash = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE customers SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, customerId]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }
}
