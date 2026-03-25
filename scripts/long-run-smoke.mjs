import process from "node:process";
import { spawn } from "node:child_process";

const rootCwd = process.cwd();

function parseArgs(argv) {
  const loopsArg = argv.find((arg) => arg.startsWith("--loops="));
  return {
    loops: loopsArg ? Math.max(1, Number(loopsArg.split("=")[1]) || 3) : 3
  };
}

function runStep(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootCwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || stdout || `${command} ${args.join(" ")} failed with exit code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const runs = [];

  for (let index = 0; index < options.loops; index += 1) {
    const startedAt = Date.now();
    await runStep("npm", ["run", "smoke:stress", "--", "--iterations=3"]);
    await runStep("npm", ["run", "smoke:write-stress", "--", "--iterations=2"]);
    await runStep("npm", ["run", "smoke:mixed-stress", "--", "--iterations=1"]);
    await runStep("npm", ["run", "smoke:large-file", "--", "--component-limit=15", "--depth=2"]);
    runs.push({
      loop: index + 1,
      durationMs: Date.now() - startedAt
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        loops: options.loops,
        runs
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(`long-run-smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
