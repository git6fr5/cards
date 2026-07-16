import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/utils/auth';
import { publicPaths } from '@/proxy.config';

const pathMatches = (path: string, base: string) => path === base || path.startsWith(`${base}/`);
const isPublicPath = (path: string) => publicPaths.some((base) => pathMatches(path, base));

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (isPublicPath(path)) return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)'],
};
