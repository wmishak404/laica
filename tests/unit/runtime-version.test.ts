import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { isSupportedRuntime } from "../../scripts/check-runtime.mjs";

// Value: build/release commands must reject obsolete runtimes before loading app services.
// Limits: version policy does not establish the version installed in a deployed image.
describe("runtime release policy", () => {
  it.each(["22.23.4", "22.24.0", "24.22.1", "24.23.0", "26.12.1", "26.13.0"])(
    "accepts supported patched release %s", (version) => {
      expect(isSupportedRuntime(version)).toBe(true);
    },
  );

  it.each(["20.19.0", "22.23.3", "24.22.0", "26.12.0", "23.0.0", "25.0.0", "27.0.0", "24.22.1-rc.1", "invalid"])(
    "rejects runtime outside the release policy: %s", (version) => {
      expect(isSupportedRuntime(version)).toBe(false);
    },
  );

  it("aligns normal build/start/dev commands and CI on the checked runtime", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8"));
    const selected = readFileSync(".nvmrc", "utf8").trim();
    expect(isSupportedRuntime(selected)).toBe(true);
    expect(readFileSync(".replit", "utf8")).toContain(`"nodejs-${selected.split(".")[0]}"`);
    for (const command of ["dev", "build", "start"]) {
      expect(manifest.scripts[`pre${command}`]).toBe("npm run check:runtime");
    }
    const result = spawnSync(process.execPath, ["scripts/check-runtime.mjs"], { encoding: "utf8" });
    expect(result.status).toBe(isSupportedRuntime(process.versions.node) ? 0 : 1);
    expect(result.stderr.includes("Unsupported Node.js runtime")).toBe(!isSupportedRuntime(process.versions.node));
  });
});
