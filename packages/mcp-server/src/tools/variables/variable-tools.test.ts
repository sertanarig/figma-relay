import { describe, expect, it } from "vitest";
import {
  batchUpdateVariables,
  createVariable,
  deleteVariable,
  updateVariable
} from "./variable-tools.js";

describe("variable tools", () => {
  it("creates a variable", () => {
    const runtimeGateway = {
      createVariable(input: {
        collectionId: string;
        name: string;
        resolvedType: string;
        valuesByMode?: Record<string, string>;
      }) {
        return {
          runtimeSessionId: "runtime-1",
          variable: {
            id: "var-1",
            collectionId: input.collectionId,
            name: input.name,
            resolvedType: input.resolvedType,
            valuesByMode: input.valuesByMode ?? {}
          }
        };
      }
    };

    expect(
      createVariable({
        runtimeGateway,
        collectionId: "collection-1",
        name: "color/primary",
        resolvedType: "COLOR",
        valuesByMode: { Light: "#0055FF" }
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      variable: {
        id: "var-1",
        collectionId: "collection-1",
        name: "color/primary",
        resolvedType: "COLOR",
        valuesByMode: { Light: "#0055FF" }
      }
    });
  });

  it("updates one variable, batch updates many, and deletes a variable", () => {
    const runtimeGateway = {
      updateVariable(input: { variableId: string; modeId: string; value: string }) {
        return {
          runtimeSessionId: "runtime-1",
          ...input
        };
      },
      batchUpdateVariables(input: {
        updates: Array<{ variableId: string; modeId: string; value: string }>;
      }) {
        return {
          runtimeSessionId: "runtime-1",
          updates: input.updates
        };
      },
      deleteVariable(input: { variableId: string }) {
        return {
          runtimeSessionId: "runtime-1",
          variableId: input.variableId,
          deleted: true
        };
      }
    };

    expect(
      updateVariable({
        runtimeGateway,
        variableId: "var-1",
        modeId: "mode-light",
        value: "#0044EE"
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      variableId: "var-1",
      modeId: "mode-light",
      value: "#0044EE"
    });

    expect(
      batchUpdateVariables({
        runtimeGateway,
        updates: [
          { variableId: "var-1", modeId: "mode-light", value: "#0044EE" },
          { variableId: "var-2", modeId: "mode-light", value: "#111111" }
        ]
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      updates: [
        { variableId: "var-1", modeId: "mode-light", value: "#0044EE" },
        { variableId: "var-2", modeId: "mode-light", value: "#111111" }
      ]
    });

    expect(
      deleteVariable({
        runtimeGateway,
        variableId: "var-2"
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      variableId: "var-2",
      deleted: true
    });
  });
});
