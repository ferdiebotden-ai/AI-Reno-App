import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (formerly Middleware)
 * Handles authentication and admin route protection
 * Runs on Node.js runtime before routes are rendered
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth in development mode or demo mode (for pitch presentations)
  if (process.env['NODE_ENV'] === 'development' ||
      process.env['NEXT_PUBLIC_DEMO_MODE'] === 'true') {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Protect admin routes - redirect to login if not authenticated or not admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (request.nextUrl.pathname === '/admin/login') {
      return supabaseResponse;
    }

    // Redirect to login if not authenticated or auth error
    if (!user || error) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Verify admin role via app_metadata
    const metadata = user.app_metadata as Record<string, unknown> | undefined;
    const isAdmin = metadata?.['role'] === 'admin';
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
