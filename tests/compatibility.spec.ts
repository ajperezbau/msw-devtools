import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - Handler Compatibility", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    await devToolsPage.toggle();
  });

  test("should ignore handlers with non-string paths (RegExp) and not crash", async ({
    page,
  }) => {
    // If the app didn't crash, we should be able to see the modal
    await devToolsPage.expectModalVisible();

    // The RegExp handler should NOT be in the registry list
    await expect(
      page.locator(".handler-row", { hasText: "/api/regex-test" }),
    ).not.toBeVisible();
  });

  test("should ignore handlers with unsupported 'all' method and not crash", async ({
    page,
  }) => {
    await devToolsPage.expectModalVisible();

    // In main.ts we added: http.all("/api/all-test", ...)
    await expect(
      page.locator(".handler-row", { hasText: "/api/all-test" }),
    ).not.toBeVisible();
  });
});
