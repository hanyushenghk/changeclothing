import { generateTryOnImage } from "@/lib/tryon-generate";

const originalEnv = process.env;
function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), { status: init?.status ?? 200, headers: { "Content-Type": "application/json" } });
}
beforeEach(() => { process.env = { ...originalEnv }; global.fetch = jest.fn(); });
afterEach(() => { process.env = originalEnv; jest.restoreAllMocks(); });

describe("generateTryOnImage", () => {
  const input = {
    personBytes: Buffer.from("person"),
    personMime: "image/png",
    garmentBytes: Buffer.from("garment"),
    garmentMime: "image/png",
    category: "upper_body" as const,
  };

  test("throws when ARK_API_KEY is missing", async () => {
    delete process.env.ARK_API_KEY;

    await expect(generateTryOnImage(input)).rejects.toThrow("Missing ARK_API_KEY for try-on generation.");
  });

  test("returns base64 directly when provider returns b64_json", async () => {
    process.env.ARK_API_KEY = "ark-key";
    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [{ b64_json: "base64-image" }] }));

    await expect(generateTryOnImage(input)).resolves.toEqual({
      imageBase64: "base64-image",
      mimeType: "image/png",
      mode: "doubao",
    });
  });

  test("downloads provider URL output", async () => {
    process.env.ARK_API_KEY = "ark-key";
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: [{ url: "https://img.test/out.png" }] }))
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "image/webp" },
        }),
      );

    await expect(generateTryOnImage(input)).resolves.toEqual({
      imageBase64: Buffer.from([1, 2, 3]).toString("base64"),
      mimeType: "image/webp",
      mode: "doubao",
    });
  });

  test("throws on provider failure or empty output", async () => {
    process.env.ARK_API_KEY = "ark-key";
    jest.mocked(fetch).mockResolvedValueOnce(new Response("bad", { status: 500 }));

    await expect(generateTryOnImage(input)).rejects.toThrow("Doubao generation failed with status 500: bad");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }));

    await expect(generateTryOnImage(input)).rejects.toThrow("Doubao returned no image data");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse(null));

    await expect(generateTryOnImage(input)).rejects.toThrow("Doubao returned no image data");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [null] }));

    await expect(generateTryOnImage(input)).rejects.toThrow("Doubao returned no image data");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [{}] }));

    await expect(generateTryOnImage(input)).rejects.toThrow("Doubao returned no image data");
  });

  test("throws when downloaded provider image fails", async () => {
    process.env.ARK_API_KEY = "ark-key";
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: [{ url: "https://img.test/out.png" }] }))
      .mockResolvedValueOnce(new Response("missing", { status: 404 }));

    await expect(generateTryOnImage(input)).rejects.toThrow(
      "Failed to download Doubao output from https://img.test/out.png: 404",
    );
  });
});
