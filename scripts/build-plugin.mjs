import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const sourceRoots = [
  path.join(rootDir, "src", "code.js"),
  path.join(rootDir, "src", "ui.html"),
  path.join(rootDir, "src", "plugin"),
  path.join(rootDir, "manifest.json")
];

async function walkFiles(targetPath) {
  const entryStat = await stat(targetPath);
  if (entryStat.isFile()) {
    return [targetPath];
  }

  const entries = await readdir(targetPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => walkFiles(path.join(targetPath, entry.name)))
  );
  return nested.flat();
}

async function computePluginHash() {
  const hash = createHash("sha256");
  const files = (
    await Promise.all(sourceRoots.map((targetPath) => walkFiles(targetPath)))
  )
    .flat()
    .sort((left, right) => left.localeCompare(right));

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    hash.update(relativePath);
    hash.update("\n");
    hash.update(await readFile(filePath));
    hash.update("\n");
  }

  return hash.digest("hex");
}

let previousBuildMeta = null;
try {
  previousBuildMeta = JSON.parse(await readFile(path.join(distDir, "build-meta.json"), "utf8"));
} catch {
  previousBuildMeta = null;
}

const pluginHash = await computePluginHash();
const buildStamp =
  previousBuildMeta && previousBuildMeta.pluginHash === pluginHash
    ? previousBuildMeta.buildStamp
    : new Date().toISOString();
const buildMeta = {
  buildStamp,
  pluginHash
};

await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [path.join(rootDir, "src", "code.js")],
  bundle: true,
  format: "iife",
  platform: "browser",
  outfile: path.join(distDir, "code.js"),
  logLevel: "silent",
  target: ["es2017"],
  define: {
    __BUILD_STAMP__: JSON.stringify(buildStamp)
  }
});

const uiTemplate = await readFile(path.join(rootDir, "src", "ui.html"), "utf8");
await writeFile(
  path.join(distDir, "ui.html"),
  uiTemplate.replaceAll("__BUILD_STAMP__", buildStamp),
  "utf8"
);

await writeFile(
  path.join(distDir, "build-meta.json"),
  `${JSON.stringify(buildMeta, null, 2)}\n`,
  "utf8"
);
