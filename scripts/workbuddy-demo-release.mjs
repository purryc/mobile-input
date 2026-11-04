/** Build a source-only, dependency-complete handoff; never walk private artifacts. */
import ts from "typescript";
import { readFile, writeFile, mkdir, cp, stat } from "node:fs/promises";
import { resolve, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(
  root,
  process.argv[2] || "artifacts/workbuddy-demo/release/source",
);
if (!target.startsWith(resolve(root, "artifacts/workbuddy-demo/release") + "/"))
  throw Error("Release output must stay in the ignored release directory");
const roots = [
  "apps/web/src/workbuddy-demo-main.tsx",
  "apps/web/workbuddy-demo.html",
  "vite.workbuddy-demo.config.ts",
  "playwright.workbuddy-demo.config.ts",
  "scripts/workbuddy-demo-service.test.ts",
  "scripts/workbuddy-demo-release.mjs",
  "api/workbuddy-demo/[action].ts",
  "api/AGENTS.md",
  "tests/workbuddy-standalone.spec.ts",
  "tests/workbuddy-demo-results.spec.ts",
  "packages/core/workbuddy-demo.test.ts",
  "packages/core/workbuddy-demo-generation.test.ts",
  "packages/core/live-workbuddy.test.ts",
  "docs/workbuddy-standalone-demo-2026-11-04.md",
  "vercel.workbuddy-demo.json",
  "package-lock.json",
];
const files = new Set();
const options = {
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  allowJs: true,
  resolveJsonModule: true,
};
async function collect(path) {
  path = resolve(root, path);
  if (files.has(path) || path.includes("/node_modules/")) return;
  if (!path.startsWith(root + "/")) throw Error("Source escaped project");
  await stat(path);
  files.add(path);
  if (!/\.(?:tsx?|jsx?|mjs|css)$/.test(path)) return;
  const source = await readFile(path, "utf8");
  const imports = ts
    .preProcessFile(source, true, true)
    .importedFiles.map((i) => i.fileName);
  if (extname(path) === ".css")
    imports.push(
      ...[...source.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1]),
    );
  for (const spec of imports.filter((s) => s.startsWith("."))) {
    const found =
      ts.resolveModuleName(spec, path, options, ts.sys).resolvedModule
        ?.resolvedFileName || resolve(dirname(path), spec);
    await collect(found);
  }
}
for (const entry of roots) await collect(entry);
await mkdir(target, { recursive: true });
for (const path of files) {
  const dest = resolve(target, relative(root, path));
  await mkdir(dirname(dest), { recursive: true });
  await cp(path, dest);
}
for (const asset of [
  "assets/apps/workbuddy.svg",
  "assets/apps/workbuddy-mascot.png",
  "assets/figma/sentence-parameters",
  "reference-assets/workbuddy-widgets",
]) {
  const dest = resolve(target, "apps/web/public", asset);
  await mkdir(dirname(dest), { recursive: true });
  await cp(resolve(root, "apps/web/public", asset), dest, { recursive: true });
}
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
pkg.scripts = {
  dev: "vite --config vite.workbuddy-demo.config.ts",
  "dev:workbuddy-demo": "vite --config vite.workbuddy-demo.config.ts",
  build: "npm run build:workbuddy-demo",
  "build:workbuddy-demo":
    "tsc --noEmit && vite build --config vite.workbuddy-demo.config.ts",
  "preview:workbuddy-demo":
    "vite preview --config vite.workbuddy-demo.config.ts",
  check: "tsc --noEmit",
  test: "tsx --test packages/core/*.test.ts",
  "test:workbuddy-demo":
    "playwright test --config playwright.workbuddy-demo.config.ts",
  "test:workbuddy-demo:service":
    "tsx --test scripts/workbuddy-demo-service.test.ts",
};
await writeFile(
  resolve(target, "package.json"),
  JSON.stringify(pkg, null, 2) + "\n",
);
const config = JSON.parse(
  await readFile(resolve(root, "tsconfig.json"), "utf8"),
);
config.include = [
  "apps/web/src",
  "packages/core",
  "api",
  "vite.workbuddy-demo.config.ts",
];
await writeFile(
  resolve(target, "tsconfig.json"),
  JSON.stringify(config, null, 2) + "\n",
);
await cp(
  resolve(root, "vercel.workbuddy-demo.json"),
  resolve(target, "vercel.json"),
);
await cp(
  resolve(root, "docs/workbuddy-standalone-demo-2026-11-04.md"),
  resolve(target, "README.md"),
);
await writeFile(
  resolve(target, "AGENTS.md"),
  "# WorkBuddy standalone source handoff\n\nOnly this standalone Web app is included. Source is under apps/web/src, shared contracts under packages/core, local generation under scripts, hosted adapters under api. Do not add native/bridge services. Use npm ci, npm run check, npm test, npm run test:workbuddy-demo:service, npm run test:workbuddy-demo and npm run build:workbuddy-demo. Keep all credentials in environment or ignored artifacts/workbuddy-demo/google-api-key; never commit or publish them. Generated releases and evidence belong under artifacts/workbuddy-demo/.\n",
);
await writeFile(
  resolve(target, ".gitignore"),
  "node_modules/\nartifacts/\n.vercel/\n.env*\n.playwright-cli/\n",
);
await writeFile(
  resolve(target, ".vercelignore"),
  "node_modules\nartifacts\n.git\n.env*\n.playwright-cli\n",
);
const gitInfo = (args) => {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "source-archive";
  }
};
const manifest = {
  createdAt: new Date().toISOString(),
  branch: gitInfo(["branch", "--show-current"]),
  baseCommit: gitInfo(["rev-parse", "HEAD"]),
  note: "Current reviewed worktree source; generated package/config/README tailored to standalone scope.",
  files: [],
};
for (const path of [...files].sort())
  manifest.files.push({
    path: relative(root, path),
    sha256: createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
  });
await writeFile(
  resolve(target, "SOURCE-MANIFEST.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify({ target, sourceFiles: files.size }));
