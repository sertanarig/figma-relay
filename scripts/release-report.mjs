import { spawn } from "node:child_process";

const rootCwd = process.cwd();
const DEFAULT_TIMEOUT_MS = Number(process.env.CODEX_RELEASE_STEP_TIMEOUT_MS || 120000);

async function getActiveRuntime() {
  try {
    const response = await fetch("http://127.0.0.1:3210/runtime/active");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.runtime) {
      return null;
    }
    return payload.runtime;
  } catch {
    return null;
  }
}

function getStepsForEditor(editorType) {
  const common = [
    ["npm", ["test"]],
    ["npm", ["run", "build"]],
    ["npm", ["run", "smoke:e2e"]]
  ];

  if (editorType === "figjam") {
    return [
      ...common,
      ["npm", ["run", "smoke:figjam"]]
    ];
  }

  return [
    ...common,
    ["npm", ["run", "smoke:styles"]],
    ["npm", ["run", "smoke:stress", "--", "--iterations=5"]],
    ["npm", ["run", "smoke:write-stress", "--", "--iterations=3"]],
    ["npm", ["run", "smoke:mixed-stress", "--", "--iterations=2"]],
    ["npm", ["run", "smoke:large-file", "--", "--component-limit=20", "--depth=2"]],
    ["node", ["scripts/comments-smoke.mjs"]],
    ["node", ["scripts/component-properties-smoke.mjs"]]
  ];
}

function runStep(command, args, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootCwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1000).unref();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ command, args, ok: true, stdout, stderr, timedOut: false });
      } else {
        resolve({
          command,
          args,
          ok: false,
          stdout,
          stderr: timedOut
            ? `${stderr.trim()}\nTimed out after ${timeoutMs}ms`.trim()
            : stderr,
          timedOut
        });
      }
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

const activeRuntime = await getActiveRuntime();
const steps = getStepsForEditor(activeRuntime?.editorType || "figma");
const results = [];
for (const [command, args] of steps) {
  results.push(await runStep(command, args));
}

const failed = results.filter((result) => !result.ok);

console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      editorType: activeRuntime?.editorType || "figma",
      steps: results.map((result) => ({
        command: result.command,
        args: result.args,
        ok: result.ok
      })),
      failed: failed.map((result) => ({
        command: result.command,
        args: result.args,
        timedOut: Boolean(result.timedOut),
        stderr: result.stderr.trim() || null,
        stdout: result.stdout.trim() || null
      }))
    },
    null,
    2
  )
);

if (failed.length > 0) {
  process.exit(1);
}
