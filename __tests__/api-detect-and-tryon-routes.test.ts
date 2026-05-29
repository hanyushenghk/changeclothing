import { POST as detectCategoryPost } from "@/app/api/detect-category/route";
import { POST as tryOnPost } from "@/app/api/try-on/route";
import { detectGarmentCategory } from "@/lib/detect-garment";
import { generateTryOnImage } from "@/lib/tryon-generate";

jest.mock("@/lib/detect-garment", () => ({ detectGarmentCategory: jest.fn() }));
jest.mock("@/lib/tryon-generate", () => ({ generateTryOnImage: jest.fn() }));

function formRequest(form: FormData) { return new Request("http://localhost/api", { method: "POST", body: form }); }
async function readJson(response: Response) { return response.json() as Promise<Record<string, unknown>>; }

beforeEach(() => { jest.clearAllMocks(); });

describe("/api/detect-category", () => {
  test("returns detected category for a valid garment image", async () => {
    jest.mocked(detectGarmentCategory).mockResolvedValueOnce({
      category: "dresses",
      source: "gemini",
    });
    const form = new FormData();
    form.set("garment", new File(["dress"], "dress.png", { type: "image/png" }));
    form.set("locale", "zh");

    const response = await detectCategoryPost(formRequest(form));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({
      category: "dresses",
      label: "连衣裙",
      source: "gemini",
    });
  });

  test("defaults unsupported locales to English labels", async () => {
    jest.mocked(detectGarmentCategory).mockResolvedValueOnce({
      category: "upper_body",
      source: "gemini",
    });
    const form = new FormData();
    form.set("garment", new File(["shirt"], "shirt.png", { type: "image/png" }));
    form.set("locale", "fr");

    const response = await detectCategoryPost(formRequest(form));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({ label: "Upper body" });
  });

  test("rejects missing file, unsupported mime, oversized file, and detector errors", async () => {
    expect((await detectCategoryPost(formRequest(new FormData()))).status).toBe(400);

    const wrongMime = new FormData();
    wrongMime.set("garment", new File(["x"], "x.txt", { type: "text/plain" }));
    expect((await detectCategoryPost(formRequest(wrongMime))).status).toBe(400);

    const tooLarge = new FormData();
    tooLarge.set("garment", new File([new Uint8Array(12 * 1024 * 1024 + 1)], "x.png", { type: "image/png" }));
    expect((await detectCategoryPost(formRequest(tooLarge))).status).toBe(400);

    jest.mocked(detectGarmentCategory).mockRejectedValueOnce(new Error("Gemini down"));
    const valid = new FormData();
    valid.set("garment", new File(["x"], "x.png", { type: "image/png" }));
    const response = await detectCategoryPost(formRequest(valid));
    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({ error: "Gemini down" });
  });
});
describe("/api/try-on", () => {
  test("returns generated image for valid inputs", async () => {
    jest.mocked(generateTryOnImage).mockResolvedValueOnce({
      imageBase64: "abc",
      mimeType: "image/png",
      mode: "doubao",
    });
    const form = new FormData();
    form.set("person", new File(["p"], "person.png", { type: "image/png" }));
    form.set("garment", new File(["g"], "garment.png", { type: "image/png" }));
    form.set("category", "upper_body");

    const response = await tryOnPost(formRequest(form));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({
      imageBase64: "abc",
      mimeType: "image/png",
      mode: "doubao",
    });
  });

  test("rejects invalid request shapes and generation errors", async () => {
    expect((await tryOnPost(formRequest(new FormData()))).status).toBe(400);

    const invalidCategory = new FormData();
    invalidCategory.set("person", new File(["p"], "p.png", { type: "image/png" }));
    invalidCategory.set("garment", new File(["g"], "g.png", { type: "image/png" }));
    invalidCategory.set("category", "hat");
    expect((await tryOnPost(formRequest(invalidCategory))).status).toBe(400);

    const wrongMime = new FormData();
    wrongMime.set("person", new File(["p"], "p.txt", { type: "text/plain" }));
    wrongMime.set("garment", new File(["g"], "g.png", { type: "image/png" }));
    wrongMime.set("category", "dresses");
    expect((await tryOnPost(formRequest(wrongMime))).status).toBe(400);

    const tooLarge = new FormData();
    tooLarge.set("person", new File([new Uint8Array(15 * 1024 * 1024 + 1)], "p.png", { type: "image/png" }));
    tooLarge.set("garment", new File(["g"], "g.png", { type: "image/png" }));
    tooLarge.set("category", "dresses");
    expect((await tryOnPost(formRequest(tooLarge))).status).toBe(400);

    jest.mocked(generateTryOnImage).mockRejectedValueOnce(new Error("Doubao failed"));
    const valid = new FormData();
    valid.set("person", new File(["p"], "p.png", { type: "image/png" }));
    valid.set("garment", new File(["g"], "g.png", { type: "image/png" }));
    valid.set("category", "dresses");
    const response = await tryOnPost(formRequest(valid));
    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({ error: "Doubao failed" });
  });
});
