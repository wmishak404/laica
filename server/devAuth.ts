import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { createFirebaseCustomToken } from "./firebaseAuth";
import { storage } from "./storage";

const LINKED_DEV_AUTH_HEADER = "x-laica-dev-auth";
const LINKED_DEV_AUTH_UID_PATTERN = /^dev-test-[a-z0-9-]{1,80}$/;

const linkedDevAuthRequestSchema = z.object({
  uid: z.string().trim().regex(LINKED_DEV_AUTH_UID_PATTERN),
  email: z
    .string()
    .trim()
    .email()
    .refine((value) => value.endsWith("@example.test"), {
      message: "Dev auth emails must use example.test",
    })
    .optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
});

function isEnabledFlag(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true" || value?.toLowerCase() === "yes";
}

function isProductionRuntime(env = process.env): boolean {
  return env.NODE_ENV === "production" || isEnabledFlag(env.REPLIT_DEPLOYMENT);
}

export function isLinkedDevAuthRouteEnabled(env = process.env): boolean {
  return !isProductionRuntime(env) && isEnabledFlag(env.LAICA_DEV_AUTH_ENABLED);
}

function parseAllowedUsers(value: string | undefined): Set<string> {
  return new Set(
    (value || "")
      .split(/[\s,]+/)
      .map((uid) => uid.trim())
      .filter(Boolean),
  );
}

function getSingleHeader(req: Request, name: string): string | null {
  const header = req.headers[name];
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function secretsMatch(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const [firstName = "", ...rest] = displayName.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

export async function handleLinkedDevAuthTokenRequest(req: Request, res: Response) {
  res.set({
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
  });

  if (!isLinkedDevAuthRouteEnabled()) {
    return res.status(404).json({ message: "Not found" });
  }

  if (!secretsMatch(getSingleHeader(req, LINKED_DEV_AUTH_HEADER), process.env.LAICA_DEV_AUTH_SECRET?.trim())) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = linkedDevAuthRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: "INVALID_REQUEST",
      message: "Invalid linked dev auth request",
    });
  }

  const allowedUsers = parseAllowedUsers(process.env.LAICA_DEV_AUTH_ALLOWED_USERS);
  if (!allowedUsers.has(parsed.data.uid)) {
    return res.status(403).json({
      code: "DEV_AUTH_USER_NOT_ALLOWED",
      message: "Linked dev auth user is not allowlisted",
    });
  }

  try {
    const displayName = parsed.data.displayName || "Linked Dev Test User";
    const { firstName, lastName } = splitDisplayName(displayName);
    const email = parsed.data.email || `${parsed.data.uid}@example.test`;

    const userData = {
      id: parsed.data.uid,
      email,
      firstName,
      lastName,
      profileImageUrl: "",
      authProvider: "dev-test",
      firebaseUid: parsed.data.uid,
    };

    const [user, customToken] = await Promise.all([
      storage.upsertUser(userData),
      createFirebaseCustomToken(parsed.data.uid, { laicaDevAuth: true }),
    ]);

    return res.json({
      customToken,
      user: {
        id: user.id,
        email: user.email,
        authMode: "linked",
      },
    });
  } catch {
    console.error("Linked dev auth token mint failed");
    return res.status(500).json({ message: "Failed to create linked dev auth token" });
  }
}
