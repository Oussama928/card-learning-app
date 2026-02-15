import { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/callback'
];

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/api/')) {
    return;
  }

  const isPublic = publicPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  // Check for  session token
  const sessionToken = req.cookies.get('next-auth.session-token')?.value ||
                       req.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken && !isPublic) {
    return Response.redirect(new URL('/', req.url));
  }
}

export const config = {
  matcher: [
    //skip auth for API routes, static files, and Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export const runtime = 'nodejs';