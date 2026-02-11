import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("MSW DevTools - Export and Import", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    await devToolsPage.toggle();
  });

  test("should handle 'Select All' logic in export dialog", async () => {
    await devToolsPage.openExportDialog();

    // Default: all checked
    await devToolsPage.expectExportOption("Select All", true);
    await devToolsPage.expectExportOption("Active Scenarios Selection", true);
    await devToolsPage.expectExportOption("Handler Delays", true);
    await devToolsPage.expectExportOption("Custom Presets (Recipes)", true);

    // Uncheck one -> Select All becomes unchecked
    await devToolsPage.toggleExportOption("Handler Delays");
    await devToolsPage.expectExportOption("Select All", false);
    await devToolsPage.expectExportOption("Handler Delays", false);

    // Check it back -> Select All becomes checked
    await devToolsPage.toggleExportOption("Handler Delays");
    await devToolsPage.expectExportOption("Select All", true);

    // Uncheck Select All -> Everything becomes unchecked
    await devToolsPage.toggleExportOption("Select All");
    await devToolsPage.expectExportOption("Select All", false);
    await devToolsPage.expectExportOption("Active Scenarios Selection", false);
    await devToolsPage.expectExportOption("Handler Delays", false);
    await devToolsPage.expectExportOption("Custom Presets (Recipes)", false);

    // Download button should be disabled when nothing is selected
    const downloadBtn = devToolsPage.dialog.getByRole("button", {
      name: "Download JSON",
    });
    await expect(downloadBtn).toBeDisabled();
  });

  test("should export a JSON file", async () => {
    await devToolsPage.openExportDialog();
    const download = await devToolsPage.downloadExport();

    expect(download.suggestedFilename()).toMatch(/^msw-scenarios-.+\.json$/);

    // Optional: read the file to ensure it's valid JSON
    const downloadPath = await download.path();
    const content = JSON.parse(fs.readFileSync(downloadPath!, "utf8"));
    expect(content).toHaveProperty("version", 1);
    expect(content).toHaveProperty("timestamp");
    expect(content).toHaveProperty("scenarios");
  });

  test("should export custom presets", async () => {
    // 1. Create a custom preset first
    const presetName = "Export Test Preset";
    await devToolsPage.saveCurrentAsPreset(presetName);

    // 2. Export
    await devToolsPage.openExportDialog();
    const download = await devToolsPage.downloadExport();
    const downloadPath = await download.path();
    const content = JSON.parse(fs.readFileSync(downloadPath!, "utf8"));

    // 3. Verify presets are in the JSON
    expect(content).toHaveProperty("customPresets");
    const presets = content.customPresets;
    expect(Array.isArray(presets)).toBe(true);
    const myPreset = presets.find((p: any) => p.name === presetName);
    expect(myPreset).toBeDefined();
    expect(myPreset.scenarios).toBeDefined();
  });

  test("should import settings from a JSON file", async ({ page }) => {
    const testData = {
      scenarios: {
        users: "empty",
      },
      delays: {
        users: 555,
      },
      customPresets: [
        {
          name: "Imported Preset",
          scenarios: { users: "empty" },
        },
      ],
      globalDelay: 123,
      version: 1,
    };

    const tempFilePath = path.join(__dirname, "temp-import.json");
    fs.writeFileSync(tempFilePath, JSON.stringify(testData));

    // Handle alert that appears after import
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("imported successfully");
      await dialog.accept();
    });

    await devToolsPage.importFile(tempFilePath);

    // Verify changes (page reloads, so we need to toggle again)
    await devToolsPage.toggle();

    // Check scenario
    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("combobox")).toHaveValue("empty");

    // Check local delay
    await expect(usersRow.getByRole("spinbutton")).toHaveValue("555");

    // Check global delay
    await expect(devToolsPage.globalDelayNumberInput).toHaveValue("123");

    // Check preset
    await devToolsPage.switchTab("Presets");
    await expect(
      page.locator(".presets-list-item", { hasText: "Imported Preset" }),
    ).toBeVisible();

    // Cleanup
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test("should export and import custom scenarios (JSON)", async ({ page }) => {
    // 1. Manually add a custom scenario via UI if possible (or mocking state)
    // Actually, for this test, we can just import a file with customScenarios and see if it appears
    const customScenarioData = {
      customScenarios: {
        users: {
          "My Custom Scenario": {
            body: '{"foo": "bar"}',
            status: 201,
          },
        },
      },
      scenarios: {
        users: "My Custom Scenario",
      },
      version: 1,
    };

    const customFilePath = path.join(__dirname, "custom-import.json");
    fs.writeFileSync(customFilePath, JSON.stringify(customScenarioData));

    page.on("dialog", (dialog) => dialog.accept());

    await devToolsPage.importFile(customFilePath);
    await devToolsPage.toggle();

    // Verify the custom scenario exists and is selected
    const row = await devToolsPage.getHandlerRow("users");
    const select = row.getByRole("combobox");
    await expect(select).toHaveValue("My Custom Scenario");

    // Optional: verify it appears in the list of options
    await expect(
      select.locator("option", { hasText: "My Custom Scenario" }),
    ).toBeAttached();

    // Cleanup
    if (fs.existsSync(customFilePath)) {
      fs.unlinkSync(customFilePath);
    }
  });

  test("should handle invalid JSON import", async ({ page }) => {
    const invalidFilePath = path.join(__dirname, "invalid.json");
    fs.writeFileSync(invalidFilePath, "not a json");

    // Handle error alert
    const dialogPromise = page.waitForEvent("dialog");
    await devToolsPage.importFile(invalidFilePath);
    const dialog = await dialogPromise;

    expect(dialog.message()).toContain("Failed to import");
    await dialog.accept();

    // Cleanup
    if (fs.existsSync(invalidFilePath)) {
      fs.unlinkSync(invalidFilePath);
    }
  });
});
