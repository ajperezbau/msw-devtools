import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - Passthrough Mode", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    // Clear any persisted passthrough state before each test
    await page.evaluate(() => {
      localStorage.removeItem("msw-global-passthrough");
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
    await expect(globalPassthroughBtn).toHaveAttribute("aria-pressed", "true");

    // Close devtools, trigger a fetch, then re-open to check Activity Log
    await devToolsPage.close();
    await page.getByRole("button", { name: /Fetch Users/ }).click();

    await devToolsPage.toggle();
    await devToolsPage.switchTab("Activity Log");

    // The activity log should contain a REAL API (Passthrough) entry for users
    const logEntry = dialog.getByRole("listitem").filter({
      hasText: "REAL API",
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
    await expect(globalPassthroughBtn).toHaveAttribute("aria-pressed", "true");

    // The delay input for 'users' (which is on 'default' scenario) should be disabled
    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("spinbutton")).toBeDisabled();

    // Deactivate global passthrough
    await globalPassthroughBtn.click();
    await expect(globalPassthroughBtn).toHaveAttribute("aria-pressed", "false");

    // Delay input should be re-enabled
    await expect(usersRow.getByRole("spinbutton")).not.toBeDisabled();
  });

  test("should show Record Passthrough button only when Global Passthrough is active or a handler is in passthrough", async () => {
    const dialog = devToolsPage.dialog;

    // Record button should NOT be visible initially
    const recordBtn = dialog.getByRole("button", {
      name: "Toggle Record Passthrough",
    });
    await expect(recordBtn).not.toBeVisible();

    // Activate global passthrough - record button should appear
    const globalPassthroughBtn = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await globalPassthroughBtn.click();
    await expect(recordBtn).toBeVisible();

    // Deactivate global passthrough - record button should disappear
    await globalPassthroughBtn.click();
    await expect(recordBtn).not.toBeVisible();

    // Set a handler to passthrough scenario - record button should appear
    await devToolsPage.selectScenario("users", "passthrough");
    await expect(recordBtn).toBeVisible();

    // Reset handler - record button should disappear
    await devToolsPage.selectScenario("users", "default");
    await expect(recordBtn).not.toBeVisible();
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
    await expect(globalPassthroughBtn).toHaveAttribute("aria-pressed", "true");

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

    // Global passthrough should still be active (persisted)
    const globalBtnAfterReload = dialog.getByRole("button", {
      name: "Toggle Global Passthrough",
    });
    await expect(globalBtnAfterReload).toHaveAttribute("aria-pressed", "true");

    // Record Passthrough button should be visible but NOT active (ephemeral reset)
    const recordBtnAfterReload = dialog.getByRole("button", {
      name: "Toggle Record Passthrough",
    });
    await expect(recordBtnAfterReload).toBeVisible();
    await expect(recordBtnAfterReload).toHaveAttribute("aria-pressed", "false");
  });
});
