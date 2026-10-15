import { test } from "@playwright/test";
import { reportPerformance } from "../support/performance";
test("report banking page performance", async ({ page, context }, testInfo) => {
  console.log("....page = ", page);
  await reportPerformance(page, context, testInfo, "/", "Welcome back, Jane.");
});
test.use({ trace: "off", screenshot: "off", video: "off" });
