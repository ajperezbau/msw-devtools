import { test, expect } from "@playwright/test";
import { DevToolsPage } from "./page-objects/DevToolsPage";

test.describe("MSW DevTools - Activity Log", () => {
  let devToolsPage: DevToolsPage;

  test.beforeEach(async ({ page }) => {
    devToolsPage = new DevToolsPage(page);
    await devToolsPage.goto();
  });

  test.describe("Left Sidebar Information", () => {
    test("should show request entries with all information", async () => {
      // Trigger requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Verify GET request entry shows: method, key, status, scenario
      await devToolsPage.expectLogEntry({
        method: "GET",
        url: "/api/users",
        key: "users",
        scenario: "default",
        status: 200,
      });

      // Verify POST request entry shows: method, key, status, scenario
      await devToolsPage.expectLogEntry({
        method: "POST",
        url: "/api/products",
        key: "products",
        scenario: "default",
        status: 201,
      });

      // Verify request count is shown
      await devToolsPage.expectRequestCount(2);
    });

    test("should display timestamp for each request", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Get the list item and verify it has a timestamp (format: HH:MM:SS)
      const entry = await devToolsPage.getLogEntry("users");
      await expect(entry).toContainText(/\d{2}:\d{2}:\d{2}/);
    });
  });

  test.describe("Placeholder Display", () => {
    test("should show placeholder when no request is selected", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Verify placeholder is visible
      await devToolsPage.expectPlaceholderVisible();
    });

    test("should hide placeholder after selecting a request", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select a log entry
      await devToolsPage.selectLogEntry("users");

      // Verify placeholder is not visible
      await expect(
        devToolsPage.dialog.getByText("Select a request to view details"),
      ).not.toBeVisible();
    });
  });

  test.describe("Method Filters", () => {
    test("should filter by ALL methods by default", async () => {
      // Trigger multiple requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Verify all requests are shown
      await devToolsPage.expectRequestCount(2);
    });

    test("should filter by GET method only", async () => {
      // Trigger multiple requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Click GET filter
      await devToolsPage.clickMethodFilter("GET");

      // Verify only GET request is shown
      await devToolsPage.expectRequestCount(1);
      await devToolsPage.expectLogEntry({
        method: "GET",
        url: "/api/users",
        key: "users",
        scenario: "default",
        status: 200,
      });
    });

    test("should filter by POST method only", async () => {
      // Trigger multiple requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Click POST filter
      await devToolsPage.clickMethodFilter("POST");

      // Verify only POST request is shown
      await devToolsPage.expectRequestCount(1);
      await devToolsPage.expectLogEntry({
        method: "POST",
        url: "/api/products",
        key: "products",
        scenario: "default",
        status: 201,
      });
    });

    test("should allow multiple method filters", async () => {
      // Trigger multiple requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Click GET and POST filters
      await devToolsPage.clickMethodFilter("GET");
      await devToolsPage.clickMethodFilter("POST");

      // Verify both requests are shown
      await devToolsPage.expectRequestCount(2);
    });

    test("should return to ALL when all filters are deselected", async () => {
      // Trigger multiple requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select GET filter, then deselect it
      await devToolsPage.clickMethodFilter("GET");
      await devToolsPage.clickMethodFilter("GET");

      // Verify all requests are shown again
      await devToolsPage.expectRequestCount(2);
    });
  });

  test.describe("Search Functionality", () => {
    test("should filter requests by key", async () => {
      // Trigger multiple requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Search for "users"
      await devToolsPage.searchActivityLog("users");

      // Verify only users request is shown
      await devToolsPage.expectRequestCount(1);
      await devToolsPage.expectLogEntry({
        method: "GET",
        url: "/api/users",
        key: "users",
        scenario: "default",
        status: 200,
      });
    });

    test("should show 'No requests found' when search has no results", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Search for non-existent request
      await devToolsPage.searchActivityLog("nonexistent");

      // Verify no requests message
      await devToolsPage.expectNoRequestsFound();
    });

    test("should clear search with clear button", async () => {
      // Trigger multiple requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Search for "users"
      await devToolsPage.searchActivityLog("users");
      await devToolsPage.expectRequestCount(1);

      // Clear search
      await devToolsPage.clearActivityLogSearch();

      // Verify all requests are shown again
      await devToolsPage.expectRequestCount(2);
    });
  });

  test.describe("Request Details - General Tab", () => {
    test("should show General tab by default when selecting a request", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("users");

      // Verify General tab content is visible
      await devToolsPage.expectGeneralTabInfo({
        timestamp: true,
        source: "default",
        handlerKey: "users",
      });
    });

    test("should display timestamp in General tab", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("users");

      // Verify timestamp label and value exist
      await expect(devToolsPage.dialog.getByText("Timestamp")).toBeVisible();
      await expect(devToolsPage.dialog.locator(".info-value.big")).toContainText(/\d{2}:\d{2}:\d{2}/);
    });

    test("should display source scenario in General tab", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("users");

      // Verify source is displayed
      await devToolsPage.expectGeneralTabInfo({
        source: "default",
      });
    });

    test("should display handler key in General tab", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("users");

      // Verify handler key is displayed
      await devToolsPage.expectGeneralTabInfo({
        handlerKey: "users",
      });
    });
  });

  test.describe("Request Details - Request Tab", () => {
    test("should show Request tab when clicked", async () => {
      // Trigger a POST request with body
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("products");

      // Switch to Request tab
      await devToolsPage.switchToTab("Request");

      // Verify Request tab content
      await devToolsPage.expectRequestTabInfo({
        requestBody: true,
      });
    });

    test("should display request body in Request tab", async () => {
      // Trigger a POST request with body
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("products");

      // Switch to Request tab
      await devToolsPage.switchToTab("Request");

      // Verify request body content
      await expect(devToolsPage.dialog.getByText("Request Body")).toBeVisible();
      await expect(devToolsPage.dialog).toContainText("New Product");
    });
  });

  test.describe("Request Details - Response Tab", () => {
    test("should show Response tab when clicked", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("users");

      // Switch to Response tab
      await devToolsPage.switchToTab("Response");

      // Verify Response tab is active
      const responseTab = devToolsPage.dialog.getByRole("button", {
        name: "Response",
      });
      await expect(responseTab).toHaveClass(/active/);
    });

    test("should display response body in Response tab", async () => {
      // Trigger a request
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("products");

      // Switch to Response tab
      await devToolsPage.switchToTab("Response");

      // Verify response body content
      await expect(devToolsPage.dialog).toContainText("success");
    });
  });

  test.describe("Clear Logs Button", () => {
    test("should clear all logs when clicked", async () => {
      // Trigger multiple requests
      await devToolsPage.fetchUsersButton.click();
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Verify requests exist
      await devToolsPage.expectRequestCount(2);

      // Clear logs
      await devToolsPage.clearActivityLog();

      // Verify no requests are shown
      await devToolsPage.expectRequestCount(0);
      await devToolsPage.expectNoRequestsFound();
    });

    test("should show placeholder after clearing logs", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("users");

      // Clear logs
      await devToolsPage.clearActivityLog();

      // Verify placeholder is shown
      await devToolsPage.expectPlaceholderVisible();
    });
  });

  test.describe("Additional Features", () => {
    test("should show status indicators with correct colors", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Verify status indicator is visible
      const entry = await devToolsPage.getLogEntry("users");
      await expect(entry.locator(".status-dot.success")).toBeVisible();
      await expect(entry.locator(".status-code")).toHaveText("200");
    });

    test("should show header title and status pill when request is selected", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("users");

      // Verify header shows key and status
      await expect(
        devToolsPage.dialog.getByRole("heading", { name: "users" }),
      ).toBeVisible();
      await expect(devToolsPage.dialog.locator(".status-pill")).toContainText(
        "200",
      );
    });

    test("should show 'View in Registry' button in General tab", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("users");

      // Verify "View in Registry" button is visible
      await expect(
        devToolsPage.dialog.getByRole("button", { name: /View in Registry/ }),
      ).toBeVisible();
    });

    test("should show 'Use as Override' button in Response tab", async () => {
      // Trigger a request
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry and switch to Response tab
      await devToolsPage.selectLogEntry("products");
      await devToolsPage.switchToTab("Response");

      // Verify "Use as Override" button is visible
      await expect(
        devToolsPage.dialog.getByRole("button", { name: /Use as Override/ }),
      ).toBeVisible();
    });

    test("should show selected state on clicked list item", async () => {
      // Trigger a request
      await devToolsPage.fetchUsersButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      const entry = await devToolsPage.getLogEntry("users");
      await entry.click();

      // Verify selected state
      await expect(entry).toHaveClass(/selected/);
    });

    test("should maintain selection when switching between tabs", async () => {
      // Trigger a request
      await devToolsPage.fetchProductsButton.click();

      // Open DevTools and switch to Activity Log
      await devToolsPage.toggle();
      await devToolsPage.switchTab("Activity Log");

      // Select log entry
      await devToolsPage.selectLogEntry("products");

      // Verify General tab content
      await devToolsPage.expectGeneralTabInfo({ handlerKey: "products" });

      // Switch to Request tab
      await devToolsPage.switchToTab("Request");
      await devToolsPage.expectRequestTabInfo({ requestBody: true });

      // Switch back to General tab
      await devToolsPage.switchToTab("General");
      await devToolsPage.expectGeneralTabInfo({ handlerKey: "products" });
    });
  });
});
