import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getCustomerByMobile } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { mobile, password } = await request.json();

        if (!mobile || !password) {
            return NextResponse.json({ error: 'Mobile and password are required' }, { status: 400 });
        }

        const normalizedMobile = mobile.replace(/\D/g, '').slice(0, 10);
        const customer = await getCustomerByMobile(normalizedMobile);

        if (!customer) {
            return NextResponse.json({ error: 'Invalid mobile number or password' }, { status: 401 });
        }

        if (!customer.is_verified) {
            return NextResponse.json({ error: 'Please verify your email first', needsVerification: true, mobile: normalizedMobile }, { status: 403 });
        }

        const passwordValid = await bcrypt.compare(password, customer.password_hash);
        if (!passwordValid) {
            return NextResponse.json({ error: 'Invalid mobile number or password' }, { status: 401 });
        }

        const sevenDays = 7 * 24 * 60 * 60;
        cookies().set('customer_session', customer.id, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            path: '/',
            maxAge: sevenDays,
        });

        return NextResponse.json({
            success: true,
            customer: { id: customer.id, name: customer.name, mobile: customer.mobile, email: customer.email }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
