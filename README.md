# Mercury demo accessibility checks

A small Playwright test using `@axe-core/playwright` to scan https://demo.mercury.com/dashboard in Chromium. It waits for the dashboard to render, runs all default axe rules (including best practices), and fails when violations are found. No rules or elements are suppressed.

## Run

Requires Node.js 20 or newer.

```sh
nvm use # optional, if you use nvm
npm ci
npm run install:browsers
npm test
```

For a visible browser, run `npm run test:headed`. Open the HTML results with `npm run report`. Each completed scan attaches the full axe JSON results to the report; failures also retain a screenshot and Playwright trace. Generated reports are ignored by Git.

You can override the dashboard URL with `TARGET_URL=https://demo.mercury.com/dashboard npm test`. The target must still expose the welcome heading, transactions table, and dashboard route.

A failing accessibility assertion means axe found issues on the live demo. Navigation or readiness failures indicate the page could not be scanned. Automated checks do not cover every accessibility requirement; keyboard and screen reader testing remain useful.

Reference: https://playwright.dev/docs/accessibility-testing

## Initial validation

The live dashboard scan completed and reported `button-name` on four elements and `svg-img-alt` on five elements. The test intentionally fails until the scanned page resolves these findings. Results may change as the demo is updated.
