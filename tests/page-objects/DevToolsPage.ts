import { expect, type Locator, type Page } from "@playwright/test";

export class DevToolsPage {
  readonly page: Page;
  readonly toggleButton: Locator;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly registryTable: Locator;
  readonly searchInput: Locator;
  readonly globalDelayInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toggleButton = page.getByRole("button", {
      name: "Toggle MSW DevTools",
    });
    this.dialog = page.getByRole("dialog");
    this.closeButton = this.dialog.getByRole("button", { name: "Close" });
    this.registryTable = this.dialog.locator("table.registry-table");
    this.searchInput = this.dialog.getByPlaceholder(
      "Filter by key, URL or method...",
    );
    this.globalDelayInput = this.dialog.locator("#global-delay");
  }

  async setGlobalDelay(value: number) {
    // We use fill for sliders if they are range inputs, but sliders sometimes need more specific interaction
    // Since it's a native range input, fill should work, but evaluate is safer for reactivity
    await this.globalDelayInput.evaluate((el: HTMLInputElement, val) => {
      el.value = val.toString();
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }

  async setHandlerDelay(handlerName: string, value: number) {
    const row = await this.getHandlerRow(handlerName);
    const input = row.locator(".handler-delay-input");
    await input.fill(value.toString());
  }

  async filter(query: string) {
    await this.searchInput.fill(query);
  }

  async clearFilter() {
    await this.searchInput.fill("");
  }

  async goto() {
    await this.page.goto("/");
  }

  async toggle() {
    await this.toggleButton.click();
  }

  async pressShortcut() {
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";
    await this.page.keyboard.press(`${modifier}+Shift+M`);
  }

  async close() {
    await this.closeButton.click();
  }

  async startDelayedFetch(url: string) {
    await this.page.evaluate((fetchUrl) => {
      (window as any).fetchFinished = false;
      fetch(fetchUrl).then(() => {
        (window as any).fetchFinished = true;
      });
    }, url);
  }

  async isFetchFinished() {
    return await this.page.evaluate(() => (window as any).fetchFinished);
  }

  async waitForFetchFinished(timeout = 2000) {
    await expect
      .poll(async () => this.isFetchFinished(), {
        timeout,
      })
      .toBe(true);
  }

  async expectVisible() {
    await expect(this.toggleButton).toBeVisible();
  }

  async expectModalVisible() {
    await expect(this.dialog).toBeVisible();
  }

  async expectModalHidden() {
    await expect(this.dialog).not.toBeVisible();
  }

  async expectModalTitle(title: string) {
    await expect(
      this.dialog.getByRole("heading", { name: title }),
    ).toBeVisible();
  }

  async getHandlerRow(name: string) {
    return this.dialog.locator("tr", { hasText: name });
  }

  async expectHandler(name: string, method: string, url: string) {
    const row = await this.getHandlerRow(name);
    await expect(row).toBeVisible();
    await expect(row.getByText(method)).toBeVisible();
    await expect(row.getByText(url)).toBeVisible();
  }

  async expectScenario(handlerName: string, scenarioName: string) {
    const row = await this.getHandlerRow(handlerName);
    const select = row.getByRole("combobox");
    await expect(
      select.locator("option", { hasText: scenarioName }),
    ).toBeAttached();
  }
}
