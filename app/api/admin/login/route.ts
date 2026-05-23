
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { verifyAdmin, createInitialAdmin } from '@/lib/db';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Ensure default admin exists (self-healing)
        await createInitialAdmin();

        const adminUser = await verifyAdmin(username);

        if (!adminUser) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Check bcrypt hash first; fall back to plain text for existing unhashed passwords
        const isHashedPassword = adminUser.password?.startsWith('$2');
        const passwordValid = isHashedPassword
            ? await bcrypt.compare(password, adminUser.password)
            : adminUser.password === password;

        if (passwordValid) {
            // Auto-migrate plain text password to bcrypt hash on first login
            if (!isHashedPassword) {
                const hashed = await bcrypt.hash(password, 12);
                await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashed, adminUser.id]);
            }

            // Set session cookie — SameSite=None required so cookies work inside
            // cross-origin iframes (e.g. Harishblog Platform Hub Data tab)
            const oneDay = 24 * 60 * 60 * 1000;
            cookies().set('admin_session', 'true', {
                secure: true,
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                maxAge: oneDay
            });
            cookies().set('admin_id', adminUser.id, {
                secure: true,
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                maxAge: oneDay
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    } catch (error) {
        console.error("Login Check Error:", error);
        return NextResponse.json({ error: `Internal Error: ${error.message}` }, { status: 500 });
    }
}
