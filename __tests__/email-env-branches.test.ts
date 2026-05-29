const originalEnv = process.env;

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function loadEmailModule() {
  jest.resetModules();
  const send = jest.fn();
  jest.doMock("resend", () => ({
    Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
  }));
  jest.doMock("@/lib/supabase/admin", () => ({
    createAdminSupabaseClient: jest.fn().mockReturnValue({
      auth: {
        admin: {
          listUsers: jest.fn().mockResolvedValue({ data: {}, error: null }),
        },
      },
    }),
  }));

  return {
    send,
    module: await import("@/lib/email"),
  };
}

beforeEach(() => {
  process.env = {
    ...originalEnv,
    RESEND_API_KEY: "resend",
    WELCOME_EMAIL_FROM: " Welcome <welcome@example.com> ",
    WELCOME_EMAIL_REPLY_TO: " reply@example.com ",
    DAILY_LETTER_FROM: " Daily <daily@example.com> ",
    DAILY_LETTER_REPLY_TO: " daily-reply@example.com ",
    NEXT_PUBLIC_APP_URL: " https://app.example.com ",
    GEMINI_API_KEY: "gemini",
    DAILY_LOVE_MODEL: " gemini-custom ",
  };
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = originalEnv;
  jest.dontMock("resend");
  jest.dontMock("@/lib/supabase/admin");
  jest.restoreAllMocks();
});

describe("email environment branches", () => {
  test("uses configured email senders, app URL, and Gemini model", async () => {
    const { module, send } = await loadEmailModule();
    send.mockResolvedValue({ data: { id: "sent" }, error: null });

    await expect(module.sendWelcomeEmail("ada@example.com", "Ada")).resolves.toEqual({ id: "sent" });
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({
      from: "Welcome <welcome@example.com>",
      replyTo: "reply@example.com",
    }));

    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "Hello Ada" }] } }] }),
    );
    await expect(module.sendDailyLoveLetter("ada@example.com", "Ada")).resolves.toEqual({ id: "sent" });
    expect(jest.mocked(fetch).mock.calls[0][0]).toContain("gemini-custom");
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({
      from: "Daily <daily@example.com>",
      replyTo: "daily-reply@example.com",
      html: expect.stringContaining("https://app.example.com"),
    }));
  });

  test("handles missing auth user arrays", async () => {
    const { module } = await loadEmailModule();

    await expect(module.sendDailyLoveLetterToAll()).resolves.toEqual({
      total: 0,
      sent: 0,
      failed: 0,
    });
  });
});

export {};
