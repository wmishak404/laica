import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  MEAL_PLANNING_DISMISSAL_STORAGE_KEY,
  MEAL_PLANNING_STORAGE_KEY,
} from "../../client/src/lib/planningCache";

const LINKED_DEV_AUTH_UID = "dev-test-linked-ci";
const LINKED_DEV_AUTH_BROWSER_UID = "dev-test-linked-browser-ci";
const LINKED_DEV_AUTH_SETTINGS_UID = "dev-test-linked-settings-ci";
const DEV_AUTH_CUSTOM_TOKEN_STORAGE_KEY = "__LAICA_DEV_AUTH_CUSTOM_TOKEN";
const DEV_AUTH_BOOTSTRAPPED_STORAGE_KEY = "__LAICA_DEV_AUTH_CUSTOM_TOKEN_BOOTSTRAPPED";

const pantryRecipesResponse = {
  recipes: [
    {
      recipeName: "Soy Rice Breakfast Bowl",
      description: "A fast bowl built from rice, eggs, soy sauce, tortillas, and lime.",
      cookTime: 25,
      difficulty: "Easy",
      cuisine: "Mexican-inspired",
      pantryMatch: 95,
      pantryIngredientsUsed: ["rice", "eggs", "soy sauce", "tortillas", "lime"],
      additionalIngredientsNeeded: ["cilantro"],
      overview: "Pantry-first, bright, and weeknight-friendly.",
    },
    {
      recipeName: "Crispy Egg Tortilla Rice",
      description: "Crisped rice and eggs tucked into warm tortillas.",
      cookTime: 30,
      difficulty: "Easy",
      cuisine: "Mexican-inspired",
      pantryMatch: 88,
      pantryIngredientsUsed: ["rice", "eggs", "tortillas"],
      additionalIngredientsNeeded: ["hot sauce"],
      overview: "A low-lift second ticket with familiar staples.",
    },
    {
      recipeName: "Soy Lime Rice Skillet",
      description: "A skillet dinner that leans on soy sauce and lime.",
      cookTime: 35,
      difficulty: "Medium",
      cuisine: "Pantry-first",
      pantryMatch: 82,
      pantryIngredientsUsed: ["rice", "soy sauce", "lime"],
      additionalIngredientsNeeded: ["green onion"],
      overview: "Simple enough for a linked smoke, varied enough for UI proof.",
    },
  ],
};

type LinkedDevAuthPayload = {
  customToken?: string;
  user?: { id?: string; email?: string; authMode?: string };
};

type PantryRecipeRequest = {
  ingredients?: string[];
  preferences?: string;
  timeAvailable?: string;
};

type LinkedUserProfileResponse = {
  user?: {
    cookingSkill?: string | null;
    dietaryRestrictions?: string[] | null;
    pantryIngredients?: string[] | null;
    kitchenEquipment?: string[] | null;
  };
};

type LinkedProfileSeed = {
  cookingSkill?: string;
  dietaryRestrictions?: string[];
  pantryIngredients?: string[];
  kitchenEquipment?: string[];
  favoriteChefs?: string[];
};

function missingApiEnvNames() {
  return [
    "LAICA_DEV_AUTH_ENABLED",
    "LAICA_DEV_AUTH_SECRET",
    "LAICA_DEV_AUTH_ALLOWED_USERS",
    "VITE_FIREBASE_API_KEY",
  ].filter((name) => !process.env[name]);
}

