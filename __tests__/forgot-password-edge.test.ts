import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { createClient } from "@supabase/supabase-js";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

const originalEnv = process.env;

function jsonRequest(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

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

describe("/api/auth/forgot-password edge branches", () => {
  test("rejects missing email properties and redirect errors without messages", async () => {
    expect((await forgotPasswordPost(jsonRequest({}))).status).toBe(400);

    jest.mocked(createClient).mockReturnValueOnce({
      auth: {
        resetPasswordForEmail: jest.fn().mockResolvedValueOnce({ error: {} }),
      },
    } as never);

    const response = await forgotPasswordPost(jsonRequest({ email: "ada@example.com" }));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({});
  });

  test("uses unknown host when DNS failures have no hostname", async () => {
    jest.mocked(createClient).mockImplementationOnce(() => {
      throw Object.assign(new Error("fetch failed"), {
        cause: { code: "ENOTFOUND", hostname: null },
      });
    });

    const response = await forgotPasswordPost(jsonRequest({ email: "ada@example.com" }));

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual(expect.objectContaining({
      error: expect.stringContaining("unknown host"),
    }));
  });
});
