import { categoryLabel } from "@/lib/category-labels";
import { normalizeCategoryLabel } from "@/lib/garment-category";
import { getSiteUrl } from "@/lib/site-url";
import { usernameToAuthEmail } from "@/lib/auth/username-email";
import { appendHistory, deleteHistoryEntry, loadHistory, saveHistory } from "@/lib/history-storage";
import { buildDailyLoveLetterPrompt } from "@/prompts/daily-love-letter";
import { GARMENT_DETECTION_PROMPT } from "@/prompts/garment-detection";
import { buildTryOnPrompt } from "@/prompts/try-on";

const originalEnv = process.env;
const localStorageMock = (() => {
  let store = new Map<string, string>();

  return {
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
})();

beforeEach(() => {
  process.env = { ...originalEnv };
  Object.defineProperty(global, "window", {
    configurable: true,
    value: { localStorage: localStorageMock },
  });
  localStorageMock.clear();
  jest.spyOn(crypto, "randomUUID").mockReturnValue("history-id");
  jest.useFakeTimers().setSystemTime(new Date("2026-05-29T10:00:00.000Z"));
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("site URL", () => {
  test("uses NEXT_PUBLIC_SITE_URL without trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";

    expect(getSiteUrl()).toBe("https://example.com");
  });

  test("uses Vercel URL when public site URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = "changeclothing.vercel.app/";

    expect(getSiteUrl()).toBe("https://changeclothing.vercel.app");
  });

  test("falls back to localhost", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("garment category parsing", () => {
  test.each([
    ["dresses", "dresses"],
    ["lower body pants", "lower_body"],
    ["top shirt", "upper_body"],
  ] as const)("normalizes %s", (raw, category) => {
    expect(normalizeCategoryLabel(raw)).toBe(category);
  });

  test("throws on unknown category output", () => {
    expect(() => normalizeCategoryLabel("hat")).toThrow("Unknown garment category from model: hat");
  });

  test("localizes category labels", () => {
    expect(categoryLabel("upper_body", "en")).toBe("Upper body");
    expect(categoryLabel("lower_body", "zh")).toBe("下装");
    expect(categoryLabel("dresses", "zh")).toBe("连衣裙");
  });
});

describe("username auth email", () => {
  test("normalizes username before hashing", async () => {
    await expect(usernameToAuthEmail("  JaneSmith  ")).resolves.toMatch(/^[a-f0-9]{64}@gmail\.com$/);
    await expect(usernameToAuthEmail("janesmith")).resolves.toBe(await usernameToAuthEmail("  JaneSmith  "));
  });
});

describe("history storage", () => {
  test("returns empty history when storage is empty or malformed", () => {
    expect(loadHistory()).toEqual([]);
    localStorageMock.setItem("changeclothing-history-v1", "{bad json");
    expect(loadHistory()).toEqual([]);
    localStorageMock.setItem("changeclothing-history-v1", JSON.stringify({ id: "not-array" }));
    expect(loadHistory()).toEqual([]);
  });

  test("filters invalid rows, saves, appends, caps, and deletes valid entries", () => {
    saveHistory([
      null as never,
      { id: "bad" } as never,
      {
        id: "old",
        createdAt: "2026-05-28T00:00:00.000Z",
        category: "upper_body",
        resultDataUrl: "data:image/png;base64,old",
      },
    ]);

    const next = appendHistory({
      category: "dresses",
      resultDataUrl: "data:image/png;base64,new",
    });

    expect(next[0]).toEqual({
      id: "history-id",
      createdAt: "2026-05-29T10:00:00.000Z",
      category: "dresses",
      resultDataUrl: "data:image/png;base64,new",
    });
    expect(deleteHistoryEntry("history-id")).toHaveLength(1);
  });

  test("does nothing without a browser window", () => {
    Reflect.deleteProperty(global, "window");

    expect(loadHistory()).toEqual([]);
    expect(() => saveHistory([])).not.toThrow();
  });
});

describe("prompts", () => {
  test("builds versioned prompt text for each AI flow", () => {
    expect(GARMENT_DETECTION_PROMPT).toContain("upper_body");
    expect(buildTryOnPrompt("dresses")).toContain("连衣裙");
    expect(buildDailyLoveLetterPrompt("Ada")).toContain("Ada");
  });
});
