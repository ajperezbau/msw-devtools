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
    // Use semantic locators and assert count to avoid false positives
    const rowsWithRegexHandler = devToolsPage.registryTable
      .getByRole("row")
      .filter({ hasText: "/api/regex-test" });
    await expect(rowsWithRegexHandler).toHaveCount(0);
  });

  test("should ignore handlers with unsupported 'all' method and not crash", async ({
    page,
  }) => {
    await devToolsPage.expectModalVisible();

    // In main.ts we added: http.all("/api/all-test", ...)
    // Use semantic locators and assert count to avoid false positives
    const rowsWithAllHandler = devToolsPage.registryTable
      .getByRole("row")
      .filter({ hasText: "/api/all-test" });
    await expect(rowsWithAllHandler).toHaveCount(0);
  });
});
