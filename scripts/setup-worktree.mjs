import { lstat, readlink, symlink, unlink } from "node:fs/promises";
import path from "node:path";

const DEFAULT_ENV_KEYS_SOURCE = "/Users/wilsonishak-macbookpro/src/laica/.env.keys";
const ENV_KEYS_FILE = ".env.keys";

function parseArgs(argv) {
  return {
    force: argv.includes("--force"),
  };
}

async function exists(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function resolvedLinkTarget(linkPath, target) {
  if (path.isAbsolute(target)) {
    return path.resolve(target);
  }

  return path.resolve(path.dirname(linkPath), target);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const envKeysSource = path.resolve(process.env.LAICA_ENV_KEYS_SOURCE ?? DEFAULT_ENV_KEYS_SOURCE);
  const envKeysPath = path.resolve(process.cwd(), ENV_KEYS_FILE);

  const sourceStat = await exists(envKeysSource);
  if (!sourceStat) {
    throw new Error(`Expected dotenvx key source is missing: ${envKeysSource}`);
  }
  if (!sourceStat.isFile()) {
    throw new Error(`Expected dotenvx key source is not a file: ${envKeysSource}`);
  }

  const currentStat = await exists(envKeysPath);
  if (currentStat) {
    if (!currentStat.isSymbolicLink()) {
      console.log(`${ENV_KEYS_FILE} already exists and is not a symlink; leaving it unchanged.`);
      console.log("No secret values were read or printed.");
      return;
    }

    const currentTarget = await readlink(envKeysPath);
    const resolvedTarget = resolvedLinkTarget(envKeysPath, currentTarget);
    if (resolvedTarget === envKeysSource) {
      console.log(`${ENV_KEYS_FILE} already points at the standard dotenvx key source.`);
      console.log("No secret values were read or printed.");
      return;
    }

    if (!options.force) {
      throw new Error(
        [
          `${ENV_KEYS_FILE} already points at a different location: ${resolvedTarget}`,
          "Run npm run setup:worktree -- --force only if this worktree should use the standard source.",
        ].join(" "),
      );
    }

    await unlink(envKeysPath);
  }

  await symlink(envKeysSource, envKeysPath);
  console.log(`${ENV_KEYS_FILE} linked to the standard dotenvx key source.`);
  console.log("No secret values were read or printed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
