import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const cwd = process.cwd();
const selfPid = process.pid;

async function listMatchingPids(patterns) {
  const { stdout } = await execFile("ps", ["-axo", "pid=,command="], { cwd });

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      if (!match) {
        return null;
      }

      return {
        pid: Number(match[1]),
        command: match[2]
      };
    })
    .filter(Boolean)
    .filter((entry) => entry.pid !== selfPid)
    .filter((entry) => patterns.some((pattern) => entry.command.includes(pattern)))
    .map((entry) => entry.pid);
}

export async function findBridgePids() {
  return listMatchingPids(["bridge/server.mjs"]);
}

export async function findRuntimeSimulatorPids() {
  return listMatchingPids(["scripts/runtime-simulator.mjs"]);
}
