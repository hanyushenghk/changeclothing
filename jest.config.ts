import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "lib/ai-image.ts",
    "lib/auth/username-email.ts",
    "lib/category-labels.ts",
    "lib/detect-garment.ts",
    "lib/email.ts",
    "lib/garment-category.ts",
    "lib/history-storage.ts",
    "lib/site-url.ts",
    "lib/tryon-generate.ts",
    "context/try-on-api-client.ts",
    "prompts/**/*.{ts,tsx}",
    "app/api/auth/forgot-password/route.ts",
    "app/api/auth/send-welcome-email/route.ts",
    "app/api/cron/daily-email/route.ts",
    "app/api/cron/daily-love-letter/route.ts",
    "app/api/detect-category/route.ts",
    "app/api/images/generate/route.ts",
    "app/api/images/store-from-url/route.ts",
    "app/api/turnstile/verify/route.ts",
    "app/api/try-on/route.ts",
    "app/auth/callback/route.ts",
  ],
  coverageProvider: "v8",
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "node",
};

export default createJestConfig(config);
