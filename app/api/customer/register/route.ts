import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createCustomer, getCustomerByMobile, getCustomerByEmail, countRecentRegistrations, logRegistrationAttempt } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const attempts = await countRecentRegistrations(ip);
        if (attempts >= 3) {
            return NextResponse.json({ error: 'Too many registrations from this device. Try again after 24 hours.' }, { status: 429 });
        }

        const { name, mobile, email, password } = await request.json();

        if (!name || !mobile || !email || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const normalizedMobile = mobile.replace(/\D/g, '').slice(0, 10);
        if (normalizedMobile.length !== 10) {
            return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const existingMobile = await getCustomerByMobile(normalizedMobile);
        if (existingMobile?.is_verified) {
            return NextResponse.json({ error: 'Mobile number already registered' }, { status: 409 });
        }

        const existingEmail = await getCustomerByEmail(email);
        if (existingEmail?.is_verified && existingEmail.mobile !== normalizedMobile) {
            return NextResponse.json({ error: 'Email address already registered' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const id = existingMobile?.id || crypto.randomUUID();

        await createCustomer({ id, name, mobile: normalizedMobile, email, passwordHash });
        await logRegistrationAttempt(ip);

        cookies().set('customer_session', id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'none',
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Register error:', error?.message || error);
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
    }
}
