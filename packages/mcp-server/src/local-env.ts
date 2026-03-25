import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function normalizeValue(rawValue: string) {
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function loadLocalEnvFromText(
  text: string,
  env: Record<string, string | undefined> = process.env
) {
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = normalizeValue(line.slice(separatorIndex + 1));

    if (!key || env[key] !== undefined) {
      continue;
    }

    env[key] = value;
  }

  return env;
}

export function loadLocalEnv({
  cwd = process.cwd(),
  env = process.env
}: {
  cwd?: string;
  env?: Record<string, string | undefined>;
} = {}) {
  const envPath = path.join(cwd, ".env.local");
  if (!existsSync(envPath)) {
    return { loaded: false, path: envPath };
  }

  const text = readFileSync(envPath, "utf8");
  loadLocalEnvFromText(text, env);
  return { loaded: true, path: envPath };
}
