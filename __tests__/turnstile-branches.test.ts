import { POST as turnstilePost } from "@/app/api/turnstile/verify/route";

const originalEnv = process.env;

function jsonRequest(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api/turnstile/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

beforeEach(() => {
  process.env = { ...originalEnv, TURNSTILE_SECRET_KEY: "secret" };
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe("/api/turnstile/verify extra branches", () => {
  test("omits remoteip when forwarded IP is empty", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));

    const response = await turnstilePost(jsonRequest({ token: "ok" }, { "x-forwarded-for": " , 2.2.2.2" }));

    expect(response.status).toBe(200);
    const body = jest.mocked(fetch).mock.calls[0][1]?.body as URLSearchParams;
    expect(body.has("remoteip")).toBe(false);
  });

  test("uses fallback failure fields and does not bypass in production", async () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.TURNSTILE_DEV_BYPASS = "true";
    jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: false })));

    const response = await turnstilePost(jsonRequest({ token: "bad" }, { host: "127.0.0.1:3000" }));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: "Turnstile verification failed.",
      codes: [],
      hostname: null,
    });
  });
});
