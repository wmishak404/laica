import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

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
    expect(dependencyAudit).toContain('node-version-file: ".nvmrc"');
  });

  const auditReport = (high = 0, critical = 0) => JSON.stringify({
    metadata: { vulnerabilities: { low: 0, moderate: 5, high, critical } },
  });

  it.each([
    { label: "moderate findings", report: auditReport(), scannerStatus: 0, expected: 0 },
    { label: "high findings", report: auditReport(1), scannerStatus: 1, expected: 1 },
    { label: "critical findings despite a zero scanner exit", report: auditReport(0, 1), scannerStatus: 0, expected: 1 },
    { label: "scanner failure despite valid totals", report: auditReport(), scannerStatus: 13, expected: 13 },
    { label: "invalid JSON despite a zero scanner exit", report: "private scanner diagnostic", scannerStatus: 0, expected: 1 },
    { label: "missing totals", report: "{}", scannerStatus: 0, expected: 1 },
    { label: "scanner error payload", report: JSON.stringify({ error: "private scanner diagnostic" }), scannerStatus: 0, expected: 1 },
  ])("preserves the audit gate and private diagnostics for $label", ({ report, scannerStatus, expected }) => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "laica-audit-contract-"));
    try {
      writeFileSync(path.join(directory, "npm"), '#!/bin/sh\nprintf "%s" "$TEST_AUDIT_REPORT"\nprintf "%s" "private scanner diagnostic" >&2\nexit "$TEST_AUDIT_STATUS"\n', { mode: 0o700 });
      const block = dependencyAudit.split("      - name: Audit (fail on high/critical)\n        run: |\n")[1];
      expect(block).toBeDefined();
      const script = block.split("\n").map(line => line.replace(/^ {10}/, "")).join("\n");
      const result = spawnSync("/bin/bash", ["-e", "-c", script], {
        encoding: "utf8",
        env: {
          PATH: `${directory}:${path.dirname(process.execPath)}:/usr/bin:/bin`,
          RUNNER_TEMP: directory,
          TEST_AUDIT_REPORT: report,
          TEST_AUDIT_STATUS: String(scannerStatus),
        },
      });

      expect(result.status).toBe(expected);
      expect(result.stdout + result.stderr).not.toContain("private scanner diagnostic");
      expect(readFileSync(path.join(directory, "laica-npm-audit.json"), "utf8")).toBe(report);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
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
