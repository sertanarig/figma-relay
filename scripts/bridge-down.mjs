import process from "node:process";
import { clearState, readState } from "./runtime-state.mjs";
import { findBridgePids } from "./process-discovery.mjs";
import { terminatePid } from "./process-control.mjs";

async function main() {
  const state = await readState("bridge");
  const pids = new Set();

  if (state?.pid) {
    pids.add(state.pid);
  }

  for (const pid of await findBridgePids()) {
    pids.add(pid);
  }

  if (pids.size === 0) {
    console.log("bridge.down.noop no bridge process found");
    await clearState("bridge");
    return;
  }

  for (const pid of pids) {
    console.log(await terminatePid(pid, "bridge"));
  }

  await clearState("bridge");
  await clearState("active-runtime");
}

main().catch((error) => {
  console.error(`bridge.down.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
