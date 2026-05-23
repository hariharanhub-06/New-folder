import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createCustomer, getCustomerByMobile, getCustomerByEmail } from '@/lib/db';
import { sendMail } from '@/lib/email';

export async function POST(request: Request) {
    try {
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
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const id = crypto.randomUUID();

        await createCustomer({ id, name, mobile: normalizedMobile, email, passwordHash, otpCode, otpExpiresAt });

        console.log(`[OTP] ${name} (${email}): ${otpCode}`);

        // Send email separately — failure here should not block registration
        const otpHtml = `
            <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="background:#1a1a1a;padding:24px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:2px;">STARTUP MENS WEAR</h1>
                </div>
                <div style="padding:32px;">
                    <p style="font-size:16px;color:#1a202c;">Hi <b>${name}</b>,</p>
                    <p style="font-size:14px;color:#4a5568;line-height:1.6;">Use the OTP below to verify your account. It expires in 10 minutes.</p>
                    <div style="text-align:center;margin:32px 0;">
                        <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1a1a1a;">${otpCode}</span>
                    </div>
                    <p style="font-size:12px;color:#a0aec0;text-align:center;">Do not share this OTP with anyone.</p>
                </div>
                <div style="background:#f7fafc;padding:16px;text-align:center;border-top:1px solid #edf2f7;">
                    <p style="margin:0;font-size:12px;color:#a0aec0;">&copy; ${new Date().getFullYear()} Startup Mens Wear</p>
                </div>
            </div>
        `;

        try {
            await sendMail(email, `Your OTP - Startup Mens Wear`, otpHtml);
        } catch (emailError: any) {
            console.error('[EMAIL ERROR] Failed to send OTP email:', emailError?.message || emailError);
            // Registration still succeeded — user can resend OTP from verify page
        }

        return NextResponse.json({ success: true, message: 'OTP sent to your email' });
    } catch (error: any) {
        console.error('Register error:', error?.message || error);
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
    }
}
