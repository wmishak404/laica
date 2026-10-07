// @vitest-environment node

import { generateKeyPairSync, randomUUID, verify } from "node:crypto";
import { cert, deleteApp, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("firebase-admin/app");
vi.unmock("firebase-admin/auth");

// Exercise the installed SDK with ephemeral credentials, without Google, App Check,
// or Firestore calls. Application auth-boundary tests mock this SDK separately.
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const serviceAccountEmail = "credentials-test@synthetic-project.iam.gserviceaccount.com";
const apps: App[] = [];

function syntheticServiceAccount(key: string) {
  return {
    projectId: "synthetic-project",
    clientEmail: serviceAccountEmail,
    privateKey: key,
  };
}

describe("installed Firebase Admin credential compatibility", () => {
  beforeEach(() => {
    // An externally configured emulator would otherwise bypass real RS256 signing.
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", undefined);
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => deleteApp(app)));
    vi.unstubAllEnvs();
  });

  it.each(["pkcs1", "pkcs8"] as const)(
    "accepts an RSA %s PEM and signs a custom token bound to its credential and user",
    async (type) => {
      const pem = privateKey.export({ format: "pem", type }).toString();
      const app = initializeApp(
        { credential: cert(syntheticServiceAccount(pem)) },
        `credentials-test-${randomUUID()}`,
      );
      apps.push(app);

      const uid = "dev-test-credential-compatibility";
      const claims = { laicaDevAuth: true };
      const earliestIssuedAt = Math.floor(Date.now() / 1000);
      const token = await getAuth(app).createCustomToken(uid, claims);
      const latestIssuedAt = Math.floor(Date.now() / 1000);
      const segments = token.split(".");
      expect(segments.length).toBe(3);

      const [encodedHeader, encodedPayload, encodedSignature] = segments;
      const header = JSON.parse(Buffer.from(encodedHeader!, "base64url").toString("utf8"));
      const payload = JSON.parse(Buffer.from(encodedPayload!, "base64url").toString("utf8"));
      const signature = Buffer.from(encodedSignature!, "base64url");
      const signedContent = Buffer.from(`${encodedHeader}.${encodedPayload}`);

      expect(header).toEqual({ alg: "RS256", typ: "JWT" });
      expect(verify("RSA-SHA256", signedContent, publicKey, signature)).toBe(true);
      expect(payload.uid).toBe(uid);
      expect(payload.iss).toBe(serviceAccountEmail);
      expect(payload.sub).toBe(serviceAccountEmail);
      expect(payload.aud).toBe(
        "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      );
      expect(payload.claims).toEqual(claims);
      expect(payload.iat).toBeGreaterThanOrEqual(earliestIssuedAt);
      expect(payload.iat).toBeLessThanOrEqual(latestIssuedAt);
      expect(payload.exp - payload.iat).toBe(3600);

      const changedPayload = Buffer.from(
        JSON.stringify({ ...payload, uid: "different-user" }),
      ).toString("base64url");
      expect(
        verify(
          "RSA-SHA256",
          Buffer.from(`${encodedHeader}.${changedPayload}`),
          publicKey,
          signature,
        ),
      ).toBe(false);
    },
  );

  it("rejects a malformed PEM before creating a usable credential", () => {
    expect(() => cert(syntheticServiceAccount("not-a-private-key"))).toThrow(
      /Failed to parse private key/,
    );
  });
});
