import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

let running = false;
let queued = false;

function log(message) {
  process.stdout.write(`[plugin-watch] ${message}\n`);
}

function runBuild(reason) {
  if (running) {
    queued = true;
    return;
  }

  running = true;
  log(`rebuilding (${reason})`);
  const child = spawn(process.execPath, [path.join(__dirname, "build-plugin.mjs")], {
    cwd: rootDir,
    stdio: "inherit"
  });

  child.on("exit", (code) => {
    running = false;
    if (code === 0) {
      log("build ok");
    } else {
      log(`build failed (${code ?? "unknown"})`);
    }

    if (queued) {
      queued = false;
      runBuild("queued change");
    }
  });
}

runBuild("initial");

watch(srcDir, { recursive: true }, (_eventType, filename) => {
  if (!filename) {
    runBuild("src change");
    return;
  }
  if (!filename.endsWith(".js") && !filename.endsWith(".html")) {
    return;
  }
  runBuild(filename);
});

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
