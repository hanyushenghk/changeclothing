import { POST as welcomeEmailPost } from "@/app/api/auth/send-welcome-email/route";
import { sendWelcomeEmail } from "@/lib/email";

jest.mock("@/lib/email", () => ({ sendWelcomeEmail: jest.fn() }));

function jsonRequest(body: unknown, init?: RequestInit) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
  });
}
async function readJson(response: Response) { return response.json() as Promise<Record<string, unknown>>; }

beforeEach(() => { jest.clearAllMocks(); });

describe("/api/auth/send-welcome-email", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  test("validates input and skips when Resend is not configured", async () => {
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;

    expect((await welcomeEmailPost(jsonRequest({ email: "", name: "" }))).status).toBe(400);

    const response = await welcomeEmailPost(jsonRequest({ email: "a@example.com", name: "Ada" }));
    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({ ok: true, skipped: true });
  });

  test("sends welcome email and surfaces send errors", async () => {
    process.env = { ...originalEnv, RESEND_API_KEY: "resend-key" };
    jest.mocked(sendWelcomeEmail).mockResolvedValueOnce({ id: "email-1" } as never);

    const ok = await welcomeEmailPost(jsonRequest({ email: "A@EXAMPLE.COM", name: " Ada " }));
    expect(await readJson(ok)).toEqual({ ok: true, id: "email-1" });

    jest.mocked(sendWelcomeEmail).mockResolvedValueOnce(null as never);
    const noId = await welcomeEmailPost(jsonRequest({ email: "a@example.com", name: "Ada" }));
    expect(await readJson(noId)).toEqual({ ok: true, id: null });

    jest.mocked(sendWelcomeEmail).mockRejectedValueOnce(new Error("Resend failed"));
    const fail = await welcomeEmailPost(jsonRequest({ email: "a@example.com", name: "Ada" }));
    expect(fail.status).toBe(500);
    expect(await readJson(fail)).toEqual({ error: "Resend failed" });

    jest.mocked(sendWelcomeEmail).mockRejectedValueOnce("unknown failure" as never);
    const nonErrorFail = await welcomeEmailPost(jsonRequest({ email: "a@example.com", name: "Ada" }));
    expect(nonErrorFail.status).toBe(500);
    expect(await readJson(nonErrorFail)).toEqual({ error: "发送欢迎邮件失败。" });
  });
});
