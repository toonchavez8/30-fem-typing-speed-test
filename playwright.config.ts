// playwright.config.ts

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	// Directory containing test files

	testDir: "./e2e",
	// Run tests in parallel for faster execution
	fullyParallel: true,
	// Fail the build on CI if test.only is left in source code
	forbidOnly: !!process.env.CI,

	// Retry failed tests on CI only (flaky test protection)
	retries: process.env.CI ? 2 : 0,

	// Number of parallel workers
	workers: process.env.CI ? 1 : undefined,

	// Reporter configuration
	reporter: [["html", { open: "never" }], ["list"]],

	// Shared settings for all projects
	use: {
		// Base URL for navigation - matches Next.js dev server
		baseURL: "http://localhost:3000",
		// Capture screenshot on failure
		screenshot: "only-on-failure",
		trace: "on-first-retry",
	},

	// Configure projects for major browsers
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},

		{
			name: "firefox",

			use: { ...devices["Desktop Firefox"] },
		},

		{
			name: "webkit",

			use: { ...devices["Desktop Safari"] },
		},
	], // Run Next.js dev server before starting tests

	webServer: {
		command: "npm run dev",

		url: "http://localhost:3000",

		reuseExistingServer: !process.env.CI,

		timeout: 120 * 1000,
	},
});
