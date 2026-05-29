import { detectGarmentFile, generateTryOnPreview } from "@/context/try-on-api-client";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("detectGarmentFile", () => {
  test("posts garment file and returns detected category", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ category: "upper_body", source: "gemini" }),
    );

    await expect(detectGarmentFile(new File(["x"], "shirt.png", { type: "image/png" }), "en"))
      .resolves.toEqual({ category: "upper_body", source: "gemini" });

    expect(fetch).toHaveBeenCalledWith("/api/detect-category", expect.objectContaining({ method: "POST" }));

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ category: "dresses" }));

    await expect(detectGarmentFile(new File(["x"], "dress.png", { type: "image/png" }), "en"))
      .resolves.toEqual({ category: "dresses", source: "gemini" });
  });

  test("throws server error message", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: "bad image" }, { status: 400 }));

    await expect(detectGarmentFile(new File(["x"], "bad.txt"), "en")).rejects.toThrow("bad image");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, { status: 400 }));

    await expect(detectGarmentFile(new File(["x"], "bad.txt"), "en")).rejects.toThrow(
      "Failed to classify garment.",
    );
  });

  test("throws when response has no category", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ source: "gemini" }));

    await expect(detectGarmentFile(new File(["x"], "shirt.png"), "en")).rejects.toThrow(
      "Missing category from server.",
    );
  });
});

describe("generateTryOnPreview", () => {
  test("returns a data URL for a valid try-on response", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ imageBase64: "abc", mimeType: "image/png", mode: "doubao" }),
    );

    await expect(
      generateTryOnPreview({
        personFile: new File(["p"], "person.png", { type: "image/png" }),
        garmentFile: new File(["g"], "garment.png", { type: "image/png" }),
        category: "upper_body",
      }),
    ).resolves.toEqual({ dataUrl: "data:image/png;base64,abc" });
  });

  test("throws on failed response and malformed success", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: "try-on failed" }, { status: 500 }));

    await expect(
      generateTryOnPreview({
        personFile: new File(["p"], "person.png"),
        garmentFile: new File(["g"], "garment.png"),
        category: "dresses",
      }),
    ).rejects.toThrow("try-on failed");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, { status: 500 }));

    await expect(
      generateTryOnPreview({
        personFile: new File(["p"], "person.png"),
        garmentFile: new File(["g"], "garment.png"),
        category: "dresses",
      }),
    ).rejects.toThrow("Try-on failed.");

    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse({ imageBase64: "abc" }));

    await expect(
      generateTryOnPreview({
        personFile: new File(["p"], "person.png"),
        garmentFile: new File(["g"], "garment.png"),
        category: "dresses",
      }),
    ).rejects.toThrow("Malformed try-on response.");
  });
});
