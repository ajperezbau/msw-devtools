import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - Passthrough Mode", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    // Clear any persisted passthrough state before each test
    await page.evaluate(() => {
      localStorage.removeItem("msw-passthrough-snapshot");
    });
    await devToolsPage.toggle();
  });

  test("should toggle Global Passthrough and log request as REAL API", async ({
    page,
  }) => {
    const dialog = devToolsPage.dialog;

    // Activate global passthrough
    const globalPassthroughBtn = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await globalPassthroughBtn.click();
    await expect(globalPassthroughBtn).toHaveClass(/active/);

    // Close devtools, trigger a fetch, then re-open to check Activity Log
    await devToolsPage.close();
    await page.getByRole("button", { name: /Fetch Users/ }).click();

    await devToolsPage.toggle();
    await devToolsPage.switchTab("Activity Log");

    // The activity log should contain a Real API entry for users
    const logEntry = dialog.getByRole("listitem").filter({
      hasText: "Real API",
    });
    await expect(logEntry.first()).toBeVisible();
  });

  test("should disable delay input when handler is in passthrough scenario", async () => {
    const dialog = devToolsPage.dialog;

    // Change the 'users' handler to the 'passthrough' scenario
    await devToolsPage.selectScenario("users", "passthrough");

    // The delay input for 'users' should be disabled
    const usersRow = await devToolsPage.getHandlerRow("users");
    const delayInput = usersRow.getByRole("spinbutton");
    await expect(delayInput).toBeDisabled();

    // Confirm that delay is enabled for a non-passthrough handler
    const productsRow = await devToolsPage.getHandlerRow("products");
    const productsDelayInput = productsRow.getByRole("spinbutton");
    await expect(productsDelayInput).not.toBeDisabled();

    // Reset users back to default - delay input should re-enable
    await devToolsPage.selectScenario("users", "default");
    await expect(delayInput).not.toBeDisabled();
  });

  test("should disable delay input for all default handlers when Global Passthrough is active", async () => {
    const dialog = devToolsPage.dialog;

    // Activate global passthrough
    const globalPassthroughBtn = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await globalPassthroughBtn.click();
    await expect(globalPassthroughBtn).toHaveClass(/active/);

    // The delay input for 'users' (which is on 'default' scenario) should be disabled
    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("spinbutton")).toBeDisabled();

    // Deactivate global passthrough
    await globalPassthroughBtn.click();
    await expect(globalPassthroughBtn).not.toHaveClass(/active/);

    // Delay input should be re-enabled
    await expect(usersRow.getByRole("spinbutton")).not.toBeDisabled();
  });

  test("should set all handlers to passthrough and restore previous scenarios when toggled off", async () => {
    const dialog = devToolsPage.dialog;

    const usersRow = await devToolsPage.getHandlerRow("users");
    const productsRow = await devToolsPage.getHandlerRow("products");

    const usersSelect = usersRow.getByRole("combobox");
    const productsSelect = productsRow.getByRole("combobox");

    await devToolsPage.selectScenario("users", "empty");
    await expect(usersSelect).toHaveValue("empty");
    await expect(productsSelect).toHaveValue("default");

    const globalPassthroughBtn = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await globalPassthroughBtn.click();

    await expect(usersSelect).toHaveValue("passthrough");
    await expect(productsSelect).toHaveValue("passthrough");

    await globalPassthroughBtn.click();

    await expect(usersSelect).toHaveValue("empty");
    await expect(productsSelect).toHaveValue("default");
  });

  test("should disable Record Passthrough button when no handlers are in passthrough", async () => {
    const dialog = devToolsPage.dialog;

    // Record button should be disabled initially
    const recordBtn = dialog.getByRole("button", {
      name: "Toggle Record Passthrough",
    });
    await expect(recordBtn).toBeVisible();
    await expect(recordBtn).toBeDisabled();

    // Activate global passthrough - record button should be enabled
    const globalPassthroughBtn = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await globalPassthroughBtn.click();
    await expect(recordBtn).toBeEnabled();

    // Deactivate global passthrough - record button should disable
    await globalPassthroughBtn.click();
    await expect(recordBtn).toBeDisabled();

    // Set a handler to passthrough scenario - record button should enable
    await devToolsPage.selectScenario("users", "passthrough");
    await expect(recordBtn).toBeEnabled();

    // Reset handler - record button should disable
    await devToolsPage.selectScenario("users", "default");
    await expect(recordBtn).toBeDisabled();
  });

  test("Record Passthrough should be ephemeral and not persist after page reload", async ({
    page,
  }) => {
    const dialog = devToolsPage.dialog;

    // Activate global passthrough (this IS persisted)
    const globalPassthroughBtn = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await globalPassthroughBtn.click();
    await expect(globalPassthroughBtn).toHaveClass(/active/);

    // Activate record passthrough
    const recordBtn = dialog.getByRole("button", {
      name: "Toggle Record Passthrough",
    });
    await recordBtn.click();
    await expect(recordBtn).toHaveAttribute("aria-pressed", "true");

    // Verify it's NOT saved to localStorage
    const storedRecord = await page.evaluate(() =>
      localStorage.getItem("msw-record-passthrough"),
    );
    expect(storedRecord).toBeNull();

    // Reload the page
    await page.reload();

    // Re-open devtools
    await devToolsPage.toggle();

    // Global passthrough should still be active (persisted via msw-scenarios)
    const globalBtnAfterReload = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await expect(globalBtnAfterReload).toHaveClass(/active/);

    // Record Passthrough button should be visible but NOT active (ephemeral reset)
    const recordBtnAfterReload = dialog.getByRole("button", {
      name: "Toggle Record Passthrough",
    });
    await expect(recordBtnAfterReload).toBeVisible();
    await expect(recordBtnAfterReload).toHaveAttribute("aria-pressed", "false");
  });

  test("should log a network error when recorded passthrough fetch fails", async ({
    page,
  }) => {
    const dialog = devToolsPage.dialog;

    const globalPassthroughBtn = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await globalPassthroughBtn.click();

    const recordBtn = dialog.getByRole("button", {
      name: "Toggle Record Passthrough",
    });
    await recordBtn.click();
    await expect(recordBtn).toHaveAttribute("aria-pressed", "true");

    await page.context().setOffline(true);
    await devToolsPage.close();

    await page.getByRole("button", { name: /Fetch Users/ }).click();
    await expect(page.locator("#response-output")).toContainText(
      "Status: 502 Bad Gateway",
    );

    await page.context().setOffline(false);

    await devToolsPage.toggle();
    await devToolsPage.switchTab("Activity Log");

    await devToolsPage.expectLogEntry({
      method: "GET",
      url: "/api/users",
      key: "users",
      scenario: "❌ Real API (Error Recorded)",
      status: 0,
    });
  });
});
