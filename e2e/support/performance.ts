import { expect, type Page, type BrowserContext, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const vitalsScript = readFileSync(
  join(dirname(require.resolve("web-vitals")), "web-vitals.iife.js"),
  "utf8",
);
type Metric = { name: string; value: number; rating: string; id: string; navigationType: string };

export async function reportPerformance(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
  url: string,
  heading: string,
) {
  // Traces/screenshots add overhead; this is an unthrottled desktop lab sample.
  const metrics: Record<string, Metric> = {};
  await context.exposeBinding("__reportVitals", ({ frame }, metric: Metric) => {
    if (frame === page.mainFrame()) metrics[metric.name] = metric;
  });
  // One script ensures the library and callbacks initialize in order, before app code.
  await page.addInitScript({
    content: `${vitalsScript}

    if (location.protocol === 'http:' || location.protocol === 'https:') for (const name of ['LCP', 'CLS', 'INP', 'FCP', 'TTFB']) {
      webVitals['on' + name]((metric) => {
        window.__reportVitals({ name: metric.name, value: metric.value,
          rating: metric.rating, id: metric.id, navigationType: metric.navigationType });
      }, { reportAllChanges: true, durationThreshold: 16 });
    }
  `,
  });

  const response = await page.goto(url, { waitUntil: "load" });
  expect(response?.ok(), "Dashboard HTTP response").toBeTruthy();

  await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // Fixed observation window intentionally captures late paints and layout shifts.
  await page.waitForTimeout(5_000);
  await page.getByTestId("performance-action").click();
  await page.getByTestId("performance-action").click();
  await page.waitForTimeout(1_000);

  const timings = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const round = (value: number) => Math.round(value * 100) / 100;
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
    .poll(() => ["LCP", "CLS", "FCP", "TTFB"].filter((name) => metrics[name] === undefined), {
      message: "Load and layout metrics should be captured",
    })
    .toEqual([]);

  const rows = ["LCP", "CLS", "INP", "FCP", "TTFB"].map((name) => ({
    metric: name,
    value: metrics[name] ? Number(metrics[name].value.toFixed(name === "CLS" ? 4 : 2)) : null,
    unit: name === "CLS" ? "score" : "ms",
    rating: metrics[name]?.rating ?? "not-observed",
  }));
  console.table(rows);
  const warnings = metrics.INP
    ? []
    : [
        "INP was not observed during the scripted interactions. This is missing data, not a zero or a good score. Event Timing may omit very short interactions; browser support or observation delivery can also affect availability.",
      ];
  for (const warning of warnings) console.warn(warning);
  const report = {
    url: new URL(url, testInfo.project.use.baseURL).href,
    environment: "Chromium desktop, fresh browser context, no CPU/network throttling",
    scenario:
      "Load dashboard; observe 5 seconds after readiness; toggle page detail twice; observe 1 second; navigate away.",
    scope:
      "One synthetic lab sample, not field data or a 75th-percentile Core Web Vitals assessment.",
    metrics: { ...metrics, INP: metrics.INP ?? null },
    warnings,
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
      ({ metric, value, unit, rating }) =>
        `| ${metric} | ${value === null ? "Not observed" : `${value} ${unit}`} | ${rating} |`,
    ),
    "",
    `DOM content loaded: ${timings.navigation.domContentLoadedMs} ms`,
    `Page load: ${timings.navigation.loadMs} ms`,
    `Resources observed: ${timings.resources.count}`,
    "",
    ...warnings,
    report.environment,
    report.scenario,
    report.scope,
  ].join("\n");
  await testInfo.attach("performance-summary", { body: summary, contentType: "text/markdown" });
}
