import { spawn } from "node:child_process";

type SandboxOptions = {
  command: string[];
  prepareOnly: boolean;
  skipPush: boolean;
};

function isTruthy(value: string | undefined): boolean {
  return /^(1|true|yes)$/i.test(value ?? "");
}

function parseArgs(argv: string[]): SandboxOptions {
  const separatorIndex = argv.indexOf("--");
  const optionArgs = separatorIndex === -1 ? argv : argv.slice(0, separatorIndex);
  const command = separatorIndex === -1 ? [] : argv.slice(separatorIndex + 1);

  return {
    command,
    prepareOnly: optionArgs.includes("--prepare-only"),
    skipPush: optionArgs.includes("--skip-push"),
  };
}

function describeDatabase(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const database = url.pathname.replace(/^\//, "") || "(no database)";
    return `${url.host}/${database}`;
  } catch {
    return "(invalid database url)";
  }
}

function assertSandboxDatabase() {
  const sandboxUrl = process.env.LAICA_LOCAL_SANDBOX_DATABASE_URL;

  if (!sandboxUrl) {
    throw new Error(
      [
        "LAICA_LOCAL_SANDBOX_DATABASE_URL is required.",
        "Use a disposable/non-production database or Neon branch; this helper will not mutate the default .env DATABASE_URL.",
      ].join(" "),
    );
  }

  try {
    const parsed = new URL(sandboxUrl);
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      throw new Error("Sandbox database URL must use postgres:// or postgresql://.");
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Invalid LAICA_LOCAL_SANDBOX_DATABASE_URL.");
  }

  if (process.env.DATABASE_URL && process.env.DATABASE_URL === sandboxUrl) {
    throw new Error(
      "LAICA_LOCAL_SANDBOX_DATABASE_URL must not equal DATABASE_URL. Refusing to mutate the default decrypted .env database.",
    );
  }

  return sandboxUrl;
}

function commandText(command: string[]) {
  return command.join(" ");
}

function runCommand(command: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${commandText(command)}`);
    const child = spawn(command[0], command.slice(1), {
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${commandText(command)} exited with ${signal ?? code}.`));
    });
  });
}

function runLongCommand(command: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${commandText(command)}`);
    const child = spawn(command[0], command.slice(1), {
      env,
      stdio: "inherit",
    });

    const forwardSignal = (signal: NodeJS.Signals) => {
      if (!child.killed) {
        child.kill(signal);
      }
    };

    process.once("SIGINT", forwardSignal);
    process.once("SIGTERM", forwardSignal);

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      process.off("SIGINT", forwardSignal);
      process.off("SIGTERM", forwardSignal);

      if (code === 0 || signal === "SIGINT" || signal === "SIGTERM") {
        resolve();
        return;
      }

      reject(new Error(`${commandText(command)} exited with ${signal ?? code}.`));
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sandboxUrl = assertSandboxDatabase();
  const env = {
    ...process.env,
    DATABASE_URL: sandboxUrl,
  };

  console.log(`Using local sandbox database: ${describeDatabase(sandboxUrl)}`);

  if (!options.skipPush) {
    if (!isTruthy(process.env.LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH)) {
      throw new Error(
        [
          "Refusing to push schema without LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true.",
          "Only set it when LAICA_LOCAL_SANDBOX_DATABASE_URL points at a disposable/non-production database.",
        ].join(" "),
      );
    }

    await runCommand(["npm", "run", "db:push", "--", "--force"], env);
  } else {
    console.log("Skipping schema push because --skip-push was provided.");
  }

  await runCommand(["npm", "run", "db:health"], env);

  if (options.prepareOnly) {
    console.log("Sandbox database is schema-current.");
    return;
  }

  const command = options.command.length > 0 ? options.command : ["npm", "run", "dev"];
  await runLongCommand(command, env);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
