import { generateTryOnImage } from "@/lib/tryon-generate";

const originalEnv = process.env;

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  process.env = {
    ...originalEnv,
    ARK_API_KEY: "ark",
    DOUBAO_MODEL: " ",
    AI_IMAGE_MODEL: "ai-image-model",
  };
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe("generateTryOnImage model branches", () => {
  test("falls back from blank Doubao model to AI image model and default download mime", async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: [{ url: "https://img.test/out.png" }] }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));

    await expect(
      generateTryOnImage({
        personBytes: Buffer.from("person"),
        personMime: "image/png",
        garmentBytes: Buffer.from("garment"),
        garmentMime: "image/png",
        category: "upper_body",
      }),
    ).resolves.toMatchObject({
      mimeType: "image/png",
      mode: "doubao",
    });

    expect(JSON.parse(jest.mocked(fetch).mock.calls[0][1]?.body as string).model).toBe("ai-image-model");
  });
});
