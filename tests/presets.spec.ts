import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - Presets (Recipes)", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    await devToolsPage.toggle();
  });

  test("should save current state as a preset and apply it later", async ({
    page,
  }) => {
    // 1. Change some scenarios in Registry
    await devToolsPage.selectScenario("users", "empty");
    // products is already default, let's keep it

    // 2. Go to Presets and save
    const presetName = "Empty Users Flow";
    await devToolsPage.saveCurrentAsPreset(presetName);

    // Verify it appeared
    await expect(
      page.locator(".preset-card", { hasText: presetName }),
    ).toBeVisible();

    // 3. Change scenarios back to something else
    await devToolsPage.switchTab("Registry");
    await devToolsPage.selectScenario("users", "default");

    // 4. Apply the preset
    await devToolsPage.applyPreset(presetName);

    // 5. Verify scenarios were updated in Registry
    await devToolsPage.switchTab("Registry");
    const row = await devToolsPage.getHandlerRow("users");
    const select = row.getByRole("combobox");
    await expect(select).toHaveValue("empty");
  });

  test("should delete a custom preset", async ({ page }) => {
    const presetName = "To Be Deleted";
    await devToolsPage.saveCurrentAsPreset(presetName);

    const card = page.locator(".preset-card", { hasText: presetName });
    await expect(card).toBeVisible();

    // Delete it
    await card.getByRole("button", { name: "Delete Preset" }).click();
    await expect(card).not.toBeVisible();
  });

  test("should save a preset with only selected handlers", async ({ page }) => {
    // 1. Change two handlers
    await devToolsPage.selectScenario("users", "empty");
    // status only has "default" but let's assume it's there
    const statusRow = await devToolsPage.getHandlerRow("[GET] /api/status");

    // 2. Open selection mode
    await devToolsPage.switchTab("Registry");
    await page.getByRole("button", { name: "Create Preset" }).click();

    // 3. Select ONLY "users" handler
    const usersRow = await devToolsPage.getHandlerRow("users");
    await usersRow.click();

    // 4. Save the preset
    const presetName = "Only Users Empty";
    await page.getByPlaceholder("Preset name...").fill(presetName);
    await page.getByRole("button", { name: "Save Selected" }).click();

    // 5. Change users back
    await devToolsPage.switchTab("Registry");
    await devToolsPage.selectScenario("users", "default");

    // 6. Change /api/status to something else if we could,
    // but the point is we want to see it NOT change

    // 7. Apply the preset
    await devToolsPage.applyPreset(presetName);

    // 8. Verify ONLY "users" was changed
    await devToolsPage.switchTab("Registry");

    const usersSelect = (await devToolsPage.getHandlerRow("users")).getByRole(
      "combobox",
    );
    await expect(usersSelect).toHaveValue("empty");

    // Verify preset card preview only shows one tag
    await devToolsPage.switchTab("Presets");
    const preview = page
      .locator(".preset-card", { hasText: presetName })
      .locator(".preset-scenarios-preview");
    await expect(preview).toContainText("users: empty");
    await expect(preview).not.toContainText("/api/status");
  });
});
