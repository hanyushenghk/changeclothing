import { generateLoveLetter, sendDailyLoveLetter, sendDailyLoveLetterToAll, sendWelcomeEmail } from "@/lib/email";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => {
    const send = jest.fn();
    (globalThis as unknown as { __mockResendSend: jest.Mock }).__mockResendSend = send;
    return { emails: { send } };
  }),
}));
jest.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: jest.fn() }));

const originalEnv = process.env;
function resendSendMock() { return (globalThis as unknown as { __mockResendSend: jest.Mock }).__mockResendSend; }
function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), { status: init?.status ?? 200, headers: { "Content-Type": "application/json" } });
}
beforeEach(() => { process.env = { ...originalEnv }; global.fetch = jest.fn(); resendSendMock().mockReset(); });
afterEach(() => { process.env = originalEnv; jest.restoreAllMocks(); });

describe("generateLoveLetter", () => {
  test("throws when Gemini key is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(generateLoveLetter("Ada")).rejects.toThrow("Missing GEMINI_API_KEY");
  });

  test("returns model text and throws on empty response", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "Good morning, Ada." }] } }] }),
    );

    await expect(generateLoveLetter("Ada")).resolves.toBe("Good morning, Ada.");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ candidates: [] }));

    await expect(generateLoveLetter("Ada")).rejects.toThrow("Gemini returned empty daily love letter");
  });

  test("throws when Gemini returns a failed status", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    jest.mocked(fetch).mockResolvedValueOnce(new Response("bad", { status: 503 }));

    await expect(generateLoveLetter("Ada")).rejects.toThrow(
      "Gemini request failed with status 503 for userName Ada.",
    );
  });
});
describe("email sending", () => {
  test("sends welcome email and throws on provider error", async () => {
    resendSendMock().mockResolvedValueOnce({ data: { id: "welcome-1" }, error: null });

    await expect(sendWelcomeEmail("ada@example.com", "Ada")).resolves.toEqual({ id: "welcome-1" });
    expect(resendSendMock()).toHaveBeenCalledWith(expect.objectContaining({
      to: "ada@example.com",
      subject: "Welcome to Paper Plane",
    }));

    resendSendMock().mockResolvedValueOnce({ data: null, error: { message: "provider down" } });

    await expect(sendWelcomeEmail("ada@example.com", "Ada")).rejects.toThrow(
      "Resend send failed: provider down",
    );
  });

  test("sends daily love letter", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "Good morning." }] } }] }),
    );
    resendSendMock().mockResolvedValueOnce({ data: { id: "daily-1" }, error: null });

    await expect(sendDailyLoveLetter("ada@example.com", "Ada")).resolves.toEqual({ id: "daily-1" });
    expect(resendSendMock()).toHaveBeenCalledWith(expect.objectContaining({
      to: "ada@example.com",
      subject: "Good morning Ada, thinking of you today",
    }));
  });

  test("sends daily love letters to all auth users and tracks failures", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    jest.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ candidates: [{ content: { parts: [{ text: "One" }] } }] }))
      .mockResolvedValueOnce(jsonResponse({ candidates: [{ content: { parts: [{ text: "Two" }] } }] }));
    resendSendMock()
      .mockResolvedValueOnce({ data: { id: "one" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "send failed" } });
    jest.mocked(createAdminSupabaseClient).mockReturnValueOnce({
      auth: {
        admin: {
          listUsers: jest.fn()
            .mockResolvedValueOnce({
              data: {
                users: [
                  { email: "one@example.com", user_metadata: { name: "One" } },
                  { email: "two@example.com", user_metadata: { userid: "Two" } },
                  { email: null, user_metadata: {} },
                ],
              },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { users: [] },
              error: null,
            }),
        },
      },
    } as never);

    await expect(sendDailyLoveLetterToAll()).resolves.toEqual({
      total: 2,
      sent: 1,
      failed: 1,
    });
  });

  test("falls back to friend name and continues to the next auth page", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    const fullPage = Array.from({ length: 200 }, (_, index) => ({
      email: index === 0 ? "@example.com" : null,
      user_metadata: {},
    }));
    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "Hello friend" }] } }] }),
    );
    resendSendMock().mockResolvedValueOnce({ data: { id: "friend" }, error: null });
    jest.mocked(createAdminSupabaseClient).mockReturnValueOnce({
      auth: {
        admin: {
          listUsers: jest.fn()
            .mockResolvedValueOnce({
              data: { users: fullPage },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { users: [] },
              error: null,
            }),
        },
      },
    } as never);

    await expect(sendDailyLoveLetterToAll()).resolves.toEqual({
      total: 1,
      sent: 1,
      failed: 0,
    });
    expect(resendSendMock()).toHaveBeenCalledWith(expect.objectContaining({
      subject: "Good morning friend, thinking of you today",
    }));
  });

  test("fails fast when auth users cannot be loaded", async () => {
    jest.mocked(createAdminSupabaseClient).mockReturnValueOnce({
      auth: {
        admin: {
          listUsers: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { message: "auth unavailable" },
          }),
        },
      },
    } as never);

    await expect(sendDailyLoveLetterToAll()).rejects.toThrow("Load auth users failed: auth unavailable");
  });
});
