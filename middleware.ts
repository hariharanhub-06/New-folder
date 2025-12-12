import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check if it's an admin path
    if (path.startsWith('/admin')) {
        // public admin path (login)
        if (path === '/admin/login') {
            // If already logged in, redirect to dashboard
            if (request.cookies.has('admin_session')) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }

        // Protected admin paths
        if (!request.cookies.has('admin_session')) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
