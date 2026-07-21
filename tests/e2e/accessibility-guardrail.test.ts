import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "./e2e-test";

const MIN_TAP_TARGET_PX = 44;

async function expectMinimumTapTarget(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, "Expected tappable control to have a rendered bounding box").not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX);
  expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX);
}

function formatAxeViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => node.target.join(" ")).join(", ");
      return `${violation.id} (${violation.impact}): ${violation.help} :: ${nodes}`;
    })
    .join("\n");
}

test.describe("UI accessibility guardrails", () => {
  test("landing auth controls have accessible names and touch-sized targets", async ({ page }) => {
    await page.goto("/");

    const guestButton = page.getByRole("button", { name: "Start cooking now" });
    const googleButton = page.getByRole("button", { name: "Continue with Google" });

    await expect(guestButton).toBeVisible();
    await expect(googleButton).toBeVisible();
    await expectMinimumTapTarget(guestButton);
    await expectMinimumTapTarget(googleButton);

    const axeResults = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const seriousViolations = axeResults.violations.filter((violation) =>
      violation.impact === "serious" || violation.impact === "critical"
    );

    expect(seriousViolations, formatAxeViolations(seriousViolations)).toEqual([]);
  });
});
