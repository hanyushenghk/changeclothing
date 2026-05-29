import { NextRequest } from "next/server";

import { GET as authCallbackGet } from "@/app/auth/callback/route";
import { createServerClient } from "@supabase/ssr";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({ getAll: jest.fn().mockReturnValue([]) }),
}));

const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  };
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = originalEnv;
});

describe("/auth/callback remaining branches", () => {
  test("uses request origin in development and reads existing cookies", async () => {
    Object.assign(process.env, { NODE_ENV: "development" });
    jest.mocked(createServerClient).mockImplementationOnce((_url, _anon, options) => {
      const cookieOptions = options as unknown as {
        cookies: { getAll: () => unknown[] };
      };
      cookieOptions.cookies.getAll();
      return {
        auth: { exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }) },
      } as never;
    });

    const response = await authCallbackGet(
      new NextRequest("http://localhost/auth/callback?code=ok&next=/en"),
    );

    expect(response.headers.get("location")).toBe("http://localhost/en");
  });

  test("defaults forwarded production redirects to https", async () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    jest.mocked(createServerClient).mockReturnValueOnce({
      auth: { exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }) },
    } as never);

    const response = await authCallbackGet(
      new NextRequest("http://internal/auth/callback?code=ok&next=/en", {
        headers: { "x-forwarded-host": "app.example.com" },
      }),
    );

    expect(response.headers.get("location")).toBe("https://app.example.com/en");
  });
});
