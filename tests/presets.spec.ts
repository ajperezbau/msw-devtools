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

    // Verify it appeared in the list
    await devToolsPage.switchTab("Presets");
    const listItem = page.locator(".presets-list-item", { hasText: presetName });
    await expect(listItem).toBeVisible();
    await listItem.click();

    // Verify detail panel shows the correct info
    const detailPanel = page.locator(".presets-detail");
    await expect(
      detailPanel.locator(".preset-name", { hasText: presetName }),
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

    await devToolsPage.switchTab("Presets");
    const listItem = page.locator(".presets-list-item", { hasText: presetName });
    await expect(listItem).toBeVisible();
    await listItem.click();

    // Delete it from the detail panel
    const detailPanel = page.locator(".presets-detail");
    await detailPanel.getByRole("button", { name: "Delete preset" }).click();
    await expect(listItem).not.toBeVisible();
  });

  test("should switch between presets and update the detail panel", async ({
    page,
  }) => {
    // 1. Create two presets
    const presetA = "Preset Alpha";
    const presetB = "Preset Beta";

    await devToolsPage.selectScenario("users", "empty");
    await devToolsPage.saveCurrentAsPreset(presetA);

    await devToolsPage.switchTab("Registry");
    await devToolsPage.selectScenario("users", "default");
    await devToolsPage.saveCurrentAsPreset(presetB);

    // 2. Go to presets tab
    await devToolsPage.switchTab("Presets");

    // 3. Click on Preset Alpha and verify detail
    await page.locator(".presets-list-item", { hasText: presetA }).click();
    const detailPanel = page.locator(".presets-detail");
    await expect(
      detailPanel.locator(".preset-name", { hasText: presetA }),
    ).toBeVisible();
    await expect(detailPanel).toContainText("empty");
    await expect(detailPanel).toContainText("users");

    // 4. Click on Preset Beta and verify detail updates
    await page.locator(".presets-list-item", { hasText: presetB }).click();
    await expect(
      detailPanel.locator(".preset-name", { hasText: presetB }),
    ).toBeVisible();
    await expect(detailPanel).toContainText("default");
    await expect(detailPanel).toContainText("users");
  });

  test("should save a preset with only selected handlers", async ({ page }) => {
    // 1. Change two handlers
    await devToolsPage.selectScenario("users", "empty");
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

    // 7. Apply the preset
    await devToolsPage.applyPreset(presetName);

    // 8. Verify ONLY "users" was changed
    await devToolsPage.switchTab("Registry");

    const usersSelect = (await devToolsPage.getHandlerRow("users")).getByRole(
      "combobox",
    );
    await expect(usersSelect).toHaveValue("empty");

    // Verify preset detail only shows one tag
    await devToolsPage.switchTab("Presets");
    await page.locator(".presets-list-item", { hasText: presetName }).click();
    const detail = page.locator(".presets-detail");
    await expect(detail).toContainText("empty");
    await expect(detail).toContainText("users");
    await expect(detail).not.toContainText("/api/status");
  });

  test("should render the method badge in the preset detail", async ({
    page,
  }) => {
    // 1. Create a preset
    const presetName = "Method Badge Test";
    await devToolsPage.saveCurrentAsPreset(presetName);

    // 2. Go to Presets tab
    await devToolsPage.switchTab("Presets");
    await page.locator(".presets-list-item", { hasText: presetName }).click();

    // 3. Verify the method badge is visible in the preview tags in the detail panel
    const detail = page.locator(".presets-detail");
    await expect(detail).toBeVisible();

    const previewTag = detail.locator(".preview-tag").first();
    await expect(previewTag).toBeVisible();

    const methodBadge = previewTag.locator(".method-badge");
    await expect(methodBadge).toBeVisible();

    // It should contain a valid method like GET or POST
    const methodText = await methodBadge.innerText();
    expect(["GET", "POST", "PUT", "PATCH", "DELETE"]).toContain(methodText);
  });
});
