import { POST as generateImagePost } from "@/app/api/images/generate/route";
import { POST as storeFromUrlPost } from "@/app/api/images/store-from-url/route";
import { callAIImageAPI } from "@/lib/ai-image";
import { uploadToR2 } from "@/lib/r2";
import { createServerSupabaseClient } from "@/lib/supabase/server";

jest.mock("@/lib/ai-image", () => ({ callAIImageAPI: jest.fn() }));
jest.mock("@/lib/r2", () => ({ uploadToR2: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: jest.fn() }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));

function jsonRequest(body: unknown, init?: RequestInit) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
  });
}
async function readJson(response: Response) { return response.json() as Promise<Record<string, unknown>>; }

beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn(); });

describe("/api/images/generate", () => {
  function supabaseMock(user: { id: string } | null, insertError?: Error) {
    return {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: insertError ?? null }),
      }),
    };
  }

  test("generates, uploads, and stores image for authenticated users", async () => {
    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(supabaseMock({ id: "user-1" }) as never);
    jest.mocked(callAIImageAPI).mockResolvedValueOnce({ imageUrl: "https://tmp.test/image.png" });
    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1, 2]), { status: 200 }));
    jest.mocked(uploadToR2).mockResolvedValueOnce("https://cdn.test/images/test-id.png");

    const response = await generateImagePost(jsonRequest({ prompt: " fashion " }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({
      imageUrl: "https://cdn.test/images/test-id.png",
      saved: true,
    });
  });

  test("rejects missing prompt and failed image downloads", async () => {
    expect((await generateImagePost(jsonRequest({ prompt: " " }))).status).toBe(400);

    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(supabaseMock(null) as never);
    jest.mocked(callAIImageAPI).mockResolvedValueOnce({ imageUrl: "https://tmp.test/image.png" });
    jest.mocked(fetch).mockResolvedValueOnce(new Response("nope", { status: 502 }));

    const response = await generateImagePost(jsonRequest({ prompt: "fashion" }));
    expect(response.status).toBe(502);
  });

  test("returns unsaved image for anonymous users and surfaces insert errors", async () => {
    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(supabaseMock(null) as never);
    jest.mocked(callAIImageAPI).mockResolvedValueOnce({ imageUrl: "https://tmp.test/image.png" });
    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200 }));
    jest.mocked(uploadToR2).mockResolvedValueOnce("https://cdn.test/images/test-id.png");

    const anonymous = await generateImagePost(jsonRequest({ prompt: "fashion" }));
    expect(anonymous.status).toBe(200);
    expect(await readJson(anonymous)).toEqual({
      imageUrl: "https://cdn.test/images/test-id.png",
      saved: false,
    });

    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(
      supabaseMock({ id: "user-1" }, new Error("insert failed")) as never,
    );
    jest.mocked(callAIImageAPI).mockResolvedValueOnce({ imageUrl: "https://tmp.test/image.png" });
    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200 }));
    jest.mocked(uploadToR2).mockResolvedValueOnce("https://cdn.test/images/test-id.png");

    const failedInsert = await generateImagePost(jsonRequest({ prompt: "fashion" }));
    expect(failedInsert.status).toBe(500);
    expect(await readJson(failedInsert)).toEqual({ error: "insert failed" });
  });

  test("returns the generic error when generation throws a non-Error value", async () => {
    jest.mocked(createServerSupabaseClient).mockRejectedValueOnce("bad auth" as never);

    const response = await generateImagePost(jsonRequest({ prompt: "fashion" }));

    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({ error: "Generate image failed" });
  });
});
describe("/api/images/store-from-url", () => {
  function supabaseMock(user: { id: string } | null, insertError?: Error) {
    return {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user }, error: user ? null : new Error("no user") }),
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: insertError ?? null }),
      }),
    };
  }

  test("stores fetched temporary image for authenticated users", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(
      new Response(new Uint8Array([1]), { status: 200, headers: { "content-type": "image/webp" } }),
    );
    jest.mocked(uploadToR2).mockResolvedValueOnce("https://cdn.test/images/test-id.webp");
    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(supabaseMock({ id: "user-1" }) as never);

    const response = await storeFromUrlPost(
      jsonRequest({ prompt: "fashion", tempImageUrl: "https://tmp.test/image.webp" }),
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ imageUrl: "https://cdn.test/images/test-id.webp" });
  });

  test.each([
    ["image/jpeg", "https://cdn.test/images/test-id.jpg"],
    ["image/gif", "https://cdn.test/images/test-id.gif"],
    [null, "https://cdn.test/images/test-id.png"],
  ])("uses a matching extension for %s responses", async (contentType, uploadedUrl) => {
    const headers = contentType ? { "content-type": contentType } : undefined;
    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200, headers }));
    jest.mocked(uploadToR2).mockResolvedValueOnce(uploadedUrl);
    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(supabaseMock({ id: "user-1" }) as never);

    const response = await storeFromUrlPost(
      jsonRequest({ prompt: "fashion", tempImageUrl: "https://tmp.test/image" }),
    );

    expect(response.status).toBe(200);
    expect(uploadToR2).toHaveBeenCalledWith(expect.any(Buffer), uploadedUrl.replace("https://cdn.test/", ""), expect.any(String));
  });

  test("rejects bad inputs, failed downloads, and unauthenticated users", async () => {
    expect((await storeFromUrlPost(jsonRequest({ tempImageUrl: "https://x.test/a.png" }))).status).toBe(400);
    expect((await storeFromUrlPost(jsonRequest({ prompt: "x" }))).status).toBe(400);
    expect((await storeFromUrlPost(jsonRequest({ prompt: "x", tempImageUrl: "not-url" }))).status).toBe(400);
    expect((await storeFromUrlPost(jsonRequest({ prompt: "x", tempImageUrl: "ftp://x" }))).status).toBe(400);

    jest.mocked(fetch).mockResolvedValueOnce(new Response("missing", { status: 404 }));
    expect(
      (await storeFromUrlPost(jsonRequest({ prompt: "x", tempImageUrl: "https://x.test/a.png" }))).status,
    ).toBe(502);

    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200 }));
    jest.mocked(uploadToR2).mockResolvedValueOnce("https://cdn.test/a.png");
    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(supabaseMock(null) as never);
    expect(
      (await storeFromUrlPost(jsonRequest({ prompt: "x", tempImageUrl: "https://x.test/a.png" }))).status,
    ).toBe(401);

    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200 }));
    jest.mocked(uploadToR2).mockResolvedValueOnce("https://cdn.test/a.png");
    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(
      supabaseMock({ id: "user-1" }, new Error("insert failed")) as never,
    );
    const failedInsert = await storeFromUrlPost(jsonRequest({ prompt: "x", tempImageUrl: "https://x.test/a.png" }));
    expect(failedInsert.status).toBe(500);
    expect(await readJson(failedInsert)).toEqual({ error: "insert failed" });
  });

  test("returns the generic error when storage throws a non-Error value", async () => {
    jest.mocked(fetch).mockRejectedValueOnce("network failed" as never);

    const response = await storeFromUrlPost(jsonRequest({ prompt: "x", tempImageUrl: "https://x.test/a.png" }));

    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({ error: "Store image failed" });
  });
});
