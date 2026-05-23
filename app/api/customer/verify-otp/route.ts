import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCustomerOtp, getCustomerByMobile } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { mobile, otp } = await request.json();

        if (!mobile || !otp) {
            return NextResponse.json({ error: 'Mobile and OTP are required' }, { status: 400 });
        }

        const normalizedMobile = mobile.replace(/\D/g, '').slice(0, 10);
        const verified = await verifyCustomerOtp(normalizedMobile, otp.trim());

        if (!verified) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        const customer = await getCustomerByMobile(normalizedMobile);
        const sevenDays = 7 * 24 * 60 * 60;

        cookies().set('customer_session', customer.id, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            path: '/',
            maxAge: sevenDays,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
