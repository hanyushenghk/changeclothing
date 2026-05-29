import { NextRequest } from "next/server";

import { GET as authCallbackGet } from "@/app/auth/callback/route";
import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { GET as dailyEmailGet } from "@/app/api/cron/daily-email/route";
import { GET as dailyLoveLetterGet } from "@/app/api/cron/daily-love-letter/route";
import { sendDailyLoveLetter, sendDailyLoveLetterToAll } from "@/lib/email";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: jest.fn().mockReturnValue([]),
  }),
}));

jest.mock("@/lib/email", () => ({
  sendDailyLoveLetter: jest.fn(),
  sendDailyLoveLetterToAll: jest.fn(),
}));

jest.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: jest.fn(),
}));

const originalEnv = process.env;

function jsonRequest(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

beforeEach(() => {
  process.env = { ...originalEnv };
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = originalEnv;
});

describe("/api/auth/forgot-password", () => {
  function authClient(...results: Array<{ error: null | { message: string } }>) {
    jest.mocked(createClient).mockReturnValueOnce({
      auth: {
        resetPasswordForEmail: jest.fn()
          .mockResolvedValueOnce(results[0])
          .mockResolvedValueOnce(results[1] ?? results[0]),
      },
    } as never);
  }

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  test("validates email and sends reset email", async () => {
    expect((await forgotPasswordPost(jsonRequest({ email: " " }))).status).toBe(400);

    authClient({ error: null });
    const response = await forgotPasswordPost(jsonRequest({ email: " ada@example.com " }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
  });

  test("retries without redirect for redirect-url errors", async () => {
    authClient({ error: { message: "Redirect URL not allowed" } }, { error: null });

    const response = await forgotPasswordPost(
      jsonRequest({ email: "ada@example.com", redirectTo: "http://localhost/reset", captchaToken: " cap " }),
    );

    expect(response.status).toBe(200);
  });

  test("surfaces local Supabase, validation, and network errors", async () => {
    authClient({ error: { message: "Unable to process request" } });
    expect(
      (await forgotPasswordPost(jsonRequest({ email: "ada@example.com" }, { host: "localhost:3000" }))).status,
    ).toBe(502);

    authClient({ error: { message: "invalid email" } });
    expect((await forgotPasswordPost(jsonRequest({ email: "bad" }))).status).toBe(400);

    jest.mocked(createClient).mockImplementationOnce(() => {
      throw Object.assign(new Error("fetch failed"), {
        cause: { code: "ENOTFOUND", hostname: "bad.supabase.test" },
      });
    });
    const dns = await forgotPasswordPost(jsonRequest({ email: "ada@example.com" }));
    expect(dns.status).toBe(502);
    expect(await readJson(dns)).toEqual(expect.objectContaining({
      error: expect.stringContaining("DNS"),
    }));
  });
});

describe("cron routes", () => {
  test("/api/cron/daily-email authorizes and reports stats", async () => {
    process.env.CRON_SECRET = "secret";
    expect((await dailyEmailGet(new NextRequest("http://localhost/api/cron/daily-email"))).status).toBe(401);

    jest.mocked(sendDailyLoveLetterToAll).mockResolvedValueOnce({ total: 2, sent: 2, failed: 0 });
    const response = await dailyEmailGet(
      new NextRequest("http://localhost/api/cron/daily-email", {
        headers: { authorization: "Bearer secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({ success: true, total: 2 });

    jest.mocked(sendDailyLoveLetterToAll).mockRejectedValueOnce(new Error("mail down"));
    expect(
      (
        await dailyEmailGet(new NextRequest("http://localhost/api/cron/daily-email", {
          headers: { authorization: "Bearer secret" },
        }))
      ).status,
    ).toBe(500);
  });

  test("/api/cron/daily-love-letter handles skips, sends, and database errors", async () => {
    expect((await dailyLoveLetterGet(new Request("http://localhost/api/cron/daily-love-letter"))).status).toBe(401);

    process.env.DAILY_LOVE_LETTER_ENABLED = "false";
    expect(
      await readJson(await dailyLoveLetterGet(new Request("http://localhost/api", { headers: { "x-vercel-cron": "1" } }))),
    ).toMatchObject({ skipped: true, reason: "disabled" });

    process.env.DAILY_LOVE_LETTER_ENABLED = "true";
    delete process.env.RESEND_API_KEY;
    expect(
      await readJson(await dailyLoveLetterGet(new Request("http://localhost/api", { headers: { "x-vercel-cron": "1" } }))),
    ).toMatchObject({ skipped: true, reason: "missing RESEND_API_KEY" });

    process.env.RESEND_API_KEY = "resend";
    const query = {
      select: jest.fn().mockReturnThis(),
      not: jest.fn().mockResolvedValue({
        data: [
          { email: "A@EXAMPLE.COM", name: " Ada ", userid: null },
          { email: "b@example.com", name: "", userid: "Bee" },
        ],
        error: null,
      }),
    };
    jest.mocked(createAdminSupabaseClient).mockReturnValueOnce({ from: jest.fn().mockReturnValue(query) } as never);
    jest.mocked(sendDailyLoveLetter).mockResolvedValueOnce({ id: "one" } as never).mockRejectedValueOnce(new Error("bad"));

    expect(
      await readJson(await dailyLoveLetterGet(new Request("http://localhost/api", { headers: { "x-vercel-cron": "1" } }))),
    ).toMatchObject({ ok: true, total: 2, sent: 1, failed: 1 });

    jest.mocked(createAdminSupabaseClient).mockImplementationOnce(() => {
      throw "unknown";
    });
    expect((await dailyLoveLetterGet(new Request("http://localhost/api", { headers: { "x-vercel-cron": "1" } }))).status).toBe(500);
  });
});

describe("/auth/callback", () => {
  test("redirects to locale error when config or code is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await authCallbackGet(new NextRequest("http://localhost/auth/callback?next=/zh/try"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/zh/auth/auth-code-error");
  });

  test("exchanges code and redirects only to safe app paths", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    jest.mocked(createServerClient).mockReturnValueOnce({
      auth: { exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }) },
    } as never);

    const response = await authCallbackGet(new NextRequest("http://localhost/auth/callback?code=ok&next=//evil.test"));

    expect(response.headers.get("location")).toBe("http://localhost/");
  });
});
