import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    if (path.startsWith('/admin')) {
        if (path === '/admin/login') {
            if (request.cookies.has('admin_session')) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }
        if (!request.cookies.has('admin_session')) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    if (path.startsWith('/account')) {
        if (!request.cookies.has('customer_session')) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('next', path);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/account/:path*'],
};
