import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("banking landing page is accessible in the browser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back, Jane." })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
