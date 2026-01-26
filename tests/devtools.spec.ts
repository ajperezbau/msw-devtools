import { test, expect } from "@playwright/test";

test.describe("MSW DevTools Plugin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should show the devtools toggle button", async ({ page }) => {
    const toggleButton = page.getByRole("button", {
      name: "Toggle MSW DevTools",
    });
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toHaveAttribute("title", /MSW Handler Registry/);
  });

  test("should open the devtools modal when clicking the toggle button", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Toggle MSW DevTools" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const title = dialog.getByRole("heading", { name: "MSW Handler Registry" });
    await expect(title).toBeVisible();
  });

  test("should close the devtools modal when clicking the close button", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Toggle MSW DevTools" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).not.toBeVisible();
  });
});
