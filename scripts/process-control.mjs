import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForExit(pid, retries = 10, retryMs = 100) {
  for (let index = 0; index < retries; index += 1) {
    if (!isAlive(pid)) {
      return true;
    }
    await delay(retryMs);
  }

  return !isAlive(pid);
}

export async function terminatePid(pid, label) {
  if (!isAlive(pid)) {
    return `${label}.stale pid=${pid}`;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return `${label}.stale pid=${pid}`;
  }

  const exitedAfterTerm = await waitForExit(pid);
  if (exitedAfterTerm) {
    return `${label}.stopped pid=${pid} signal=SIGTERM`;
  }

  try {
    process.kill(pid, "SIGKILL");
  } catch {
    return `${label}.stale pid=${pid}`;
  }

  const exitedAfterKill = await waitForExit(pid);
  if (exitedAfterKill) {
    return `${label}.stopped pid=${pid} signal=SIGKILL`;
  }

  return `${label}.stubborn pid=${pid}`;
}
