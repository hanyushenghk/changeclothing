import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE, defaultLocale, isLocale, parseLocalePath } from "@/lib/i18n/config";
import { detectLocaleFromRequest } from "@/lib/i18n/middleware-locale";

function shouldSkipLocaleRouting(pathname: string) {
  if (pathname.startsWith("/_next")) {
    return true;
  }
  if (pathname.startsWith("/api")) {
    return true;
  }
  if (pathname.startsWith("/auth/callback")) {
    return true;
  }
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico"
  ) {
    return true;
  }
  if (pathname === "/opengraph-image" || pathname.startsWith("/opengraph-image")) {
    return true;
  }
  if (pathname === "/twitter-image" || pathname.startsWith("/twitter-image")) {
    return true;
  }
  if (pathname === "/icon" || pathname.startsWith("/icon/")) {
    return true;
  }
  if (/\.(ico|png|jpg|jpeg|gif|svg|webp|woff2|txt|xml|webmanifest)$/i.test(pathname)) {
    return true;
  }
  return false;
}

const PATHS_WITHOUT_LOCALE = new Set([
  "/try",
  "/history",
  "/reset-password",
  "/auth/auth-code-error",
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldSkipLocaleRouting(pathname)) {
    return applySupabaseSession(request, NextResponse.next({ request }));
  }

  if (pathname === "/") {
    const locale = detectLocaleFromRequest(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  const parsed = parseLocalePath(pathname);
  if (!parsed) {
    if (PATHS_WITHOUT_LOCALE.has(pathname)) {
      const locale = detectLocaleFromRequest(request);
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
      const res = NextResponse.redirect(url);
      res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    const res = NextResponse.redirect(url);
    return res;
  }

  if (!isLocale(parsed.locale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-cc-locale", parsed.locale);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.set(LOCALE_COOKIE, parsed.locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  response = await applySupabaseSession(request, response);
  return response;
}

async function applySupabaseSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
