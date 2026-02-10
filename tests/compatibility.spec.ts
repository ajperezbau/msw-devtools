import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - Handler Compatibility", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    await devToolsPage.toggle();
  });

  test("should preserve handlers with non-string paths (RegExp)", async ({
    page,
  }) => {
    // If the app didn't crash, we should be able to see the modal
    await devToolsPage.expectModalVisible();

    // The RegExp handler should NOT be in the registry list (UI)
    const rowsWithRegexHandler = devToolsPage.registryTable
      .getByRole("row")
      .filter({ hasText: "/api/regex-test" });
    await expect(rowsWithRegexHandler).toHaveCount(0);

    // BUT it should still be functional (preserved in MSW)
    const response = await page.evaluate(async () => {
      const resp = await fetch("/api/regex-test");
      return resp.json();
    });
    expect(response).toEqual({ regex: true });
  });

  test("should preserve handlers with unsupported 'all' method", async ({
    page,
  }) => {
    await devToolsPage.expectModalVisible();

    // In main.ts we added: http.all("/api/all-test", ...)
    // It should NOT be in the registry list (UI)
    const rowsWithAllHandler = devToolsPage.registryTable
      .getByRole("row")
      .filter({ hasText: "/api/all-test" });
    await expect(rowsWithAllHandler).toHaveCount(0);

    // BUT it should still be functional (preserved in MSW)
    const response = await page.evaluate(async () => {
      const resp = await fetch("/api/all-test", { method: "POST" });
      return resp.json();
    });
    expect(response).toEqual({ all: true });
  });
});
