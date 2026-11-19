/** Run with tsx. Only launches the interactive host; never captures or sends. */
import { createServer } from "vite";
import {
  listControls,
  controlKinds,
} from "../packages/core/workbuddy-demo-controls";
const args = process.argv.slice(2);
if (args.includes("--list"))
  console.log(JSON.stringify(listControls(), null, 2));
else {
  const value = (name: string, fallback: string) =>
    args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const control = value("--control", "all"),
    language = value("--language", "zh"),
    port = Number(value("--port", "5198"));
  if (
    control !== "all" &&
    !controlKinds.includes(control as (typeof controlKinds)[number])
  )
    throw Error("Unknown control. Use --list.");
  if (
    !["zh", "en"].includes(language) ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535
  )
    throw Error("Use --language zh|en and a valid --port.");
  const url = `/?controls=${encodeURIComponent(control)}&debug=1&language=${language}`;
  const server = await createServer({
    configFile: "vite.workbuddy-demo.config.ts",
    server: { port, open: url },
  });
  await server.listen();
  console.log(
    `Input controls: http://localhost:${port}${url}\nNo camera, model or task is started automatically.`,
  );
}
