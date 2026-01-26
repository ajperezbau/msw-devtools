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
      /MSW Handler Registry/,
    );
  });

  test("should open the devtools modal when clicking the toggle button", async () => {
    await devToolsPage.toggle();
    await devToolsPage.expectModalVisible();
    await devToolsPage.expectModalTitle("MSW Handler Registry");
  });

  test("should open the devtools modal using the keyboard shortcut", async () => {
    await devToolsPage.pressShortcut();
    await devToolsPage.expectModalVisible();
    await devToolsPage.expectModalTitle("MSW Handler Registry");

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

  test("should filter handlers by name, url, and method", async ({ page }) => {
    await devToolsPage.toggle();

    // Verify both are present initially
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "users" }),
    ).toBeVisible();
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "products" }),
    ).toBeVisible();

    // Filter by name (key)
    await devToolsPage.filter("users");
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "users" }),
    ).toBeVisible();
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "products" }),
    ).toBeHidden();

    // Filter by URL
    await devToolsPage.filter("/api/products");
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "users" }),
    ).toBeHidden();
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "products" }),
    ).toBeVisible();

    // Filter by Method
    await devToolsPage.filter("GET");
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "users" }),
    ).toBeVisible();
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "products" }),
    ).toBeHidden();

    // Clear filter
    await devToolsPage.clearFilter();
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "users" }),
    ).toBeVisible();
    await expect(
      devToolsPage.dialog.locator("tr", { hasText: "products" }),
    ).toBeVisible();
  });

  test("should apply per-handler delay", async () => {
    await devToolsPage.toggle();
    const delay = 1000;
    await devToolsPage.setHandlerDelay("users", delay);

    // Check delay using semaphore pattern from page object
    await devToolsPage.startDelayedFetch("/api/users");

    // Should NOT be finished immediately
    expect(await devToolsPage.isFetchFinished()).toBe(false);

    // Should be finished after the delay
    await devToolsPage.waitForFetchFinished(2000);
  });

  test("should apply global delay when handler delay is 0", async () => {
    await devToolsPage.toggle();
    const delay = 1000;
    await devToolsPage.setGlobalDelay(delay);

    // Check delay using semaphore pattern from page object
    await devToolsPage.startDelayedFetch("/api/users");

    // Should NOT be finished immediately
    expect(await devToolsPage.isFetchFinished()).toBe(false);

    // Should be finished after the delay
    await devToolsPage.waitForFetchFinished(2000);
  });
});
