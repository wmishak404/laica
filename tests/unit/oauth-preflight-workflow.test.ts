import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("OAuth preflight workflow", () => {
  const workflow = readFileSync(".github/workflows/oauth-start-preflight.yml", "utf8");

  it("runs by manual dispatch and scheduled canary with required config", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain('cron: "17 11 * * *"');
    expect(workflow).toContain('OAUTH_PREFLIGHT_REQUIRED: "true"');
    expect(workflow).not.toMatch(
      /google_oauth_start:[\s\S]{0,300}\n\s+if:\s*\$\{\{[\s\S]*OAUTH_PREFLIGHT_CONTINUE_URIS/,
    );
  });

  it("keeps provider diagnostics out of public GitHub logs", () => {
    expect(workflow).not.toContain("OAUTH_PREFLIGHT_LOG_PROVIDER_ERROR");
    expect(workflow).toContain("secrets.OAUTH_PREFLIGHT_CONTINUE_URIS");
    expect(workflow).not.toContain("vars.OAUTH_PREFLIGHT_CONTINUE_URIS");
  });
});
