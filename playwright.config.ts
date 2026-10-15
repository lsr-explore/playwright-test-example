import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
const external = process.env.TEST_SUITE === "external";
const baseURL = process.env.APP_BASE_URL || "http://127.0.0.1:4173";
export default defineConfig({
  testDir: external ? "./e2e/external" : "./e2e/app",
  timeout: 90_000,
  expect: { timeout: 30_000 },
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer:
    external || process.env.APP_BASE_URL
      ? undefined
      : {
          command: "pnpm build && pnpm preview --host 127.0.0.1 --port 4173 --strictPort",
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
        },
});
