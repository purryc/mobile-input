import { workbuddyDemoMiddleware } from "./scripts/workbuddy-demo-service";
import { defineConfig } from "vite";
import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const output = resolve("artifacts/workbuddy-demo/dist");
let building = false;
export default defineConfig({
  root: "apps/web",
  base: "./",
  server: { host: "127.0.0.1", port: 5198, strictPort: true },
  preview: { host: "127.0.0.1", port: 5198, strictPort: true },
  build: {
    outDir: output,
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: { input: [resolve("apps/web/workbuddy-demo.html"),resolve("apps/web/widget-library.html")] },
  },
  plugins: [
    {
      name: "standalone-workbuddy-entry",
      configResolved(config) {
        building = config.command === "build";
      },
      configureServer(server) {
        server.middlewares.use(workbuddyDemoMiddleware);
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/" || req.url?.startsWith("/?"))
            req.url = "/workbuddy-demo.html" + req.url.slice(1);
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use(workbuddyDemoMiddleware);
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/" || req.url?.startsWith("/?"))
            req.url = "/workbuddy-demo.html" + req.url.slice(1);
          next();
        });
      },
      async closeBundle() {
        if (!building) return;
        await cp(
          resolve(output, "workbuddy-demo.html"),
          resolve(output, "index.html"),
        );
        for (const path of [
          "assets/xiaoyi-work",
          "assets/figma/sentence-parameters",
          "assets/figma/presentation/noto-sans-sc-400.woff2",
          "assets/figma/presentation/noto-sans-sc-500.woff2",
          "reference-assets/workbuddy-widgets",
        ]) {
          const target = resolve(output, path);
          await mkdir(resolve(target, ".."), { recursive: true });
          await cp(resolve("apps/web/public", path), target, {
            recursive: true,
          });
        }
      },
    },
  ],
});
