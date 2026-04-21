import { NextResponse } from "next/server";

export const runtime = "nodejs";

type VerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function POST(request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    return NextResponse.json({ error: "TURNSTILE_SECRET_KEY is not configured." }, { status: 500 });
  }

  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json({ error: "Missing Turnstile token." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const verifyBody = new URLSearchParams({
      secret,
      response: token,
    });

    if (ip) {
      verifyBody.set("remoteip", ip);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verifyBody,
    });

    const result = (await response.json()) as VerifyResponse;

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Turnstile verification failed.",
          codes: result["error-codes"] ?? [],
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Turnstile verification request failed." }, { status: 500 });
  }
}
