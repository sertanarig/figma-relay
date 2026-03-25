import { spawn } from "node:child_process";

const rootCwd = process.cwd();
const DEFAULT_TIMEOUT_MS = Number(process.env.CODEX_RELEASE_SUMMARY_TIMEOUT_MS || 180000);

function run(command, args, timeoutMs = DEFAULT_TIMEOUT_MS) {
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
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `Command failed: ${command} ${args.join(" ")}\n${
              timedOut
                ? `Timed out after ${timeoutMs}ms\n`
                : ""
            }${stderr.trim() || stdout.trim()}`
          )
        );
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function summarizeReleaseReport(report) {
  const failed = Array.isArray(report.failed) ? report.failed : [];
  const steps = Array.isArray(report.steps) ? report.steps : [];
  const passedCount = steps.filter((step) => step.ok).length;
  const status = failed.length === 0 ? "ready" : "needs-attention";

  const checks = steps.map((step) => ({
    label: `${step.command} ${Array.isArray(step.args) ? step.args.join(" ") : ""}`.trim(),
    ok: Boolean(step.ok)
  }));

  return {
    status,
    passedChecks: passedCount,
    totalChecks: steps.length,
    checks,
    failed
  };
}

try {
  const { stdout } = await run("node", ["scripts/release-report.mjs"]);
  const report = JSON.parse(stdout);
  const summary = summarizeReleaseReport(report);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.status !== "ready") {
    process.exit(1);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const summary = {
    status: "needs-attention",
    passedChecks: 0,
    totalChecks: 1,
    checks: [
      {
        label: "node scripts/release-report.mjs",
        ok: false
      }
    ],
    failed: [
      {
        command: "node",
        args: ["scripts/release-report.mjs"],
        message
      }
    ]
  };

  console.log(JSON.stringify(summary, null, 2));
  process.exit(1);
}
