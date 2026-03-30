import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - QA Mode", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
  });

  test("should default handlers to passthrough when configured globally", async () => {
    await devToolsPage.goto(
      "/?initialScenarioMode=passthrough&persistence=none",
    );
    await devToolsPage.toggle();

    const usersRow = await devToolsPage.getHandlerRow("users");
    const productsRow = await devToolsPage.getHandlerRow("products");

    await expect(usersRow.getByRole("combobox")).toHaveValue("passthrough");
    await expect(productsRow.getByRole("combobox")).toHaveValue("passthrough");
    await expect(
      devToolsPage.dialog.getByRole("button", {
        name: "Toggle Global Passthrough",
      }),
    ).toHaveClass(/active/);
  });

  test("should persist scenario state in sessionStorage across reloads", async ({
    page,
  }) => {
    await devToolsPage.goto("/?persistence=session");
    await devToolsPage.toggle();
    await devToolsPage.selectScenario("users", "empty");

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return JSON.parse(
            window.sessionStorage.getItem("msw-scenarios") || "{}",
          ).users;
        });
      })
      .toBe("empty");
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return window.localStorage.getItem("msw-scenarios");
        });
      })
      .toBeNull();

    await page.reload();
    await devToolsPage.toggle();

    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("combobox")).toHaveValue("empty");
  });

  test("should allow split persistence across runtime, preferences, and authored data", async ({
    page,
  }) => {
    await devToolsPage.goto(
      "/?runtimeState=session&userPreferences=local&authoredData=local",
    );
    await devToolsPage.toggle();

    await devToolsPage.selectScenario("users", "empty");
    await devToolsPage.filter("users");
    await page.getByRole("button", { name: "Switch to Light Mode" }).click();
    await devToolsPage.saveCurrentAsPreset("Personal QA");

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return JSON.parse(
            window.sessionStorage.getItem("msw-scenarios") || "{}",
          ).users;
        });
      })
      .toBe("empty");
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return window.localStorage.getItem("msw-scenarios-filter");
        });
      })
      .toBe("users");
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return window.localStorage.getItem("msw-devtools-theme");
        });
      })
      .toBe("light");
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return window.localStorage.getItem("msw-custom-presets");
        });
      })
      .toContain("Personal QA");
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return window.sessionStorage.getItem("msw-custom-presets");
        });
      })
      .toBeNull();

    await page.reload();
    await devToolsPage.toggle();

    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("combobox")).toHaveValue("empty");
    await expect(devToolsPage.searchInput).toHaveValue("users");
    await expect(
      page.getByRole("button", { name: "Switch to Dark Mode" }),
    ).toBeVisible();

    await devToolsPage.switchTab("Presets");
    await expect(page.locator(".presets-list-item")).toContainText(
      "Personal QA",
    );
  });

  test("should skip persistence entirely when configured with none", async ({
    page,
  }) => {
    await devToolsPage.goto("/?persistence=none");
    await devToolsPage.toggle();
    await devToolsPage.selectScenario("users", "empty");

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return window.localStorage.getItem("msw-scenarios");
        });
      })
      .toBeNull();
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return window.sessionStorage.getItem("msw-scenarios");
        });
      })
      .toBeNull();

    await page.reload();
    await devToolsPage.toggle();

    const usersRow = await devToolsPage.getHandlerRow("users");
    await expect(usersRow.getByRole("combobox")).toHaveValue("default");
  });
});
