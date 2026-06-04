import { describe, expect, it, vi } from "vitest";

import {
  buildCreateAuthUriRequest,
  parseOAuthPreflightConfig,
  runOAuthStartPreflight,
} from "../../scripts/oauth-start-preflight";

function createLogger() {
  return {
    error: vi.fn(),
    log: vi.fn(),
  };
}

function createResponse({
  ok = true,
  status = 200,
  statusText = "OK",
  body,
}: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  body: unknown;
}) {
  return {
    ok,
    status,
    statusText,
    text: async () => JSON.stringify(body),
  };
}

describe("OAuth start preflight", () => {
  it("skips when optional config is absent", async () => {
    const logger = createLogger();
    const fetchImpl = vi.fn();

    const result = await runOAuthStartPreflight({
      env: {},
      fetchImpl,
      logger,
    });

    expect(result).toEqual({ ok: true, skipped: true, exitCode: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("OAuth start preflight skipped"));
  });

  it("fails fast when required config is absent", async () => {
    const logger = createLogger();
    const fetchImpl = vi.fn();

    const result = await runOAuthStartPreflight({
      env: { OAUTH_PREFLIGHT_REQUIRED: "true" },
      fetchImpl,
      logger,
    });

    expect(result).toEqual({ ok: false, skipped: false, exitCode: 2 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Missing required OAuth preflight config"));
  });

  it("normalizes configured continue URIs", () => {
    const config = parseOAuthPreflightConfig({
      VITE_FIREBASE_API_KEY: "firebase-key",
      OAUTH_PREFLIGHT_CONTINUE_URIS: "https://laica.example/login,\nhttps://laica.replit.app",
    });

    expect(config).toEqual({
      apiKey: "firebase-key",
      continueUris: ["https://laica.example/login", "https://laica.replit.app/"],
      required: false,
    });
  });

  it("rejects non-HTTPS continue URIs before network calls", async () => {
    const logger = createLogger();
    const fetchImpl = vi.fn();

    const result = await runOAuthStartPreflight({
      env: {
        VITE_FIREBASE_API_KEY: "firebase-key",
        OAUTH_PREFLIGHT_CONTINUE_URIS: "http://laica.example",
      },
      fetchImpl,
      logger,
    });

    expect(result).toEqual({ ok: false, skipped: false, exitCode: 2 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("must use https"));
    expect(logger.error.mock.calls.flat().join("\n")).not.toContain("http://laica.example");
  });

  it("rejects continue URIs with reserved state parameters", async () => {
    const logger = createLogger();
    const fetchImpl = vi.fn();

    const result = await runOAuthStartPreflight({
      env: {
        VITE_FIREBASE_API_KEY: "firebase-key",
        OAUTH_PREFLIGHT_CONTINUE_URIS: "https://laica.example?state=already-set",
      },
      fetchImpl,
      logger,
    });

    expect(result).toEqual({ ok: false, skipped: false, exitCode: 2 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("state query parameter"));
    expect(logger.error.mock.calls.flat().join("\n")).not.toContain("state=already-set");
  });

  it("posts the intended Google provider payload and accepts a Google auth URI", async () => {
    const logger = createLogger();
    const fetchImpl = vi.fn().mockResolvedValue(
      createResponse({
        body: {
          providerId: "google.com",
          authUri: "https://accounts.google.com/o/oauth2/v2/auth?client_id=test",
        },
      }),
    );

    const result = await runOAuthStartPreflight({
      env: {
        VITE_FIREBASE_API_KEY: "firebase-key",
        OAUTH_PREFLIGHT_CONTINUE_URIS: "https://laica.example/auth/callback",
      },
      fetchImpl,
      logger,
    });

    expect(result).toEqual({ ok: true, skipped: false, exitCode: 0 });
    expect(fetchImpl).toHaveBeenCalledOnce();

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      "https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=firebase-key",
    );
    expect(JSON.parse(init.body)).toEqual({
      continueUri: "https://laica.example/auth/callback",
      providerId: "google.com",
      customParameter: {
        prompt: "select_account",
      },
    });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining("providerId=google.com, authUriHost=accounts.google.com"),
    );
    expect(logger.log.mock.calls.flat().join("\n")).not.toContain(
      "https://laica.example/auth/callback",
    );
  });

  it("reports Google config errors without logging the API key", async () => {
    const logger = createLogger();
    const fetchImpl = vi.fn().mockResolvedValue(
      createResponse({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        body: {
          error: {
            message: "auth/unauthorized-domain",
          },
        },
      }),
    );

    const result = await runOAuthStartPreflight({
      env: {
        VITE_FIREBASE_API_KEY: "secret-api-key",
        OAUTH_PREFLIGHT_CONTINUE_URIS: "https://unapproved.example",
      },
      fetchImpl,
      logger,
    });

    expect(result).toEqual({ ok: false, skipped: false, exitCode: 1 });
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("auth/unauthorized-domain"));
    expect(logger.error.mock.calls.flat().join("\n")).not.toContain("secret-api-key");
    expect(logger.error.mock.calls.flat().join("\n")).not.toContain("https://unapproved.example");
  });
});
