import {
  expect,
  test as base,
  type Response,
} from "@playwright/test";

type UnexpectedRateLimitResponse = {
  frameUrl: string | null;
  method: string;
  project: string;
  resourceType: string;
  retry: number;
  status: number;
  statusText: string;
  test: string;
  url: string;
};

function frameUrlForResponse(response: Response): string | null {
  try {
    return response.request().frame().url();
  } catch {
    return null;
  }
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const unexpectedRateLimits: UnexpectedRateLimitResponse[] = [];
    const onResponse = (response: Response) => {
      if (response.status() !== 429) {
        return;
      }

      const request = response.request();
      const diagnostic: UnexpectedRateLimitResponse = {
        frameUrl: frameUrlForResponse(response),
        method: request.method(),
        project: testInfo.project.name,
        resourceType: request.resourceType(),
        retry: testInfo.retry,
        status: response.status(),
        statusText: response.statusText(),
        test: testInfo.titlePath.join(" > "),
        url: response.url(),
      };

      unexpectedRateLimits.push(diagnostic);
      console.error(`[e2e][unexpected-429] ${JSON.stringify(diagnostic)}`);
    };

    page.on("response", onResponse);

    try {
      await use(page);
    } finally {
      page.off("response", onResponse);

      if (unexpectedRateLimits.length > 0) {
        await testInfo.attach("unexpected-429-responses", {
          body: Buffer.from(JSON.stringify(unexpectedRateLimits, null, 2)),
          contentType: "application/json",
        });

        throw new Error(
          `Unexpected HTTP 429 response(s) during E2E: ${unexpectedRateLimits
            .map(({ method, url }) => `${method} ${url}`)
            .join(", ")}`,
        );
      }
    }
  },
});

export { expect };
export type { APIRequestContext, Locator, Page } from "@playwright/test";
