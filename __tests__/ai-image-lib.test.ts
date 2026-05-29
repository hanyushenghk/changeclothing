import { callAIImageAPI } from "@/lib/ai-image";

const originalEnv = process.env;
function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), { status: init?.status ?? 200, headers: { "Content-Type": "application/json" } });
}
beforeEach(() => { process.env = { ...originalEnv }; global.fetch = jest.fn(); });
afterEach(() => { process.env = originalEnv; jest.restoreAllMocks(); });

describe("callAIImageAPI", () => {
  test("throws when ARK_API_KEY is missing", async () => {
    delete process.env.ARK_API_KEY;

    await expect(callAIImageAPI("fashion portrait")).rejects.toThrow("Missing ARK_API_KEY.");
  });

  test("returns generated image URL", async () => {
    process.env.ARK_API_KEY = "ark-key";
    process.env.AI_IMAGE_MODEL = " ";
    process.env.DOUBAO_MODEL = "custom-doubao";
    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [{ url: "https://img.test/a.png" }] }));

    await expect(callAIImageAPI("fashion portrait")).resolves.toEqual({
      imageUrl: "https://img.test/a.png",
    });
    expect(JSON.parse(jest.mocked(fetch).mock.calls[0][1]?.body as string).model).toBe("custom-doubao");
  });

  test("maps sensitive prompt errors and empty API output", async () => {
    process.env.ARK_API_KEY = "ark-key";
    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "InputTextSensitiveContentDetected", message: "sensitive" } },
        { status: 400 },
      ),
    );

    await expect(callAIImageAPI("bad prompt")).rejects.toThrow("提示词触发内容安全策略");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }));

    await expect(callAIImageAPI("ok prompt")).rejects.toThrow("AI image API returned no image URL.");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse(null));

    await expect(callAIImageAPI("ok prompt")).rejects.toThrow("AI image API returned no image URL.");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [null] }));

    await expect(callAIImageAPI("ok prompt")).rejects.toThrow("AI image API returned no image URL.");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [{ url: 123 }] }));

    await expect(callAIImageAPI("ok prompt")).rejects.toThrow("AI image API returned no image URL.");
  });

  test("uses raw provider error text when JSON parsing fails", async () => {
    process.env.ARK_API_KEY = "ark-key";
    jest.mocked(fetch).mockResolvedValueOnce(new Response("plain failure", { status: 500 }));

    await expect(callAIImageAPI("prompt")).rejects.toThrow(
      "AI image generation failed: 500 plain failure",
    );
  });
});
