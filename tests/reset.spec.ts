import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - Reset All", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    await devToolsPage.toggle();
  });

  test("should reset both native and normal handlers to their defaults", async ({
    page,
  }) => {
    // 1. Setup states for normal handler
    await devToolsPage.selectScenario("users", "empty");
    await devToolsPage.setHandlerDelay("users", 500);

    // 2. Setup states for native handler
    // Create a custom scenario for native handler to have something to reset from
    await devToolsPage.openOverrideModal("[GET] /api/status");
    await devToolsPage.fillOverrideBody(JSON.stringify({ status: "custom" }));
    await devToolsPage.saveOverride("Custom Status");

    // Verify it changed to the new custom scenario
    const nativeRow = await devToolsPage.getHandlerRow("[GET] /api/status");
    await expect(nativeRow.getByRole("combobox")).toHaveValue("Custom Status");

    // 3. Setup manual override (non-reusable)
    await devToolsPage.openOverrideModal("products");
    await devToolsPage.fillOverrideBody(JSON.stringify({ manual: true }));
    await devToolsPage.saveOverride();
    const productsRow = await devToolsPage.getHandlerRow("products");
    await expect(productsRow.locator(".override-indicator")).toBeVisible();

    // 4. Set global delay
    await devToolsPage.setGlobalDelay(1000);

    // 5. Create a preset
    await devToolsPage.saveCurrentAsPreset("Test Preset");
    await devToolsPage.switchTab("Presets");
    await expect(page.locator(".presets-list-item")).toHaveCount(1);
    await devToolsPage.switchTab("Registry");

    // 6. Perform Reset All
    await devToolsPage.resetAll();

    // 7. Verify Reset Results
    // Normal handler should be back to 'default'
    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("combobox")).toHaveValue("default");
    await expect(usersRow.getByRole("spinbutton")).toHaveValue("0");

    // Manual override should be gone
    const productsRowReset = await devToolsPage.getHandlerRow("products");
    await expect(productsRowReset.getByRole("combobox")).toHaveValue("default");
    await expect(productsRowReset.locator(".override-indicator")).toBeHidden();

    // Native handler should be back to 'original'
    const statusRow = await devToolsPage.getHandlerRow("[GET] /api/status");
    await expect(statusRow.getByRole("combobox")).toHaveValue("original");
    // Custom scenario should be gone from the list
    await expect(
      statusRow.locator("option", { hasText: "Custom Status" }),
    ).not.toBeAttached();

    // Global delay should be 0
    await expect(devToolsPage.globalDelayNumberInput).toHaveValue("0");

    // Presets should be empty
    await devToolsPage.switchTab("Presets");
    await expect(page.locator(".presets-list-item")).toHaveCount(0);
  });

  test("should reset only scenarios when using 'Reset Scenarios Only'", async ({
    page,
  }) => {
    // 1. Setup states
    await devToolsPage.selectScenario("users", "empty");
    await devToolsPage.setHandlerDelay("users", 500);
    await devToolsPage.setGlobalDelay(1000);
    await devToolsPage.saveCurrentAsPreset("Test Preset");

    // Switch back to Registry to add manual override
    await devToolsPage.switchTab("Registry");

    // Add a manual override
    await devToolsPage.openOverrideModal("products");
    await devToolsPage.fillOverrideBody(JSON.stringify({ manual: true }));
    await devToolsPage.saveOverride();
    await expect(page.locator(".override-indicator")).toBeVisible();

    // 2. Perform Reset Scenarios Only
    await devToolsPage.resetScenariosOnly();

    // 3. Switch back to Registry to verify
    await devToolsPage.switchTab("Registry");

    // 4. Verify Results
    // Normal handler should be back to 'default'
    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("combobox")).toHaveValue("default");

    // Manual override should be gone
    await expect(page.locator(".override-indicator")).toBeHidden();

    // BUT Delay should still be there
    await expect(usersRow.getByRole("spinbutton")).toHaveValue("500");

    // Global delay should still be 1000
    await expect(devToolsPage.globalDelayNumberInput).toHaveValue("1000");

    // Presets should still exist
    await devToolsPage.switchTab("Presets");
    await expect(page.locator(".presets-list-item")).toHaveCount(1);
  });

  test("should NOT reset when confirmation is cancelled", async ({ page }) => {
    // 1. Setup states
    await devToolsPage.selectScenario("users", "empty");

    // 2. Click Reset -> Reset All but cancel confirmation
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Reset All (Full)" }).click();

    // 3. Verify state is NOT reset
    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("combobox")).toHaveValue("empty");

    // Verify menu is closed
    await expect(
      page.getByRole("button", { name: "Reset All (Full)" }),
    ).toBeHidden();
  });

  test("should close reset menu when clicking outside", async ({ page }) => {
    // 1. Open the reset menu
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Reset Scenarios Only" }),
    ).toBeVisible();

    // 2. Click outside (e.g., on the search input)
    const devToolsPage = new DevToolsPage(page);
    await devToolsPage.searchInput.click();

    // 3. Verify menu is closed
    await expect(
      page.getByRole("button", { name: "Reset Scenarios Only" }),
    ).toBeHidden();
  });
});
