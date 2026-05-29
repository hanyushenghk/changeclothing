import { POST as generateImagePost } from "@/app/api/images/generate/route";
import { POST as storeFromUrlPost } from "@/app/api/images/store-from-url/route";
import { callAIImageAPI } from "@/lib/ai-image";
import { uploadToR2 } from "@/lib/r2";
import { createServerSupabaseClient } from "@/lib/supabase/server";

jest.mock("@/lib/ai-image", () => ({ callAIImageAPI: jest.fn() }));
jest.mock("@/lib/r2", () => ({ uploadToR2: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: jest.fn() }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));

function jsonRequest(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("/api/images/generate branch coverage", () => {
  function supabaseMock(user: { id: string } | null, userError: Error | null = null) {
    return {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user }, error: userError }),
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    };
  }

  test("accepts bearer auth and ignores non-bearer auth headers", async () => {
    const authed = supabaseMock({ id: "user-1" });
    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(authed as never);
    jest.mocked(callAIImageAPI).mockResolvedValueOnce({ imageUrl: "https://tmp.test/image.png" });
    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200 }));
    jest.mocked(uploadToR2).mockResolvedValueOnce("https://cdn.test/images/test-id.png");

    expect(
      await readJson(await generateImagePost(jsonRequest({ prompt: "fashion" }, { authorization: "Bearer token" }))),
    ).toMatchObject({ saved: true });
    expect(authed.auth.getUser).toHaveBeenCalledWith("token");

    const anonymous = supabaseMock(null, new Error("no user"));
    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(anonymous as never);
    jest.mocked(callAIImageAPI).mockResolvedValueOnce({ imageUrl: "https://tmp.test/image.png" });
    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200 }));
    jest.mocked(uploadToR2).mockResolvedValueOnce("https://cdn.test/images/test-id.png");

    expect(
      await readJson(await generateImagePost(jsonRequest({ prompt: "fashion" }, { authorization: "Token token" }))),
    ).toMatchObject({ saved: false });
    expect(anonymous.auth.getUser).toHaveBeenCalledWith();
  });

  test("rejects undefined prompts and surfaces Error instances", async () => {
    expect((await generateImagePost(jsonRequest({}))).status).toBe(400);

    jest.mocked(createServerSupabaseClient).mockResolvedValueOnce(supabaseMock(null) as never);
    jest.mocked(callAIImageAPI).mockRejectedValueOnce(new Error("provider down"));

    const response = await generateImagePost(jsonRequest({ prompt: "fashion" }));

    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({ error: "provider down" });
  });
});

describe("/api/images/store-from-url branch coverage", () => {
  test("surfaces Error instances from storage failures", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200 }));
    jest.mocked(uploadToR2).mockRejectedValueOnce(new Error("R2 down"));

    const response = await storeFromUrlPost(
      jsonRequest({ prompt: "fashion", tempImageUrl: "https://tmp.test/image.png" }),
    );

    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({ error: "R2 down" });
  });
});
