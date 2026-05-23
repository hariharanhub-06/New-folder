import { NextResponse } from 'next/server';
import { getCustomerByMobile, setCustomerOtp } from '@/lib/db';
import { sendMail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { mobile } = await request.json();
        if (!mobile) return NextResponse.json({ error: 'Mobile is required' }, { status: 400 });

        const normalizedMobile = mobile.replace(/\D/g, '').slice(0, 10);
        const customer = await getCustomerByMobile(normalizedMobile);

        if (!customer) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        if (customer.is_verified) {
            return NextResponse.json({ error: 'Account already verified' }, { status: 400 });
        }

        // Rate limit: last OTP must be > 30 seconds old
        if (customer.otp_expires_at) {
            const otpCreatedAt = new Date(customer.otp_expires_at).getTime() - 10 * 60 * 1000;
            if (Date.now() - otpCreatedAt < 30 * 1000) {
                return NextResponse.json({ error: 'Please wait 30 seconds before requesting a new OTP' }, { status: 429 });
            }
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await setCustomerOtp(normalizedMobile, otpCode, otpExpiresAt);

        console.log(`[OTP RESEND] ${customer.name} (${customer.email}): ${otpCode}`);

        const otpHtml = `
            <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="background:#1a1a1a;padding:24px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:2px;">STARTUP MENS WEAR</h1>
                </div>
                <div style="padding:32px;">
                    <p style="font-size:16px;color:#1a202c;">Hi <b>${customer.name}</b>,</p>
                    <p style="font-size:14px;color:#4a5568;">Your new OTP (expires in 10 minutes):</p>
                    <div style="text-align:center;margin:32px 0;">
                        <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1a1a1a;">${otpCode}</span>
                    </div>
                </div>
            </div>
        `;

        try {
            await sendMail(customer.email, `New OTP - Startup Mens Wear`, otpHtml);
        } catch (emailError: any) {
            console.error('[EMAIL ERROR] Failed to send resend OTP email:', emailError?.message || emailError);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Resend OTP error:', error?.message || error);
        return NextResponse.json({ error: 'Failed to resend OTP' }, { status: 500 });
    }
}
