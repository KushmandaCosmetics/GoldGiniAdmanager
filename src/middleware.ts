import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const protectedApiPrefixes = ['/api/campaigns', '/api/wallet', '/api/analytics'];
const protectedPagePrefixes = ['/dashboard', '/campaigns', '/wallet', '/analytics', '/settings', '/admin'];

// Routes that need CORS (called by the e-commerce website)
const publicAdPrefixes = ['/api/serve-ad', '/api/events'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle CORS for public ad endpoints
  const isPublicAdApi = publicAdPrefixes.some(prefix => pathname.startsWith(prefix));
  
  if (isPublicAdApi) {
    // Handle Preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Handle standard request - proceed and add headers
    const res = NextResponse.next();
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
  }

  const isProtectedApi = protectedApiPrefixes.some(prefix => pathname.startsWith(prefix));
  const isProtectedPage = protectedPagePrefixes.some(prefix => pathname.startsWith(prefix));

  if (isProtectedApi || isProtectedPage) {
    const token = req.cookies.get('ad_manager_session')?.value;

    if (!token) {
      if (isProtectedApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (isProtectedApi) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Attach user data to headers so API routes can access it
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-seller-id', payload.sellerId.toString());
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
