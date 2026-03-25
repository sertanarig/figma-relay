import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { toolRegistry } from "./index.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const manifestPath = path.join(repoRoot, "manifest.json");

describe("figjam support", () => {
  it("enables figjam editor type in the manifest", () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(manifest.editorType).toContain("figjam");
  });

  it("documents figjam node creation on figma_create_node", () => {
    const tool = toolRegistry.find((entry) => entry.name === "figma_create_node");
    expect(tool).toBeTruthy();
    expect(tool?.description.toLowerCase()).toContain("figjam");
    expect(tool?.description.toLowerCase()).toContain("sticky");
  });
});
