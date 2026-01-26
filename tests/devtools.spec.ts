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
});
