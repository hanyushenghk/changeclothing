import { detectGarmentCategory } from "@/lib/detect-garment";

const originalEnv = process.env;
function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), { status: init?.status ?? 200, headers: { "Content-Type": "application/json" } });
}
beforeEach(() => { process.env = { ...originalEnv }; global.fetch = jest.fn(); });
afterEach(() => { process.env = originalEnv; jest.restoreAllMocks(); });

describe("detectGarmentCategory", () => {
  test("throws when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(
      detectGarmentCategory({ garmentBytes: Buffer.from("shirt"), mimeType: "image/png" }),
    ).rejects.toThrow("Missing GEMINI_API_KEY for garment detection.");
  });

  test("returns Gemini category and source", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "lower body pants" }] } }] }),
    );

    await expect(
      detectGarmentCategory({ garmentBytes: Buffer.from("pants"), mimeType: "image/png" }),
    ).resolves.toEqual({ category: "lower_body", source: "gemini" });
  });

  test("throws on Gemini API failure", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    jest.mocked(fetch).mockResolvedValueOnce(new Response("quota exceeded", { status: 429 }));

    await expect(
      detectGarmentCategory({ garmentBytes: Buffer.from("shirt"), mimeType: "image/png" }),
    ).rejects.toThrow("Gemini garment detection failed with status 429: quota exceeded");
  });

  test("fails when Gemini returns no category text", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({}));

    await expect(
      detectGarmentCategory({ garmentBytes: Buffer.from("shirt"), mimeType: "image/png" }),
    ).rejects.toThrow("Unknown garment category from model");
  });
});
