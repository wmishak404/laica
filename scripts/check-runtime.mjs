import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Keep this floor aligned with package.json, .nvmrc and the release runtime check.
const patchedFloors = new Map([[22, [23, 4]], [24, [22, 1]], [26, [12, 1]]]);

export function isSupportedRuntime(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return false;
  const [major, minor, patch] = match.slice(1).map(Number);
  const minimum = patchedFloors.get(major);
  return Boolean(minimum && (minor > minimum[0] || (minor === minimum[0] && patch >= minimum[1])));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!isSupportedRuntime(process.versions.node)) {
    const { engines } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    console.error(`Unsupported Node.js runtime ${process.versions.node}; required: ${engines.node}. Update the runtime before building or starting LAICA.`);
    process.exitCode = 1;
  }
}
