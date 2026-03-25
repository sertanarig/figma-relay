import { describe, expect, it } from "vitest";
import { loadLocalEnvFromText } from "./local-env.js";

describe("local env loader", () => {
  it("loads missing keys from .env.local text", () => {
    const env = { EXISTING: "keep" } as Record<string, string | undefined>;

    loadLocalEnvFromText(
      `
# comment
FIGMA_ACCESS_TOKEN=test-token
FIGMA_API_ORIGIN=https://example.test
`,
      env
    );

    expect(env.EXISTING).toBe("keep");
    expect(env.FIGMA_ACCESS_TOKEN).toBe("test-token");
    expect(env.FIGMA_API_ORIGIN).toBe("https://example.test");
  });

  it("does not overwrite existing environment variables", () => {
    const env = {
      FIGMA_ACCESS_TOKEN: "already-set"
    } as Record<string, string | undefined>;

    loadLocalEnvFromText("FIGMA_ACCESS_TOKEN=from-file", env);

    expect(env.FIGMA_ACCESS_TOKEN).toBe("already-set");
  });

  it("supports quoted values", () => {
    const env = {} as Record<string, string | undefined>;

    loadLocalEnvFromText(
      `
FIGMA_ACCESS_TOKEN="quoted token"
FIGMA_API_ORIGIN='https://api.example.test'
`,
      env
    );

    expect(env.FIGMA_ACCESS_TOKEN).toBe("quoted token");
    expect(env.FIGMA_API_ORIGIN).toBe("https://api.example.test");
  });
});