function missingBrowserEnvNames() {
  const required = new Set([
    ...missingApiEnvNames(),
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_LAICA_DEV_AUTH_BROWSER",
  ]);

  return [...required].filter((name) => !process.env[name]);
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

async function createLinkedDevAuthToken(
  request: APIRequestContext,
  uid: string,
  displayName: string,
): Promise<LinkedDevAuthPayload> {
  const tokenResponse = await request.post("/api/dev/auth/linked-token", {
    headers: {
      "X-Laica-Dev-Auth": process.env.LAICA_DEV_AUTH_SECRET!,
    },
    data: {
      uid,
      email: `${uid}@example.test`,
      displayName,
    },
  });

  expect(tokenResponse.status()).toBe(200);
  const tokenPayload = (await tokenResponse.json()) as LinkedDevAuthPayload;
  expect(tokenPayload).toEqual({
    customToken: expect.any(String),
    user: {
      id: uid,
      email: `${uid}@example.test`,
      authMode: "linked",
    },
  });

  return tokenPayload;
}

async function seedLinkedProfile(
  request: APIRequestContext,
  idToken: string,
  uid = LINKED_DEV_AUTH_BROWSER_UID,
  seed: LinkedProfileSeed = {},
) {
  const profile = {
    cookingSkill: seed.cookingSkill ?? "Beginner",
    dietaryRestrictions: seed.dietaryRestrictions ?? ["No restrictions"],
    pantryIngredients: seed.pantryIngredients ?? ["rice", "eggs", "soy sauce"],
    kitchenEquipment: seed.kitchenEquipment ?? ["skillet"],
    favoriteChefs: seed.favoriteChefs ?? [],
  };

  const profileResponse = await request.put("/api/user/profile", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    data: profile,
  });

  expect(profileResponse.status()).toBe(200);
  expect(await profileResponse.json()).toMatchObject({
    id: uid,
    cookingSkill: profile.cookingSkill,
    dietaryRestrictions: profile.dietaryRestrictions,
    pantryIngredients: profile.pantryIngredients,
  });
}

async function readLinkedProfile(request: APIRequestContext, idToken: string): Promise<LinkedUserProfileResponse> {
  const profileResponse = await request.get("/api/user/profile", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  expect(profileResponse.status()).toBe(200);
  return (await profileResponse.json()) as LinkedUserProfileResponse;
}

async function stubPantryRecipes(page: Page) {
  await page.route("**/api/recipes/pantry", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(pantryRecipesResponse),
    });
  });
}

async function signBrowserInWithCustomToken(page: Page, customToken: string, expectedPantryCount = 3) {
  await page.addInitScript(
    ({ key, token, bootstrappedKey }) => {
      if (window.sessionStorage.getItem(bootstrappedKey) === "true") {
        return;
      }

      window.sessionStorage.setItem(key, token);
      window.sessionStorage.setItem(bootstrappedKey, "true");
    },
    {
      key: DEV_AUTH_CUSTOM_TOKEN_STORAGE_KEY,
      token: customToken,
      bootstrappedKey: DEV_AUTH_BOOTSTRAPPED_STORAGE_KEY,
    },
  );

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "What are we cooking today?" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Right now I see/)).toContainText(`${expectedPantryCount} pantry items`, {
    timeout: 30_000,
  });
}

async function queueDevAuthTokenForNextLoad(page: Page, customToken: string) {
  await page.evaluate(
    ({ key, token }) => {
      window.sessionStorage.setItem(key, token);
    },
    { key: DEV_AUTH_CUSTOM_TOKEN_STORAGE_KEY, token: customToken },
  );
}

async function reloadLinkedBrowserSession(page: Page, request: APIRequestContext) {
  const reloadTokenPayload = await createLinkedDevAuthToken(
    request,
    LINKED_DEV_AUTH_BROWSER_UID,
    "Linked Browser Dev User",
  );
  await queueDevAuthTokenForNextLoad(page, reloadTokenPayload.customToken!);
  await page.reload();
}

async function waitForLinkedMealPlanningSession(page: Page) {
  const storageKey = `${MEAL_PLANNING_STORAGE_KEY}:linked:${LINKED_DEV_AUTH_BROWSER_UID}`;

  await page.waitForFunction(
    ({ key }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return false;

      try {
        const session = JSON.parse(raw) as {
          currentStep?: unknown;
          recommendations?: Array<{ recipeName?: unknown }>;
          savedAt?: unknown;
        };

        return session.currentStep === "tickets"
          && typeof session.savedAt === "number"
          && Array.isArray(session.recommendations)
          && session.recommendations.some((recipe) => recipe.recipeName === "Soy Rice Breakfast Bowl");
      } catch {
        return false;
      }
    },
    { key: storageKey },
    { timeout: 30_000 },
  );
}

