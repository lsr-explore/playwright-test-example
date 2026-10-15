# Evergreen Banking and web quality checks

A small TypeScript React banking demo built with Vite. Account and transaction data are hard coded. The landing page includes a welcome, total balance, three account panels, recent activity, and a working balance visibility toggle.

Tooling: Vitest, Testing Library, jest-axe, Playwright, @axe-core/playwright, Google's web-vitals library, Oxlint, and Oxfmt (the Oxc formatter).

## Start the app

Node 24 is recommended (`nvm use`). Use pnpm.

```sh
pnpm install --frozen-lockfile
pnpm install:browsers
pnpm dev
```

Open the localhost URL printed by Vite. For a production build, use `pnpm build` then `pnpm preview`.

## Checks

| Command                          | Purpose                                                        |
| -------------------------------- | -------------------------------------------------------------- |
| `pnpm test`                      | Vitest component behavior and jest-axe accessibility tests     |
| `pnpm test:watch`                | Watch component tests                                          |
| `pnpm test:e2e`                  | Local browser accessibility and performance tests              |
| `pnpm test:performance`          | Local performance tests only                                   |
| `pnpm test:external`             | Preserved external Mercury accessibility and performance tests |
| `pnpm test:external:performance` | External performance test only                                 |
| `pnpm test:ui`                   | Local Playwright UI                                            |
| `pnpm test:headed`               | Local browser tests with a visible browser                     |
| `pnpm report`                    | Open the most recent Playwright HTML report                    |
| `pnpm lint`                      | Oxlint                                                         |
| `pnpm format`                    | Format with Oxfmt                                              |
| `pnpm format:check`              | Check formatting                                               |
| `pnpm check`                     | Lint, formatting check, TypeScript, production build, Vitest   |

Local Playwright runs build and serve the production app automatically on port 4173. They use one worker to reduce performance contention. Reports are replaced on each run; generated outputs are ignored by Git.

## Generate a page with Plop

```sh
pnpm generate:page payment-history
pnpm format
pnpm check
pnpm test:e2e
```

Run `pnpm generate:page` without a name for an interactive prompt, or `pnpm generate` to choose a generator.

The Plop `page` generator creates:

- `src/pages/PaymentHistoryPage.tsx`: a TypeScript React component with an accessible interactive details toggle.
- `src/pages/PaymentHistoryPage.test.tsx`: a jest-axe test run by Vitest, checking initial and expanded states.
- `e2e/app/payment-history.performance.spec.ts`: a Playwright performance test.
- `e2e/app/payment-history.a11y.spec.ts`: a full-page browser axe test covering initial and expanded states, with JSON results attached to the report.

Templates live in `plop-templates/page/`; generator options and actions live in `plopfile.js`. Edit the Handlebars templates to change what every new page gets. A single invocation creates the page and all three tests together.

It also registers `/payment-history` in `src/pages/registry.ts`, adding it to the app navigation. Names must be lowercase kebab case. Existing pages are never overwritten. The included `/savings-goals` page was created with this generator and validated with both test runners.

Customize the generated heading and matching performance-test heading together. Keep or adapt the `data-testid="performance-action"` control: the shared performance helper clicks it twice to capture interaction latency. Deployments must serve `index.html` for app routes (SPA fallback).

## Configure environments

Copy `.env.example` to `.env`. Playwright loads it automatically; shell variables take precedence. No secrets are needed for this public demo.

```dotenv
# Optional deployed URL for app tests; omit to run the local production build.
APP_BASE_URL=https://banking-staging.example.com

# Existing external tests, with the same dashboard contract as Mercury.
EXTERNAL_BASE_URL=https://personal-demo.mercury.com
EXTERNAL_DASHBOARD_PATH=/dashboard
```

`TARGET_URL` overrides the complete external dashboard URL, preserving the earlier behavior:

```sh
TARGET_URL=https://demo.mercury.com/dashboard pnpm test:external
APP_BASE_URL=https://banking-staging.example.com pnpm test:e2e
```

The original tests are in `e2e/external`; they still expect a welcome heading, transactions table, and configured dashboard route. Changing environments requires configuration; targeting an unrelated UI also requires updating readiness selectors. Local app tests live in `e2e/app`, with reusable performance reporting in `e2e/support/performance.ts`.

## Performance reports

Each performance test reports LCP, CLS, INP, FCP, and TTFB with library-provided ratings. It also records DNS/connection/response timings, DOM interactive, DOM content loaded, page load, resource counts, reported transfer bytes, and the ten slowest observed resources.

The scenario loads a fresh unthrottled Chromium desktop context, waits five seconds after readiness, performs two interactions, observes another second, then navigates away to flush final metric callbacks. Local tests use a 16 ms event observer threshold to capture quick interactions. Local tests toggle balance visibility or page details; external tests open search and press Escape. Results appear in the terminal and as JSON and Markdown attachments in the HTML report. Performance scores do not fail tests; missing load/layout measurements and readiness failures do. Traces and screenshots are disabled for performance tests to reduce overhead.

These are individual synthetic lab samples, not real-user field data or a 75th-percentile Core Web Vitals assessment. An absent INP value is reported as `null` / “Not observed” with a warning, rather than failing the run or claiming a zero/good score. A short scripted session does not guarantee an INP observation. Results vary. CLS covers the observation window; INP covers the scripted interactions. Cross-origin resource timings/bytes may be restricted by Timing-Allow-Origin headers.

## Accessibility

jest-axe checks component markup in jsdom; it cannot reliably check visual layout or color contrast. The banking page also has a full browser axe scan. Automated checks complement keyboard and screen-reader testing.

The original Mercury scan found `button-name` and `svg-img-alt` violations. Those rules remain enabled, so the external accessibility test may fail on the live demo. This is separate from the app suite.

References: https://playwright.dev/docs/accessibility-testing and https://github.com/GoogleChrome/web-vitals.
