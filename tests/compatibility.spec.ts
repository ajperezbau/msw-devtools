import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - Handler Compatibility", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    await devToolsPage.toggle();
  });

  test("should preserve and keep functional handlers with RegExp paths", async ({
    page,
  }) => {
    // Verify the RegExp handler is not visible in devtools UI
    await devToolsPage.expectModalVisible();

    // The RegExp handler should NOT be in the registry list
    // Use semantic locators and assert count to avoid false positives
    const rowsWithRegexHandler = devToolsPage.registryTable
      .getByRole("row")
      .filter({ hasText: "/api/regex-test" });
    await expect(rowsWithRegexHandler).toHaveCount(0);

    // But the handler should still be functional in MSW
    const response = await page.evaluate(async () => {
      const res = await fetch("/api/regex-test");
      return res.json();
    });

    expect(response).toEqual({ regex: true });
  });

  test("should preserve and keep functional handlers with unsupported methods", async ({
    page,
  }) => {
    // Verify the http.all handler is not visible in devtools UI
    await devToolsPage.expectModalVisible();

    // In main.ts we added: http.all("/api/all-test", ...)
    // Use semantic locators and assert count to avoid false positives
    const rowsWithAllHandler = devToolsPage.registryTable
      .getByRole("row")
      .filter({ hasText: "/api/all-test" });
    await expect(rowsWithAllHandler).toHaveCount(0);

    // But the handler should still be functional in MSW for different methods
    const getResponse = await page.evaluate(async () => {
      const res = await fetch("/api/all-test", { method: "GET" });
      return res.json();
    });
    expect(getResponse).toEqual({ all: true });

    const postResponse = await page.evaluate(async () => {
      const res = await fetch("/api/all-test", { method: "POST" });
      return res.json();
    });
    expect(postResponse).toEqual({ all: true });
  });
});
