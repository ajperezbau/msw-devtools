import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools Dragging", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
  });

  test("should be able to drag the toggle button", async ({ page }) => {
    const button = devToolsPage.toggleButton;

    const initialBox = await button.boundingBox();
    expect(initialBox).not.toBeNull();

    if (initialBox) {
      // Drag the button
      const targetX = initialBox.x - 100;
      const targetY = initialBox.y - 100;

      await button.hover();
      await page.mouse.down();
      await page.mouse.move(targetX, targetY, { steps: 10 });
      await page.mouse.up();

      const finalBox = await button.boundingBox();
      expect(finalBox).not.toBeNull();

      if (finalBox) {
        // Allow for some small deviation if constrained or due to padding
        expect(finalBox.x).toBeLessThan(initialBox.x);
        expect(finalBox.y).toBeLessThan(initialBox.y);
      }
    }
  });

  test("should persist position after reload", async ({ page }) => {
    const button = devToolsPage.toggleButton;

    const initialBox = await button.boundingBox();
    expect(initialBox).not.toBeNull();

    if (initialBox) {
      const targetX = 100;
      const targetY = 100;

      await button.hover();
      await page.mouse.down();
      await page.mouse.move(targetX, targetY, { steps: 10 });
      await page.mouse.up();

      const boxBeforeReload = await button.boundingBox();

      await page.reload();
      await devToolsPage.expectVisible();

      const boxAfterReload = await button.boundingBox();

      expect(boxAfterReload).not.toBeNull();
      if (boxAfterReload && boxBeforeReload) {
        expect(Math.abs(boxAfterReload.x - boxBeforeReload.x)).toBeLessThan(2);
        expect(Math.abs(boxAfterReload.y - boxBeforeReload.y)).toBeLessThan(2);
      }
    }
  });

  test("should keep position while in viewport and restore when viewport grows again", async ({ page }) => {
    const button = devToolsPage.toggleButton;

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    const initialBox = await button.boundingBox();
    expect(initialBox).not.toBeNull();

    if (!initialBox) return;

    // Move the button roughly to the center of the screen
    const targetX = viewport.width / 2;
    const targetY = viewport.height / 2;

    await button.hover();
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 10 });
    await page.mouse.up();

    const boxBeforeResize = await button.boundingBox();
    expect(boxBeforeResize).not.toBeNull();
    if (!boxBeforeResize) return;

    // Shrink the viewport slightly but keep the button within the viewport
    const slightlySmallerViewport = {
      width: viewport.width - 50,
      height: viewport.height - 50,
    };
    await page.setViewportSize(slightlySmallerViewport);
    await page.waitForTimeout(100);

    const boxAfterSmallResize = await button.boundingBox();
    expect(boxAfterSmallResize).not.toBeNull();
    if (!boxAfterSmallResize) return;

    // Position should remain effectively the same while still inside viewport
    expect(Math.abs(boxAfterSmallResize.x - boxBeforeResize.x)).toBeLessThan(6);
    expect(Math.abs(boxAfterSmallResize.y - boxBeforeResize.y)).toBeLessThan(6);

    // Now shrink significantly so the previous preferred position would be outside viewport,
    // forcing the button to move (clamp)
    const verySmallViewport = {
      width: Math.max(200, Math.floor(boxBeforeResize.x + 40)),
      height: Math.max(200, Math.floor(boxBeforeResize.y + 40)),
    };
    await page.setViewportSize(verySmallViewport);
    await page.waitForTimeout(100);

    const boxAfterVerySmallResize = await button.boundingBox();
    expect(boxAfterVerySmallResize).not.toBeNull();
    if (!boxAfterVerySmallResize) return;

    // After going out of viewport, the button should have moved
    expect(
      Math.abs(boxAfterVerySmallResize.x - boxBeforeResize.x) > 10 ||
        Math.abs(boxAfterVerySmallResize.y - boxBeforeResize.y) > 10,
    ).toBeTruthy();

    // Restore original viewport size
    await page.setViewportSize(viewport);
    await page.waitForTimeout(100);

    const boxAfterRestore = await button.boundingBox();
    expect(boxAfterRestore).not.toBeNull();
    if (!boxAfterRestore) return;

    // When viewport grows again, the button should return close to its original position
    expect(Math.abs(boxAfterRestore.x - boxBeforeResize.x)).toBeLessThan(4);
    expect(Math.abs(boxAfterRestore.y - boxBeforeResize.y)).toBeLessThan(4);
  });
});
