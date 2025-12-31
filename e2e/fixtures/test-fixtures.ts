import { test as base, expect } from "@playwright/test";

//Extend base test with typing specifics fixtures

export const test = base.extend<{
  loadedPage: void;
  completedTest: void;
}>({
  loadedPage: async ({ page }, use) => {
    await page.goto("/");

    await page.waitForSelector('[data-testid="passage-text"', {
      state: "visible",
      timeout: 10000,
    });

    await use();
  },

  completedTest: async ({ page }, use) => {
    await page.goto("/");

    await page.waitForSelector('[data-testid="passage-text"');

    //get passage text and type it

    const passageText = await page.textContent('[data-testid="passage-text"');

    if (passageText) {
      const input = page.locator('input[aria-label="Typing input"]');
      await input.focus();
      await input.fill(passageText);
    }

    await page.waitForSelector('[data-testid="results-modal]', {
      state: "visible",
    });

    await use();
  },
});

export { expect };
