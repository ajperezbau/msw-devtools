import { expect, test, type Page } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

const stabilizeUi = async (page: Page) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content: "* { animation: none !important; transition: none !important; }",
  });
};

test.describe("MSW DevTools - Visual Regression", () => {
  let devToolsPage: DevToolsPage;

  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    await stabilizeUi(page);
  });

  test("registry screen", async () => {
    await devToolsPage.toggle();
    await devToolsPage.expectModalVisible();

    await expect(devToolsPage.dialog).toHaveScreenshot("devtools-registry.png");
  });

  test("activity log screen", async ({ page }) => {
    await devToolsPage.fetchUsersButton.click();
    await devToolsPage.toggle();
    await devToolsPage.switchTab("Activity Log");
    await devToolsPage.expectLogEntry({
      method: "GET",
      url: "/api/users",
      key: "users",
      scenario: "default",
      status: 200,
    });

    await expect(devToolsPage.dialog).toHaveScreenshot(
      "devtools-activity-log.png",
      {
        mask: [page.locator(".log-time")],
      },
    );
  });

  test("activity log expanded screen", async ({ page }) => {
    await devToolsPage.fetchProductsButton.click();
    await devToolsPage.toggle();
    await devToolsPage.switchTab("Activity Log");
    await devToolsPage.expandLogEntry("/api/products");

    await expect(devToolsPage.dialog).toHaveScreenshot(
      "devtools-activity-log-expanded.png",
      {
        mask: [page.locator(".log-time")],
      },
    );
  });

  test("presets screen", async ({ page }) => {
    const presetName = "Visual Preset";
    await devToolsPage.toggle();
    await devToolsPage.saveCurrentAsPreset(presetName);
    await devToolsPage.switchTab("Presets");
    await expect(
      page.locator(".preset-card", { hasText: presetName }),
    ).toBeVisible();

    await expect(devToolsPage.dialog).toHaveScreenshot("devtools-presets.png");
  });

  test("export dialog screen", async () => {
    await devToolsPage.toggle();
    await devToolsPage.openExportDialog();
    await expect(
      devToolsPage.dialog.getByRole("button", { name: "Download JSON" }),
    ).toBeVisible();

    await expect(devToolsPage.dialog).toHaveScreenshot(
      "devtools-export-dialog.png",
    );
  });

  test("override modal screen", async () => {
    await devToolsPage.toggle();
    await devToolsPage.openOverrideModal("users");
    await expect(
      devToolsPage.dialog.getByRole("button", {
        name: "Save & Enable Override",
      }),
    ).toBeVisible();

    await expect(devToolsPage.dialog).toHaveScreenshot(
      "devtools-override-modal.png",
    );
  });
});
