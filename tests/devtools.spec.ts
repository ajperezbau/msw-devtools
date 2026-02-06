import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools Plugin", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
  });

  test("should show the devtools toggle button", async () => {
    await devToolsPage.expectVisible();
    await expect(devToolsPage.toggleButton).toHaveAttribute(
      "title",
      /MSW Devtools/,
    );
  });

  test("should open the devtools modal when clicking the toggle button", async () => {
    await devToolsPage.toggle();
    await devToolsPage.expectModalVisible();
    await devToolsPage.expectModalTitle("MSW Devtools");
  });

  test("should open the devtools modal using the keyboard shortcut", async () => {
    await devToolsPage.pressShortcut();
    await devToolsPage.expectModalVisible();
    await devToolsPage.expectModalTitle("MSW Devtools");

    // Toggle off with the same shortcut
    await devToolsPage.pressShortcut();
    await devToolsPage.expectModalHidden();
  });

  test("should close the devtools modal when clicking the close button", async () => {
    await devToolsPage.toggle();
    await devToolsPage.expectModalVisible();
    await devToolsPage.close();
    await devToolsPage.expectModalHidden();
  });

  test("should display registered handlers", async () => {
    await devToolsPage.toggle();

    // Check users handler
    await devToolsPage.expectHandler("users", "GET", "/api/users");

    // Check scenarios for users
    await devToolsPage.expectScenario("users", "default");
    await devToolsPage.expectScenario("users", "empty");
    await devToolsPage.expectScenario("users", "ServerError");

    // Check products handler
    await devToolsPage.expectHandler("products", "POST", "/api/products");
  });

  test("should display handlers registered directly in MSW", async () => {
    await devToolsPage.toggle();

    // Handler registered via setupWorker in src/main.ts
    // We now have both GET and POST for /api/status.
    // The keys are [GET] /api/status and [POST] /api/status.

    const getRow = await devToolsPage.getHandlerRow("[GET] /api/status");
    await devToolsPage.expectHandler("[GET] /api/status", "GET", "/api/status");
    await expect(getRow.locator(".native-indicator")).toHaveText("N");

    const postRow = await devToolsPage.getHandlerRow("[POST] /api/status");
    await devToolsPage.expectHandler(
      "[POST] /api/status",
      "POST",
      "/api/status",
    );
    await expect(postRow.locator(".native-indicator")).toHaveText("N");
  });

  test("should filter handlers by name, url, and method", async ({ page }) => {
    await devToolsPage.toggle();

    // Verify both are present initially
    await expect(await devToolsPage.getHandlerRow("users")).toBeVisible();
    await expect(await devToolsPage.getHandlerRow("products")).toBeVisible();

    // Filter by name (key)
    await devToolsPage.filter("users");
    await expect(await devToolsPage.getHandlerRow("users")).toBeVisible();
    await expect(await devToolsPage.getHandlerRow("products")).toBeHidden();

    // Filter by URL
    await devToolsPage.filter("/api/products");
    await expect(await devToolsPage.getHandlerRow("users")).toBeHidden();
    await expect(await devToolsPage.getHandlerRow("products")).toBeVisible();

    // Filter by Method
    await devToolsPage.filter("GET");
    await expect(await devToolsPage.getHandlerRow("users")).toBeVisible();
    await expect(await devToolsPage.getHandlerRow("products")).toBeHidden();

    // Clear filter
    await devToolsPage.clearFilter();
    await expect(await devToolsPage.getHandlerRow("users")).toBeVisible();
    await expect(await devToolsPage.getHandlerRow("products")).toBeVisible();
  });

  test("should show export and import buttons", async () => {
    await devToolsPage.toggle();
    await expect(devToolsPage.exportButton).toBeVisible();
    await expect(devToolsPage.importButton).toBeVisible();
  });

  // TODO: those tests are flaky/hard to stabilize, review in another moment
  test("should apply per-handler delay", async ({ page }) => {
    await devToolsPage.toggle();
    const delay = 1000;
    await devToolsPage.setHandlerDelay("users", delay);

    // Check delay using semaphore pattern from page object
    await devToolsPage.startDelayedFetch("/api/users");

    // Give it a tiny bit of time to ensure microtasks run.
    await page.waitForTimeout(200);

    // Should NOT be finished immediately
    expect(await devToolsPage.isFetchFinished()).toBe(false);

    // Should be finished after the delay
    await devToolsPage.waitForFetchFinished(2000);
  });

  // TODO: those tests are flaky/hard to stabilize, review in another moment
  test("should apply global delay when handler delay is 0", async ({
    page,
  }) => {
    await devToolsPage.toggle();
    const delay = 1000;
    await devToolsPage.setGlobalDelay(delay);

    // Check delay using semaphore pattern from page object
    await devToolsPage.startDelayedFetch("/api/users");

    // Give it a tiny bit of time to ensure microtasks run.
    await page.waitForTimeout(200);

    // Should NOT be finished immediately
    expect(await devToolsPage.isFetchFinished()).toBe(false);

    // Should be finished after the delay
    await devToolsPage.waitForFetchFinished(2000);
  });

  test("should apply global delay using the number input", async ({ page }) => {
    await devToolsPage.toggle();
    const delay = 800;
    await devToolsPage.globalDelayNumberInput.fill(delay.toString());

    // Check delay using semaphore pattern from page object
    await devToolsPage.startDelayedFetch("/api/users");

    // Give it a tiny bit of time to ensure microtasks run.
    await page.waitForTimeout(200);

    // Should NOT be finished immediately
    expect(await devToolsPage.isFetchFinished()).toBe(false);

    // Should be finished after the delay
    await devToolsPage.waitForFetchFinished(2000);
  });
});
