import { spawn } from "node:child_process";

const rootCwd = process.cwd();

const steps = [
  ["npm", ["test"]],
  ["npm", ["run", "build"]],
  ["npm", ["run", "smoke:e2e"]],
  ["npm", ["run", "smoke:styles"]],
  ["npm", ["run", "smoke:stress", "--", "--iterations=5"]],
  ["npm", ["run", "smoke:write-stress", "--", "--iterations=3"]],
  ["npm", ["run", "smoke:mixed-stress", "--", "--iterations=2"]],
  ["node", ["scripts/comments-smoke.mjs"]],
  ["node", ["scripts/component-properties-smoke.mjs"]]
];

function runStep(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootCwd,
      stdio: "inherit",
      env: process.env
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

for (const [command, args] of steps) {
  console.log(`\n==> ${command} ${args.join(" ")}`);
  await runStep(command, args);
}

console.log("\nrelease.check ok");
