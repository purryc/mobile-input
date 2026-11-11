import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: ["workbuddy-standalone.spec.ts", "workbuddy-demo-results.spec.ts", "workbuddy-demo-polish.spec.ts"],
  workers: 1,
  webServer: {
    command: "npm run dev:workbuddy-demo -- --port 5298",
    url: "http://127.0.0.1:5298",
    reuseExistingServer: false,
  },
  use: {
    channel: "chrome",
    baseURL: "http://127.0.0.1:5298",
    viewport: { width: 1440, height: 960 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: "list",
  outputDir: "artifacts/workbuddy-demo/tests",
});
