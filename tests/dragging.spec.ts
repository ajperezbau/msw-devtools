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

  test("should keep relative position after window resize", async ({ page }) => {
    const button = devToolsPage.toggleButton;

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    const initialBox = await button.boundingBox();
    expect(initialBox).not.toBeNull();

    if (!initialBox) return;

    // Move the button to a non-trivial position (near bottom-right)
    const targetX = viewport.width - 120;
    const targetY = viewport.height - 120;

    await button.hover();
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 10 });
    await page.mouse.up();

    const boxBeforeResize = await button.boundingBox();
    expect(boxBeforeResize).not.toBeNull();
    if (!boxBeforeResize) return;

    // Shrink the viewport
    const smallerViewport = {
      width: viewport.width - 200,
      height: viewport.height - 200,
    };
    await page.setViewportSize(smallerViewport);

    // Allow layout to settle
    await page.waitForTimeout(100);

    // Restore original viewport size
    await page.setViewportSize(viewport);
    await page.waitForTimeout(100);

    const boxAfterResize = await button.boundingBox();
    expect(boxAfterResize).not.toBeNull();
    if (!boxAfterResize) return;

    // Position should remain effectively the same (within a small tolerance)
    expect(Math.abs(boxAfterResize.x - boxBeforeResize.x)).toBeLessThan(4);
    expect(Math.abs(boxAfterResize.y - boxBeforeResize.y)).toBeLessThan(4);
  });
});
