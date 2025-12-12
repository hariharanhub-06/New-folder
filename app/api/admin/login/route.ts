
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        const envUsername = process.env.ADMIN_USERNAME;
        const envPassword = process.env.ADMIN_PASSWORD;

        if (!envUsername || !envPassword) {
            console.error("ADMIN_USERNAME or ADMIN_PASSWORD not set in env");
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        if (username === envUsername && password === envPassword) {
            // Set session cookie
            const oneDay = 24 * 60 * 60 * 1000;
            cookies().set('admin_session', 'true', {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                path: '/',
                maxAge: oneDay
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
