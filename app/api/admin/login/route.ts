
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdmin, createInitialAdmin } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Ensure default admin exists (self-healing)
        await createInitialAdmin();

        const adminUser = await verifyAdmin(username);

        if (!adminUser) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Simple direct comparison as requested (for hashing we would use bcrypt.compare)
        if (adminUser.password === password) {
            // Set session cookie
            const oneDay = 24 * 60 * 60 * 1000;
            cookies().set('admin_session', 'true', {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                path: '/',
                maxAge: oneDay
            });
            // Store admin ID in cookie for updates if needed, but session is simple for now
            cookies().set('admin_id', adminUser.id, {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                path: '/',
                maxAge: oneDay
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    } catch (error) {
        console.error("Login Check Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
