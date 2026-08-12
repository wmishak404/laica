import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("dependency security automation", () => {
  const dependabot = readFileSync(".github/dependabot.yml", "utf8");
  const dependencyAudit = readFileSync(
    ".github/workflows/dependency-audit.yml",
    "utf8",
  );
  const secretScan = readFileSync(".github/workflows/secret-scan.yml", "utf8");

  it("pins TruffleHog immutably and keeps every scanner version aligned", () => {
    const actionPins = Array.from(
      secretScan.matchAll(
        /uses:\s*trufflesecurity\/trufflehog@([0-9a-f]{40})\s+#\s+v(\d+\.\d+\.\d+)/g,
      ),
      (match) => ({ sha: match[1], version: match[2] }),
    );
    const scannerVersions = Array.from(
      secretScan.matchAll(/^\s+version:\s*"(\d+\.\d+\.\d+)"\s*$/gm),
      (match) => match[1],
    );

    expect(actionPins).toHaveLength(2);
    expect(new Set(actionPins.map(({ sha }) => sha)).size).toBe(1);
    expect(scannerVersions).toEqual(
      actionPins.map(({ version }) => version),
    );
  });

  it("audits the current lockfile daily and on demand", () => {
    expect(dependencyAudit).toContain("schedule:");
    expect(dependencyAudit).toContain('cron: "41 10 * * *"');
    expect(dependencyAudit).toContain("workflow_dispatch:");
    expect(dependencyAudit).toContain("npm audit --audit-level=high");
  });

  it("opens npm security updates without routine npm version churn", () => {
    const npmConfig = dependabot.split(
      '  - package-ecosystem: "github-actions"',
    )[0];

    expect(npmConfig).toContain('package-ecosystem: "npm"');
    expect(npmConfig).toContain("open-pull-requests-limit: 0");
    expect(npmConfig).toContain("npm-production-security:");
    expect(npmConfig).toContain('dependency-type: "production"');
    expect(npmConfig).toContain("npm-development-security:");
    expect(npmConfig).toContain('dependency-type: "development"');
    expect(npmConfig).not.toContain("npm-patch-version-updates:");
    expect(npmConfig).not.toContain("ignore:");
  });

  it("retains cooled GitHub Actions maintenance and immediate security updates", () => {
    const actionsConfig = dependabot.split(
      '  - package-ecosystem: "github-actions"',
    )[1];

    expect(actionsConfig).toContain("open-pull-requests-limit: 10");
    expect(actionsConfig).toContain("cooldown:");
    expect(actionsConfig).toContain("default-days: 14");
    expect(actionsConfig).toContain("github-actions-security:");
    expect(actionsConfig).toContain(
      "github-actions-patch-minor-version-updates:",
    );
  });
});
