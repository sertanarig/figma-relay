import { describe, expect, it } from "vitest";
import { addMode, createVariableCollection, renameMode } from "./collection-tools.js";

describe("variable collection tools", () => {
  it("creates a variable collection", () => {
    const runtimeGateway = {
      createVariableCollection(input: { name: string; initialModeName?: string; additionalModes?: string[] }) {
        return {
          runtimeSessionId: "runtime-1",
          collection: {
            id: "collection-1",
            name: input.name,
            modes: [input.initialModeName ?? "Mode 1", ...(input.additionalModes ?? [])]
          }
        };
      }
    };

    expect(
      createVariableCollection({
        runtimeGateway,
        name: "Brand Tokens",
        initialModeName: "Light",
        additionalModes: ["Dark"]
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      collection: {
        id: "collection-1",
        name: "Brand Tokens",
        modes: ["Light", "Dark"]
      }
    });
  });

  it("adds and renames collection modes", () => {
    const runtimeGateway = {
      addMode(input: { collectionId: string; modeName: string }) {
        return {
          runtimeSessionId: "runtime-1",
          collectionId: input.collectionId,
          modeId: "mode-dark",
          modeName: input.modeName
        };
      },
      renameMode(input: { collectionId: string; modeId: string; newName: string }) {
        return {
          runtimeSessionId: "runtime-1",
          collectionId: input.collectionId,
          modeId: input.modeId,
          modeName: input.newName
        };
      }
    };

    expect(
      addMode({
        runtimeGateway,
        collectionId: "collection-1",
        modeName: "Dark"
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      collectionId: "collection-1",
      modeId: "mode-dark",
      modeName: "Dark"
    });

    expect(
      renameMode({
        runtimeGateway,
        collectionId: "collection-1",
        modeId: "mode-dark",
        newName: "Night"
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      collectionId: "collection-1",
      modeId: "mode-dark",
      modeName: "Night"
    });
  });
});
