import { NextRequest } from "next/server";

import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { GET as dailyLoveLetterGet } from "@/app/api/cron/daily-love-letter/route";
import { GET as authCallbackGet } from "@/app/auth/callback/route";
import { sendDailyLoveLetter } from "@/lib/email";
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

describe("/api/auth/forgot-password branches", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  test("fails fast when Supabase config is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await forgotPasswordPost(jsonRequest({ email: "ada@example.com" }));

    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({
      error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    });
  });

  test("surfaces retry, fetch, and non-Error failures", async () => {
    jest.mocked(createClient).mockReturnValueOnce({
      auth: {
        resetPasswordForEmail: jest.fn()
          .mockResolvedValueOnce({ error: { message: "site_url mismatch" } })
          .mockResolvedValueOnce({ error: { message: "still blocked" } }),
      },
    } as never);
    expect((await forgotPasswordPost(jsonRequest({ email: "ada@example.com" }))).status).toBe(400);

    jest.mocked(createClient).mockImplementationOnce(() => {
      throw new Error("fetch failed");
    });
    expect((await forgotPasswordPost(jsonRequest({ email: "ada@example.com" }))).status).toBe(502);

    jest.mocked(createClient).mockImplementationOnce(() => {
      throw "unknown";
    });
    const nonError = await forgotPasswordPost(jsonRequest({ email: "ada@example.com" }));
    expect(nonError.status).toBe(500);
    expect(await readJson(nonError)).toEqual({ error: "Forgot password failed" });
  });
});

describe("/api/cron/daily-love-letter branches", () => {
  test("accepts bearer secret and handles empty data", async () => {
    process.env.CRON_SECRET = "secret";
    process.env.RESEND_API_KEY = "resend";
    const query = {
      select: jest.fn().mockReturnThis(),
      not: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    jest.mocked(createAdminSupabaseClient).mockReturnValueOnce({ from: jest.fn().mockReturnValue(query) } as never);

    const response = await dailyLoveLetterGet(new Request("http://localhost/api", {
      headers: { authorization: "Bearer secret" },
    }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({ total: 0, sent: 0, failed: 0 });
  });

  test("throws database errors and records non-Error send failures", async () => {
    process.env.CRON_SECRET = "secret";
    process.env.RESEND_API_KEY = "resend";
    jest.mocked(createAdminSupabaseClient).mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockResolvedValue({ data: null, error: { message: "db down" } }),
      }),
    } as never);
    expect(
      (await dailyLoveLetterGet(new Request("http://localhost/api", { headers: { authorization: "Bearer secret" } }))).status,
    ).toBe(500);

    jest.mocked(createAdminSupabaseClient).mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockResolvedValue({ data: [{ email: "x@example.com", name: null, userid: null }], error: null }),
      }),
    } as never);
    jest.mocked(sendDailyLoveLetter).mockRejectedValueOnce("bad" as never);
    expect(
      await readJson(await dailyLoveLetterGet(new Request("http://localhost/api", { headers: { authorization: "Bearer secret" } }))),
    ).toMatchObject({ total: 1, sent: 0, failed: 1 });
  });
});

describe("/auth/callback branches", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  test("uses forwarded host in production and writes auth cookies", async () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    jest.mocked(createServerClient).mockImplementationOnce((_url, _anon, options) => {
      const cookieOptions = options as unknown as {
        cookies: {
          setAll: (cookiesToSet: Array<{ name: string; value: string; options: { path: string } }>) => void;
        };
      };
      cookieOptions.cookies.setAll([{ name: "sb", value: "token", options: { path: "/" } }]);
      return {
        auth: { exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }) },
      } as never;
    });

    const response = await authCallbackGet(new NextRequest("http://internal/auth/callback?code=ok&next=/zh/try", {
      headers: {
        "x-forwarded-host": "app.example.com",
        "x-forwarded-proto": "https",
      },
    }));

    expect(response.headers.get("location")).toBe("https://app.example.com/zh/try");
    expect(response.cookies.get("sb")?.value).toBe("token");
  });

  test("redirects to error when code exchange fails", async () => {
    jest.mocked(createServerClient).mockReturnValueOnce({
      auth: { exchangeCodeForSession: jest.fn().mockResolvedValue({ error: new Error("bad code") }) },
    } as never);

    const response = await authCallbackGet(new NextRequest("http://localhost/auth/callback?code=bad&next=/en/try"));

    expect(response.headers.get("location")).toBe("http://localhost/en/auth/auth-code-error");
  });
});
