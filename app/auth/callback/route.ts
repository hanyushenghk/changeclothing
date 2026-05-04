import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

function localeFromAppPath(path: string): "en" | "zh" {
  const match = /^\/(en|zh)(\/|$)/.exec(path);
  if (match?.[1] === "zh" || match?.[1] === "en") {
    return match[1];
  }
  return "en";
}

function redirectBase(request: NextRequest): string {
  const { origin } = request.nextUrl;
  if (process.env.NODE_ENV === "development") {
    return origin;
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return origin;
}

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const base = redirectBase(request);
  const locale = localeFromAppPath(next);

  const toError = () =>
    NextResponse.redirect(new URL(`/${locale}/auth/auth-code-error`, base));

  if (!url || !anon || !code) {
    return toError();
  }

  const cookieStore = await cookies();
  const successRedirect = new URL(next, base);
  const response = NextResponse.redirect(successRedirect);

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return toError();
  }

  return response;
}