test.describe("linked dev auth smoke", () => {
  const missing = missingApiEnvNames();
  test.skip(missing.length > 0, `Missing linked dev-auth env: ${missing.join(", ")}`);

  test("exercises linked-only routes with a Firebase ID token", async ({ request }) => {
    expect(parseAllowedUsers(process.env.LAICA_DEV_AUTH_ALLOWED_USERS)).toContain(LINKED_DEV_AUTH_UID);

    const tokenPayload = await createLinkedDevAuthToken(request, LINKED_DEV_AUTH_UID, "Linked Dev Test User");

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

test.describe("linked dev auth browser smoke", () => {
  const missing = missingBrowserEnvNames();
  test.skip(missing.length > 0, `Missing linked browser dev-auth env: ${missing.join(", ")}`);

  test("linked user can plan with saved pantry and persist newly confirmed staples", async ({ page, request }) => {
    test.setTimeout(60_000);

    expect(parseAllowedUsers(process.env.LAICA_DEV_AUTH_ALLOWED_USERS)).toContain(LINKED_DEV_AUTH_BROWSER_UID);
    expect(process.env.VITE_LAICA_DEV_AUTH_BROWSER).toBe("true");

    const tokenPayload = await createLinkedDevAuthToken(request, LINKED_DEV_AUTH_BROWSER_UID, "Linked Browser Dev User");
    const idToken = await exchangeCustomTokenForIdToken(tokenPayload.customToken!);
    await seedLinkedProfile(request, idToken);
    const browserTokenPayload = await createLinkedDevAuthToken(
      request,
      LINKED_DEV_AUTH_BROWSER_UID,
      "Linked Browser Dev User",
    );

    await stubPantryRecipes(page);
    await signBrowserInWithCustomToken(page, browserTokenPayload.customToken!);

    await expect(page.getByText(/Right now I see/)).toContainText("3 pantry items");
    await page.getByRole("button", { name: "Chef It Up" }).click();

    await expect(page.getByRole("heading", { name: "How much time do you have today?" })).toBeVisible();
    await page.getByRole("button", { name: "1hr" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    await expect(page.getByRole("heading", { name: "What sounds good?" })).toBeVisible();
    await page.getByRole("button", { name: /Mexican/ }).click();
    await page.getByRole("button", { name: "View recipe suggestions" }).click();

    await expect(page.getByRole("heading", { name: "Anything else around?" })).toBeVisible();
    await page.getByRole("button", { name: "tortillas" }).click();
    await page.getByRole("button", { name: "lime" }).click();

    const pantryRequestPromise = page.waitForRequest(
      (request) => request.url().includes("/api/recipes/pantry") && request.method() === "POST",
    );
    await page.getByRole("button", { name: "View recipe suggestions" }).click();
    const pantryRequest = await pantryRequestPromise;
    const pantryPayload = pantryRequest.postDataJSON() as PantryRecipeRequest;

    expect(pantryPayload).toMatchObject({
      ingredients: ["rice", "eggs", "soy sauce", "tortillas", "lime"],
      timeAvailable: "1 hour",
    });
    expect(pantryPayload.preferences).toContain("Confirmed staples: tortillas, lime");

    await expect(page.getByRole("heading", { name: "Recipe suggestions from your pantry" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /Soy Rice Breakfast Bowl/ })).toBeVisible();
    await waitForLinkedMealPlanningSession(page);

    const profile = await readLinkedProfile(request, idToken);
    const savedPantry = profile.user?.pantryIngredients ?? [];
    expect(savedPantry).toEqual(["rice", "eggs", "soy sauce", "tortillas", "lime"]);
    expect(new Set(savedPantry).size).toBe(savedPantry.length);
    expect(savedPantry.filter((item) => item === "tortillas")).toHaveLength(1);
    expect(savedPantry.filter((item) => item === "lime")).toHaveLength(1);

    await reloadLinkedBrowserSession(page, request);
    await expect(page.getByRole("heading", { name: "Recipe suggestions from your pantry" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /Soy Rice Breakfast Bowl/ })).toBeVisible();

    await page.getByRole("button", { name: "Back to cuisines" }).click();
    await expect(page.getByRole("heading", { name: "Anything else around?" })).toBeVisible();
    await page.getByRole("button", { name: "Back to cuisines" }).click();
    await expect(page.getByRole("heading", { name: "What sounds good?" })).toBeVisible();
    await page.getByRole("button", { name: "Back to time" }).click();
    await expect(page.getByRole("heading", { name: "How much time do you have today?" })).toBeVisible();
    await page.getByRole("button", { name: "Back to planning choices" }).click();

    await expect(page.getByRole("heading", { name: "What are we cooking today?" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Right now I see/)).toContainText("5 pantry items");
    await page.waitForFunction(
      ({ dismissalKey, sessionKey }) => {
        const dismissedAt = Number(window.localStorage.getItem(dismissalKey));
        return Number.isFinite(dismissedAt)
          && dismissedAt > 0
          && window.localStorage.getItem(sessionKey) === null;
      },
      {
        dismissalKey: `${MEAL_PLANNING_DISMISSAL_STORAGE_KEY}:linked:${LINKED_DEV_AUTH_BROWSER_UID}`,
        sessionKey: `${MEAL_PLANNING_STORAGE_KEY}:linked:${LINKED_DEV_AUTH_BROWSER_UID}`,
      },
      { timeout: 30_000 },
    );
  });

  test("linked user can save pantry and tools from Settings", async ({ page, request }) => {
    test.setTimeout(60_000);

    expect(parseAllowedUsers(process.env.LAICA_DEV_AUTH_ALLOWED_USERS)).toContain(LINKED_DEV_AUTH_SETTINGS_UID);
    expect(process.env.VITE_LAICA_DEV_AUTH_BROWSER).toBe("true");

    const tokenPayload = await createLinkedDevAuthToken(request, LINKED_DEV_AUTH_SETTINGS_UID, "Linked Settings Dev User");
    const idToken = await exchangeCustomTokenForIdToken(tokenPayload.customToken!);
    await seedLinkedProfile(request, idToken, LINKED_DEV_AUTH_SETTINGS_UID, {
      pantryIngredients: ["rice", "eggs", "soy sauce"],
      kitchenEquipment: ["skillet"],
    });
    const browserTokenPayload = await createLinkedDevAuthToken(
      request,
      LINKED_DEV_AUTH_SETTINGS_UID,
      "Linked Settings Dev User",
    );

    await signBrowserInWithCustomToken(page, browserTokenPayload.customToken!);

    await expect(page.getByText(/Right now I see/)).toContainText("3 pantry items");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("button", { name: /Settings\s+Pantry, tools, and cooking profile/i }).click();

    await expect(page.getByRole("heading", { name: "Keep Laica matched to your kitchen." })).toBeVisible();
    await page.getByRole("button", { name: /Kitchen Inventory\s+3 pantry items \+ 1 tool/i }).click();

    await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
    await page.getByRole("button", { name: "Enter manually" }).click();
    await page.getByLabel("Pantry items").fill("spinach, black beans");
    await page.getByRole("button", { name: "Save ingredients" }).click();

    await expect(page.getByText("spinach", { exact: true })).toBeVisible();
    await expect(page.getByText("black beans", { exact: true })).toBeVisible();
    await expect(page.getByText("Unsaved pantry changes")).toBeVisible();
    await page.getByRole("button", { name: "Save pantry changes" }).click();
    await expect(page.getByText("Pantry saved!")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Save pantry" })).toBeVisible();

    await page.getByRole("tab", { name: "Tools" }).click();
    await expect(page.getByRole("heading", { name: "Tools" })).toBeVisible();
    await page.getByRole("button", { name: "Enter manually" }).click();
    await page.getByLabel("Tools").fill("sheet pan");
    await page.getByRole("button", { name: "Add tools" }).click();

    await expect(page.getByText("sheet pan", { exact: true })).toBeVisible();
    await expect(page.getByText("Unsaved tools changes")).toBeVisible();
    await page.getByRole("button", { name: "Save tools changes" }).click();
    await expect(page.getByText("Tools saved!")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Save tools" })).toBeVisible();

    const savedProfile = await readLinkedProfile(request, idToken);
    expect(savedProfile.user?.pantryIngredients).toEqual(["rice", "eggs", "soy sauce", "spinach", "black beans"]);
    expect(savedProfile.user?.kitchenEquipment).toEqual(["skillet", "sheet pan"]);
  });
});
