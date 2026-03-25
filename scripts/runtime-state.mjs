import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const STATE_DIR = path.join(process.cwd(), ".figma-runtime-mcp");

function statePath(name) {
  return path.join(STATE_DIR, `${name}.json`);
}

export async function ensureStateDir() {
  await mkdir(STATE_DIR, { recursive: true });
}

export async function writeState(name, value) {
  await ensureStateDir();
  await writeFile(statePath(name), JSON.stringify(value, null, 2), "utf8");
}

export async function readState(name) {
  try {
    const raw = await readFile(statePath(name), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearState(name) {
  await rm(statePath(name), { force: true });
}
