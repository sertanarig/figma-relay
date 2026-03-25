import process from "node:process";
import { clearState, readState } from "./runtime-state.mjs";
import { findRuntimeSimulatorPids } from "./process-discovery.mjs";
import { terminatePid } from "./process-control.mjs";

async function main() {
  const state = await readState("runtime-simulator");
  const pids = new Set();

  if (state?.pid) {
    pids.add(state.pid);
  }

  for (const pid of await findRuntimeSimulatorPids()) {
    pids.add(pid);
  }

  if (pids.size === 0) {
    console.log("runtime.simulator.down.noop no simulator process found");
    await clearState("runtime-simulator");
    return;
  }

  for (const pid of pids) {
    console.log(await terminatePid(pid, "runtime.simulator"));
  }

  await clearState("runtime-simulator");
}

main().catch((error) => {
  console.error(
    `runtime.simulator.down.failed ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
