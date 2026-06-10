import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("CI workflow Firebase secret lanes", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

  it("uses CI-specific Firebase secrets for E2E while preserving runtime env names", () => {
    expect(workflow).toContain("secrets.CI_FIREBASE_SERVICE_ACCOUNT_BASE64");
    expect(workflow).toContain("secrets.CI_FIREBASE_API_KEY");
    expect(workflow).toContain("secrets.CI_FIREBASE_PROJECT_ID");
    expect(workflow).toContain("secrets.CI_FIREBASE_APP_ID");

    expect(workflow).toContain("FIREBASE_SERVICE_ACCOUNT_BASE64:");
    expect(workflow).toContain("VITE_FIREBASE_API_KEY:");
    expect(workflow).toContain("VITE_FIREBASE_PROJECT_ID:");
    expect(workflow).toContain("VITE_FIREBASE_APP_ID:");
  });

  it("does not use production Firebase secret names for E2E", () => {
    expect(workflow).not.toContain("secrets.FIREBASE_SERVICE_ACCOUNT_BASE64");
    expect(workflow).not.toContain("secrets.VITE_FIREBASE_API_KEY");
    expect(workflow).not.toContain("secrets.VITE_FIREBASE_PROJECT_ID");
    expect(workflow).not.toContain("secrets.VITE_FIREBASE_APP_ID");
  });
});
