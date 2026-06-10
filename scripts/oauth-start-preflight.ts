type OAuthPreflightEnv = Record<string, string | undefined>;

type OAuthPreflightFetch = (
  input: string,
  init: {
    method: "POST";
    headers: { "Content-Type": "application/json" };
    body: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
}>;

type OAuthPreflightLogger = Pick<typeof console, "error" | "log">;

type OAuthPreflightResult = {
  ok: boolean;
  skipped: boolean;
  exitCode: 0 | 1 | 2;
};

type ParsedConfig = {
  apiKey: string;
  continueUris: string[];
  required: boolean;
  revealProviderErrors: boolean;
};

type CreateAuthUriResponse = {
  authUri?: unknown;
  providerId?: unknown;
};

const CREATE_AUTH_URI_ENDPOINT =
  "https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri";

function isTruthy(value: string | undefined): boolean {
  return /^(1|true|yes)$/i.test(value ?? "");
}

function parseContinueUris(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[\n,]/)
    .map((uri) => uri.trim())
    .filter(Boolean);
}

function validateHttpUrl(rawUrl: string): string {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid OAUTH_PREFLIGHT_CONTINUE_URIS entry.");
  }

  if (url.protocol !== "https:") {
    throw new Error("OAuth preflight continue URI must use https.");
  }

  if (url.hash) {
    throw new Error("OAuth preflight continue URI must not include a fragment.");
  }

  if (url.searchParams.has("state")) {
    throw new Error("OAuth preflight continue URI must not include a state query parameter.");
  }

  return url.toString();
}

export function parseOAuthPreflightConfig(env: OAuthPreflightEnv): ParsedConfig | null {
  const required = isTruthy(env.OAUTH_PREFLIGHT_REQUIRED);
  const apiKey = env.OAUTH_PREFLIGHT_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY;
  const continueUris = parseContinueUris(env.OAUTH_PREFLIGHT_CONTINUE_URIS);
  const revealProviderErrors = isTruthy(env.OAUTH_PREFLIGHT_LOG_PROVIDER_ERROR);

  if (!apiKey || continueUris.length === 0) {
    if (required) {
      const missing = [
        !apiKey ? "VITE_FIREBASE_API_KEY or OAUTH_PREFLIGHT_FIREBASE_API_KEY" : null,
        continueUris.length === 0 ? "OAUTH_PREFLIGHT_CONTINUE_URIS" : null,
      ].filter(Boolean);
      throw new Error(`Missing required OAuth preflight config: ${missing.join(", ")}`);
    }

    return null;
  }

  return {
    apiKey,
    continueUris: continueUris.map(validateHttpUrl),
    required,
    revealProviderErrors,
  };
}

export function buildCreateAuthUriRequest(apiKey: string, continueUri: string) {
  const url = new URL(CREATE_AUTH_URI_ENDPOINT);
  url.searchParams.set("key", apiKey);

  return {
    url: url.toString(),
    body: {
      continueUri,
      providerId: "google.com",
      customParameter: {
        prompt: "select_account",
      },
    },
  };
}

function parseJsonResponse(bodyText: string): unknown {
  try {
    return JSON.parse(bodyText);
  } catch {
    return null;
  }
}

function getGoogleErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== "object") {
    return null;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

function getSafeAuthUriHost(authUri: string): string {
  try {
    return new URL(authUri).host;
  } catch {
    return "(invalid authUri)";
  }
}

function isGoogleAuthUri(authUri: string): boolean {
  try {
    const host = new URL(authUri).hostname;
    return host === "accounts.google.com" || host.endsWith(".google.com");
  } catch {
    return false;
  }
}

async function checkContinueUri(
  fetchImpl: OAuthPreflightFetch,
  apiKey: string,
  continueUri: string,
  continueUriLabel: string,
  revealProviderErrors: boolean,
  logger: OAuthPreflightLogger,
): Promise<boolean> {
  const request = buildCreateAuthUriRequest(apiKey, continueUri);
  const response = await fetchImpl(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request.body),
  });
  const responseText = await response.text();
  const responseBody = parseJsonResponse(responseText);

  if (!response.ok) {
    const googleMessage = getGoogleErrorMessage(responseBody);
    logger.error(
      [
        `OAuth start preflight failed for ${continueUriLabel}.`,
        `Status: ${response.status} ${response.statusText}`.trim(),
        googleMessage && revealProviderErrors
          ? `Provider diagnostic: ${googleMessage}`
          : googleMessage
            ? "Provider diagnostic hidden; rerun privately with OAUTH_PREFLIGHT_LOG_PROVIDER_ERROR=true."
            : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
    return false;
  }

  const createAuthUri =
    responseBody && typeof responseBody === "object" ? (responseBody as CreateAuthUriResponse) : {};
  if (
    typeof createAuthUri.authUri !== "string" ||
    !isGoogleAuthUri(createAuthUri.authUri) ||
    createAuthUri.providerId !== "google.com"
  ) {
    logger.error(
      [
        `OAuth start preflight returned an unexpected response for ${continueUriLabel}.`,
        `providerId=${String(createAuthUri.providerId)}`,
        `authUriHost=${typeof createAuthUri.authUri === "string" ? getSafeAuthUriHost(createAuthUri.authUri) : "(missing)"}`,
      ].join(" "),
    );
    return false;
  }

  logger.log(
    `OAuth start preflight passed for ${continueUriLabel} (providerId=google.com, authUriHost=${getSafeAuthUriHost(createAuthUri.authUri)}).`,
  );
  return true;
}

export async function runOAuthStartPreflight({
  env = process.env,
  fetchImpl = fetch as OAuthPreflightFetch,
  logger = console,
}: {
  env?: OAuthPreflightEnv;
  fetchImpl?: OAuthPreflightFetch;
  logger?: OAuthPreflightLogger;
} = {}): Promise<OAuthPreflightResult> {
  let config: ParsedConfig | null;

  try {
    config = parseOAuthPreflightConfig(env);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return { ok: false, skipped: false, exitCode: 2 };
  }

  if (!config) {
    logger.log(
      "OAuth start preflight skipped: set OAUTH_PREFLIGHT_CONTINUE_URIS and VITE_FIREBASE_API_KEY (or OAUTH_PREFLIGHT_FIREBASE_API_KEY) to enable it.",
    );
    return { ok: true, skipped: true, exitCode: 0 };
  }

  const results = await Promise.all(
    config.continueUris.map((continueUri, index) =>
      checkContinueUri(
        fetchImpl,
        config.apiKey,
        continueUri,
        config.continueUris.length === 1 ? "configured continue URI" : `configured continue URI ${index + 1}`,
        config.revealProviderErrors,
        logger,
      ),
    ),
  );
  const ok = results.every(Boolean);

  return { ok, skipped: false, exitCode: ok ? 0 : 1 };
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runOAuthStartPreflight()
    .then((result) => {
      process.exit(result.exitCode);
    })
    .catch((error) => {
      console.error("OAuth start preflight errored:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
