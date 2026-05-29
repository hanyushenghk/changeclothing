const originalEnv = process.env;

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

async function loadEmailModuleWithSend(send: jest.Mock) {
  jest.resetModules();
  jest.doMock("resend", () => ({
    Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
  }));

  return import("@/lib/email");
}

beforeEach(() => {
  process.env = {
    ...originalEnv,
    RESEND_API_KEY: "resend",
    GEMINI_API_KEY: "gemini",
  };
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = originalEnv;
  jest.dontMock("resend");
  jest.dontMock("@/lib/supabase/admin");
  jest.restoreAllMocks();
});

describe("email error branches", () => {
  test("handles missing user metadata and non-Error send failures", async () => {
    const send = jest.fn().mockRejectedValue("provider string failure");
    jest.doMock("@/lib/supabase/admin", () => ({
      createAdminSupabaseClient: jest.fn().mockReturnValue({
        auth: {
          admin: {
            listUsers: jest.fn().mockResolvedValue({
              data: { users: [{ email: "ada@example.com" }] },
              error: null,
            }),
          },
        },
      }),
    }));
    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "Hello Ada" }] } }] }),
    );
    const email = await loadEmailModuleWithSend(send);

    await expect(email.sendDailyLoveLetterToAll()).resolves.toEqual({
      total: 1,
      sent: 0,
      failed: 1,
    });
  });
});

export {};
