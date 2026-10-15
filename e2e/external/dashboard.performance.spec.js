import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const vitalsScript = readFileSync(
  join(dirname(require.resolve("web-vitals")), "web-vitals.iife.js"),
  "utf8",
);
import { dashboardUrl } from "./environment.js";

test("report dashboard Core Web Vitals and performance timings", async ({
  page,
  context,
}, testInfo) => {
  // Traces/screenshots add overhead; this is an unthrottled desktop lab sample.
  const metrics = {};
  await context.exposeBinding("__reportVitals", ({ frame }, metric) => {
    if (frame === page.mainFrame()) metrics[metric.name] = metric;
  });
  // One script ensures the library and callbacks initialize in order, before app code.
  await page.addInitScript({
    content: `${vitalsScript}

    for (const name of ['LCP', 'CLS', 'INP', 'FCP', 'TTFB']) {
      webVitals['on' + name]((metric) => {
        window.__reportVitals({ name: metric.name, value: metric.value,
          rating: metric.rating, id: metric.id, navigationType: metric.navigationType });
      }, { reportAllChanges: true });
    }
  `,
  });

  const response = await page.goto(dashboardUrl, { waitUntil: "load" });
  expect(response?.ok(), "Dashboard HTTP response").toBeTruthy();
  expect(new URL(page.url()).pathname).toBe(new URL(dashboardUrl).pathname);
  await expect(page.getByRole("heading", { name: /^Welcome,/ })).toBeVisible();
  const table = page.getByRole("table", { name: "Transactions table", exact: true });
  await expect(table.getByRole("row").nth(1)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // Fixed observation window intentionally captures late paints and layout shifts.
  await page.waitForTimeout(5_000);
  await page.getByRole("button", { name: "Search for anything", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1_000);

  const timings = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const round = (value) => Math.round(value * 100) / 100;
    return {
      timeOrigin: new Date(performance.timeOrigin).toISOString(),
      observedDurationMs: round(performance.now()),
      navigation: {
        dnsMs: round(navigation.domainLookupEnd - navigation.domainLookupStart),
        connectionMs: round(navigation.connectEnd - navigation.connectStart),
        responseDownloadMs: round(navigation.responseEnd - navigation.responseStart),
        domInteractiveMs: round(navigation.domInteractive),
        domContentLoadedMs: round(navigation.domContentLoadedEventEnd),
        loadMs: round(navigation.loadEventEnd),
      },
      resources: {
        count: resources.length,
        reportedTransferBytes: resources.reduce((total, entry) => total + entry.transferSize, 0),
        note: "Cross-origin resources without Timing-Allow-Origin can report zero bytes or restricted timings.",
        slowest: [...resources]
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 10)
          .map(({ name, initiatorType, duration, transferSize }) => ({
            url: name,
            type: initiatorType,
            durationMs: round(duration),
            reportedTransferBytes: transferSize,
          })),
      },
    };
  });

  // A real navigation hides the document and flushes final CLS/INP/LCP callbacks.
  await page.goto("about:blank");
  await expect
    .poll(() => ["LCP", "CLS", "INP", "FCP", "TTFB"].every((name) => metrics[name] !== undefined), {
      message: "All five performance metrics should be captured",
    })
    .toBe(true);

  const rows = ["LCP", "CLS", "INP", "FCP", "TTFB"].map((name) => ({
    metric: name,
    value: Number(metrics[name].value.toFixed(name === "CLS" ? 4 : 2)),
    unit: name === "CLS" ? "score" : "ms",
    rating: metrics[name].rating,
  }));
  console.table(rows);
  const report = {
    url: dashboardUrl,
    environment: "Chromium desktop, fresh browser context, no CPU/network throttling",
    scenario:
      "Load dashboard; observe 5 seconds after readiness; click search; press Escape; observe 1 second; navigate away.",
    scope:
      "One synthetic lab sample, not field data or a 75th-percentile Core Web Vitals assessment.",
    metrics,
    timings,
  };
  await testInfo.attach("performance-results", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  const summary = [
    "# Dashboard performance sample",
    "",
    "| Metric | Value | Rating |",
    "| --- | --- | --- |",
    ...rows.map(
      ({ metric, value, unit, rating }) => `| ${metric} | ${value} ${unit} | ${rating} |`,
    ),
    "",
    `DOM content loaded: ${timings.navigation.domContentLoadedMs} ms`,
    `Page load: ${timings.navigation.loadMs} ms`,
    `Resources observed: ${timings.resources.count}`,
    "",
    report.environment,
    report.scenario,
    report.scope,
  ].join("\n");
  await testInfo.attach("performance-summary", { body: summary, contentType: "text/markdown" });
});

// Report metrics without enforcing performance budgets; fail only if measurement fails.
test.use({ trace: "off", screenshot: "off", video: "off" });
