import { expect, test } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("Keyboard Navigation", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
    await devToolsPage.toggle();
  });

  test("modal backdrop stops focusin/focusout events from reaching host-app focus traps", async ({
    page,
  }) => {
    // Simulate a host-app focus trap: a document-level focusin listener that
    // steals focus back to an external element whenever something else is focused.
    await page.evaluate(() => {
      const trap = document.createElement("button");
      trap.id = "external-focus-trap";
      trap.textContent = "External trap target";
      document.body.prepend(trap);

      (window as any).__focusTrapFired = 0;
      document.addEventListener("focusin", () => {
        (window as any).__focusTrapFired++;
        trap.focus();
      });
    });

    // Click the filter input inside DevTools
    await devToolsPage.searchInput.click();

    // The modal backdrop's @focusin.stop must have blocked propagation, so the
    // host-app document listener should never have been invoked.
    const trapFired = await page.evaluate(
      () => (window as any).__focusTrapFired,
    );
    expect(trapFired).toBe(0);

    // The input must still be focused and accept text normally.
    await expect(devToolsPage.searchInput).toBeFocused();
    await devToolsPage.searchInput.type("users");
    await expect(devToolsPage.searchInput).toHaveValue("users");
  });

  test("modal backdrop stops keydown events from reaching host-app global key handlers", async ({
    page,
  }) => {
    // Simulate a host-app global keydown handler that intercepts all key presses.
    await page.evaluate(() => {
      (window as any).__capturedKeys = [] as string[];
      document.addEventListener("keydown", (e) => {
        (window as any).__capturedKeys.push(e.key);
      });
    });

    // Click the filter input inside DevTools and type
    await devToolsPage.searchInput.click();
    await devToolsPage.searchInput.type("abc");

    // The modal backdrop's @keydown.stop must have blocked propagation, so the
    // host-app document listener should not have received the typed keys.
    const capturedKeys = await page.evaluate(
      () => (window as any).__capturedKeys as string[],
    );
    expect(capturedKeys).not.toContain("a");
    expect(capturedKeys).not.toContain("b");
    expect(capturedKeys).not.toContain("c");

    // The input must still contain the typed text.
    await expect(devToolsPage.searchInput).toHaveValue("abc");
  });

  test("ESC key should close Override Modal but keep DevTools open", async ({
    page,
  }) => {
    const handlerName = "users"; // Uses /api/users defined in main.ts

    // 1. Open Override Modal
    await devToolsPage.openOverrideModal(handlerName);

    // Verify override modal is visible
    await expect(
      page.getByText("Override Response:", { exact: false }),
    ).toBeVisible();

    // 2. Press Escape
    await page.keyboard.press("Escape");

    // 3. Verify Override Modal is hidden
    await expect(
      page.getByText("Override Response:", { exact: false }),
    ).not.toBeVisible();

    // 4. Verify DevTools Main Modal is STILL visible
    await devToolsPage.expectModalVisible();

    // 5. Press Escape again
    await page.keyboard.press("Escape");

    // 6. Verify DevTools Main Modal is now hidden
    await devToolsPage.expectModalHidden();
  });

  test("ESC key should close Export Modal but keep DevTools open", async ({
    page,
  }) => {
    // 1. Open Export Modal
    await devToolsPage.exportButton.click();

    // Verify export modal is visible
    await expect(
      page.getByRole("dialog").last().getByText("Export Options"),
    ).toBeVisible();

    // 2. Press Escape
    await page.keyboard.press("Escape");

    // 3. Verify Export Modal is hidden
    await expect(page.getByText("Export Options")).not.toBeVisible();

    // 4. Verify DevTools Main Modal is STILL visible
    await devToolsPage.expectModalVisible();
  });
});
