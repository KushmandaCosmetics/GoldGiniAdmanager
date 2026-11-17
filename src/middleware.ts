import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const protectedApiPrefixes = ['/api/campaigns', '/api/wallet', '/api/analytics'];
const protectedPagePrefixes = ['/dashboard', '/campaigns', '/wallet', '/analytics', '/settings', '/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin');
  const proto = req.headers.get('x-forwarded-proto');
  const host = req.headers.get('host') || '';

  // 1. Force HTTPS in production if requested over plain HTTP
  if (proto === 'http' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Handle CORS Preflight (OPTIONS) for all API endpoints
  if (pathname.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      const preflightHeaders: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-seller-id',
      };
      if (origin) {
        preflightHeaders['Access-Control-Allow-Origin'] = origin;
        preflightHeaders['Access-Control-Allow-Credentials'] = 'true';
      } else {
        preflightHeaders['Access-Control-Allow-Origin'] = '*';
      }
      return new NextResponse(null, { status: 204, headers: preflightHeaders });
    }
  }

  // 3. Helper to attach CORS headers to responses
  const attachCors = (response: NextResponse) => {
    if (pathname.startsWith('/api/')) {
      if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      } else {
        response.headers.set('Access-Control-Allow-Origin', '*');
      }
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-seller-id');
    }
    return response;
  };

  const isProtectedApi = protectedApiPrefixes.some(prefix => pathname.startsWith(prefix));
  const isProtectedPage = protectedPagePrefixes.some(prefix => pathname.startsWith(prefix));

  if (isProtectedApi || isProtectedPage) {
    const token = req.cookies.get('ad_manager_session')?.value;

    if (!token) {
      if (isProtectedApi) {
        return attachCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (isProtectedApi) {
        return attachCors(NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }));
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Attach user data to headers so API routes can access it
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-seller-id', payload.sellerId.toString());
    
    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return attachCors(res);
  }

  return attachCors(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
