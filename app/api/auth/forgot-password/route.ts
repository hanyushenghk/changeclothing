import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ForgotPasswordBody = {
  email?: string;
  redirectTo?: string;
  captchaToken?: string;
};

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anon, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function looksLikeRedirectIssue(message: string): boolean {
  const msg = message.toLowerCase();

  return (
    msg.includes("redirect")
    || msg.includes("url")
    || msg.includes("site_url")
    || msg.includes("not allowed")
  );
}

function isLocalRequest(request: Request): boolean {
  const host = request.headers.get("host") ?? "";
  return host.includes("127.0.0.1") || host.includes("localhost");
}

function shouldAllowLocalBypass(request: Request): boolean {
  return (
    process.env.NODE_ENV !== "production"
    && process.env.TURNSTILE_DEV_BYPASS === "true"
    && isLocalRequest(request)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ForgotPasswordBody;
    const email = body.email?.trim() ?? "";
    const redirectTo = body.redirectTo?.trim();
    const captchaToken = body.captchaToken?.trim();

    if (!email) {
      return NextResponse.json({ error: "Missing email." }, { status: 400 });
    }

    const supabase = getSupabaseAuthClient();

    const firstTry = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
      captchaToken: captchaToken || undefined,
    });

    if (!firstTry.error) {
      return NextResponse.json({ ok: true });
    }

    const firstMessage = firstTry.error.message ?? "";
    if (
      shouldAllowLocalBypass(request)
      && firstMessage.toLowerCase().includes("unable to process request")
    ) {
      return NextResponse.json({
        ok: true,
        bypassed: true,
        reason: "local-dev-supabase-unable-to-process-request",
      });
    }

    if (!looksLikeRedirectIssue(firstMessage)) {
      return NextResponse.json({ error: firstTry.error.message }, { status: 400 });
    }

    const secondTry = await supabase.auth.resetPasswordForEmail(email, {
      captchaToken: captchaToken || undefined,
    });

    if (secondTry.error) {
      return NextResponse.json({ error: secondTry.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, fallbackWithoutRedirectTo: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forgot password failed";
    const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined;
    const code =
      cause && typeof cause === "object" && "code" in cause
        ? String((cause as { code?: unknown }).code ?? "")
        : "";
    const hostname =
      cause && typeof cause === "object" && "hostname" in cause
        ? String((cause as { hostname?: unknown }).hostname ?? "")
        : "";

    if (code === "ENOTFOUND") {
      if (shouldAllowLocalBypass(request)) {
        return NextResponse.json({
          ok: true,
          bypassed: true,
          reason: "local-dev-supabase-dns-unreachable",
        });
      }

      return NextResponse.json(
        {
          error: `无法连接 Supabase（DNS 解析失败：${hostname || "unknown host"}）。请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL，或切换网络/DNS 后重试。`,
        },
        { status: 502 },
      );
    }

    if (message.toLowerCase().includes("fetch failed")) {
      if (shouldAllowLocalBypass(request)) {
        return NextResponse.json({
          ok: true,
          bypassed: true,
          reason: "local-dev-supabase-fetch-failed",
        });
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
