import { expect, test } from "@playwright/test";

const LINKED_DEV_AUTH_UID = "dev-test-linked-ci";

function missingEnvNames() {
  return [
    "LAICA_DEV_AUTH_ENABLED",
    "LAICA_DEV_AUTH_SECRET",
    "LAICA_DEV_AUTH_ALLOWED_USERS",
    "VITE_FIREBASE_API_KEY",
  ].filter((name) => !process.env[name]);
}

function parseAllowedUsers(value: string | undefined): string[] {
  return (value || "")
    .split(/[\s,]+/)
    .map((uid) => uid.trim())
    .filter(Boolean);
}

async function exchangeCustomTokenForIdToken(customToken: string): Promise<string> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  expect(apiKey, "VITE_FIREBASE_API_KEY is required for custom-token exchange").toBeTruthy();

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey!)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true,
      }),
    },
  );
  const payload = (await response.json()) as {
    idToken?: string;
    error?: { message?: string };
  };

  expect(response.ok, `Firebase custom-token exchange failed: ${payload.error?.message || response.status}`).toBe(true);
  expect(payload.idToken).toEqual(expect.any(String));
  return payload.idToken!;
}

test.describe("linked dev auth smoke", () => {
  const missing = missingEnvNames();
  test.skip(missing.length > 0, `Missing linked dev-auth env: ${missing.join(", ")}`);

  test("exercises linked-only routes with a Firebase ID token", async ({ request }) => {
    expect(parseAllowedUsers(process.env.LAICA_DEV_AUTH_ALLOWED_USERS)).toContain(LINKED_DEV_AUTH_UID);

    const tokenResponse = await request.post("/api/dev/auth/linked-token", {
      headers: {
        "X-Laica-Dev-Auth": process.env.LAICA_DEV_AUTH_SECRET!,
      },
      data: {
        uid: LINKED_DEV_AUTH_UID,
        email: `${LINKED_DEV_AUTH_UID}@example.test`,
        displayName: "Linked Dev Test User",
      },
    });

    expect(tokenResponse.status()).toBe(200);
    const tokenPayload = (await tokenResponse.json()) as {
      customToken?: string;
      user?: { id?: string; email?: string; authMode?: string };
    };
    expect(tokenPayload).toEqual({
      customToken: expect.any(String),
      user: {
        id: LINKED_DEV_AUTH_UID,
        email: `${LINKED_DEV_AUTH_UID}@example.test`,
        authMode: "linked",
      },
    });

    const idToken = await exchangeCustomTokenForIdToken(tokenPayload.customToken!);
    const authHeaders = { Authorization: `Bearer ${idToken}` };

    const sessionResponse = await request.get("/api/auth/session", {
      headers: authHeaders,
    });
    expect(sessionResponse.status()).toBe(200);
    expect(await sessionResponse.json()).toMatchObject({
      authMode: "linked",
      user: {
        id: LINKED_DEV_AUTH_UID,
        email: `${LINKED_DEV_AUTH_UID}@example.test`,
      },
    });

    const linkedUserResponse = await request.get("/api/auth/user", {
      headers: authHeaders,
    });
    expect(linkedUserResponse.status()).toBe(200);
    expect(await linkedUserResponse.json()).toMatchObject({
      id: LINKED_DEV_AUTH_UID,
      email: `${LINKED_DEV_AUTH_UID}@example.test`,
    });
  });
});
