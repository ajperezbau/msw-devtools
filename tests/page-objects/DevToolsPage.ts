import { expect, type Locator, type Page } from "@playwright/test";

export class DevToolsPage {
  readonly page: Page;
  readonly toggleButton: Locator;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly registryTable: Locator;
  readonly searchInput: Locator;
  readonly globalDelayInput: Locator;
  readonly globalDelayNumberInput: Locator;
  readonly exportButton: Locator;
  readonly importButton: Locator;
  readonly fetchUsersButton: Locator;
  readonly fetchProductsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toggleButton = page.getByRole("button", {
      name: "Toggle MSW DevTools",
    });
    this.dialog = page.getByRole("dialog");
    this.closeButton = this.dialog.getByRole("button", { name: "Close" });
    this.registryTable = this.dialog.getByRole("table");
    this.searchInput = this.dialog.getByPlaceholder(
      "Filter by key, URL or method...",
    );
    this.globalDelayInput = this.dialog.getByLabel(/Global Delay:/);
    this.globalDelayNumberInput = this.dialog.getByLabel(
      "Global delay in milliseconds",
    );
    this.exportButton = this.dialog.getByRole("button", {
      name: "Export Scenarios",
    });
    this.importButton = this.dialog.getByRole("button", {
      name: "Import Scenarios",
    });
    this.fetchUsersButton = page.getByRole("button", { name: /Fetch Users/ });
    this.fetchProductsButton = page.getByRole("button", {
      name: /Fetch Products/,
    });
  }

  async switchTab(tab: "Registry" | "Activity Log" | "Presets") {
    // Note: The UI shows "Activity Log (N)", so we use part of the name
    await this.dialog.getByRole("button", { name: tab, exact: false }).click();
  }

  async saveCurrentAsPreset(name: string) {
    await this.switchTab("Registry");
    await this.dialog.getByRole("button", { name: "Create Preset" }).click();
    await this.dialog.getByRole("button", { name: "Select Visible" }).click();
    await this.dialog.getByPlaceholder("Preset name...").fill(name);
    await this.dialog.getByRole("button", { name: "Save Selected" }).click();
  }

  async applyPreset(name: string) {
    await this.switchTab("Presets");
    // Select the preset from the list first
    await this.dialog.locator(".presets-list-item", { hasText: name }).click();
    // Then click Apply in the detail panel
    await this.dialog
      .locator(".presets-detail")
      .getByRole("button", { name: "Apply Preset" })
      .click();
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
    const input = row.getByRole("spinbutton");
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
    // Standardizing the shortcut for tests.
    // We use a specific sequence to ensure the modifier is held.
    await this.page.bringToFront();
    // Use focus on the body to ensure we are listening to keydown
    await this.page.focus("body");

    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await this.page.keyboard.down(modifier);
    await this.page.keyboard.down("Shift");
    await this.page.keyboard.press("M");
    await this.page.keyboard.up("Shift");
    await this.page.keyboard.up(modifier);
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
    // For native handlers with format [METHOD] /path
    if (name.startsWith("[")) {
      const match = name.match(/^\[([A-Z]+)\]\s+(.+)$/);
      if (match) {
        const [_, method, path] = match;
        return this.registryTable
          .getByRole("row")
          .filter({ hasText: method })
          .filter({ hasText: path });
      }
    }
    return this.registryTable.getByRole("row", { name });
  }

  async expectHandler(name: string, method: string, url: string) {
    const row = await this.getHandlerRow(name);
    await expect(row).toBeVisible();
    await expect(row.getByText(method, { exact: true })).toBeVisible();
    // URL might appear twice (in key column and url column), so we take the first one
    await expect(row.getByText(url, { exact: true }).first()).toBeVisible();
  }

  async expectScenario(handlerName: string, scenarioName: string) {
    const row = await this.getHandlerRow(handlerName);
    const select = row.getByRole("combobox");
    await expect(
      select.locator("option", { hasText: scenarioName }),
    ).toBeAttached();
  }

  async selectScenario(handlerName: string, scenarioName: string) {
    const row = await this.getHandlerRow(handlerName);
    const select = row.getByRole("combobox");
    await select.selectOption({ label: scenarioName });
  }

  // Activity Log methods
  async getLogEntry(url: string) {
    return this.dialog.getByRole("listitem").filter({ hasText: url }).first();
  }

  async expectLogEntry(details: {
    method: string;
    url: string;
    key: string;
    scenario: string;
    status: number;
  }) {
    const entry = await this.getLogEntry(details.url);
    await expect(entry).toBeVisible();
    await expect(
      entry.getByText(details.method, { exact: true }),
    ).toBeVisible();
    await expect(entry.getByText(details.key, { exact: true })).toBeVisible();
    await expect(entry.getByText(details.scenario)).toBeVisible();
    await expect(
      entry.getByText(details.status.toString(), { exact: true }),
    ).toBeVisible();
  }

  async expandLogEntry(url: string) {
    const entry = await this.getLogEntry(url);
    // There isn't a single button for header, it's a div with click handler.
    // We can click the URL text or the entry itself.
    await entry.getByText(url).click();
  }

  async expectLogRequestPreview(url: string, previewText: string) {
    const entry = await this.getLogEntry(url);
    await expect(entry.getByText(previewText)).toBeVisible();
  }

  async expectLogDetails(
    url: string,
    section: "Request Body" | "Response Body",
    content: string,
  ) {
    const entry = await this.getLogEntry(url);
    const sectionLocator = entry.getByRole("region", { name: section });
    await expect(sectionLocator).toContainText(content);
  }

  // Export/Import methods
  async openExportDialog() {
    await this.exportButton.click();
  }

  async expectExportOption(label: string, checked: boolean) {
    const checkbox = this.dialog
      .locator("label", { hasText: label })
      .locator('input[type="checkbox"]');
    if (checked) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }

  async toggleExportOption(label: string) {
    await this.dialog.locator("label", { hasText: label }).click();
  }

  async downloadExport() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.dialog.getByRole("button", { name: "Download JSON" }).click();
    return await downloadPromise;
  }

  async importFile(filePath: string) {
    // The input is hidden, so we need to set the files on the input that is triggered by the button
    const fileChooserPromise = this.page.waitForEvent("filechooser");
    await this.importButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  // Override / Custom Scenario methods
  async openOverrideModal(handlerName: string) {
    const row = await this.getHandlerRow(handlerName);
    await row.getByRole("button", { name: /Override/i }).click();
  }

  async fillOverrideBody(body: string) {
    const textarea = this.dialog.locator("textarea.body-textarea");
    await textarea.fill(body);
  }

  async saveOverride(scenarioName?: string) {
    if (scenarioName) {
      await this.dialog
        .getByPlaceholder(/e\.g\..*Empty Results/)
        .fill(scenarioName);
    }
    const buttonLabel = scenarioName
      ? "Save as Scenario"
      : "Save & Enable Override";
    await this.dialog.getByRole("button", { name: buttonLabel }).click();
  }

  async resetAll() {
    await this.dialog
      .getByRole("button", { name: "Reset", exact: true })
      .click();
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.dialog.getByRole("button", { name: "Reset All (Full)" }).click();
  }

  async resetScenariosOnly() {
    await this.dialog
      .getByRole("button", { name: "Reset", exact: true })
      .click();
    await this.dialog
      .getByRole("button", { name: "Reset Scenarios Only" })
      .click();
  }
}
