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
  process.env = { ...originalEnv };
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe("/api/turnstile/verify", () => {
  test("requires a configured secret and token", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect((await turnstilePost(jsonRequest({ token: "abc" }))).status).toBe(500);

    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect((await turnstilePost(jsonRequest({ token: " " }))).status).toBe(400);
  });

  test("verifies valid tokens and forwards client IP", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));

    const response = await turnstilePost(jsonRequest({ token: " token " }, { "x-forwarded-for": "1.2.3.4, 5.6.7.8" }));

    expect(response.status).toBe(200);
    const body = jest.mocked(fetch).mock.calls[0][1]?.body as URLSearchParams;
    expect(body.get("remoteip")).toBe("1.2.3.4");
    expect(await readJson(response)).toEqual({ ok: true });
  });

  test("rejects failed verification unless local bypass is enabled", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    jest.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, "error-codes": ["bad"], hostname: "app.test" })),
    );

    const failed = await turnstilePost(jsonRequest({ token: "bad" }));
    expect(failed.status).toBe(400);
    expect(await readJson(failed)).toEqual({
      error: "Turnstile verification failed.",
      codes: ["bad"],
      hostname: "app.test",
    });

    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.TURNSTILE_DEV_BYPASS = "true";
    jest.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] })),
    );

    const bypassed = await turnstilePost(jsonRequest({ token: "dev" }, { host: "localhost:3000" }));
    expect(bypassed.status).toBe(200);
    expect(await readJson(bypassed)).toMatchObject({ ok: true, bypassed: true });
  });

  test("returns a concrete error when verification request fails", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    jest.mocked(fetch).mockRejectedValueOnce(new Error("network down"));

    const response = await turnstilePost(jsonRequest({ token: "abc" }));

    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({ error: "Turnstile verification request failed." });
  });
});
