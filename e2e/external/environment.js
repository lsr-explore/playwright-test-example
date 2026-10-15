export const dashboardUrl =
  process.env.TARGET_URL ||
  new URL(
    process.env.EXTERNAL_DASHBOARD_PATH || "/dashboard",
    process.env.EXTERNAL_BASE_URL || "https://personal-demo.mercury.com",
  ).href;
