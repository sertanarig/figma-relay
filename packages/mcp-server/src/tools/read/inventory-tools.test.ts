import { describe, expect, it } from "vitest";
import { getComponents } from "./get-components.js";
import { getVariables } from "./get-variables.js";

describe("inventory tools", () => {
  it("returns variable collections and values", () => {
    const runtimeGateway = {
      getVariablesInventory() {
        return {
          runtimeSessionId: "runtime-1",
          collections: [
            {
              id: "collection-1",
              name: "Primitives",
              modes: ["Light"],
              variables: [
                {
                  id: "var-1",
                  name: "color/primary",
                  type: "COLOR",
                  valuesByMode: {
                    Light: "#0055FF"
                  }
                }
              ]
            }
          ]
        };
      }
    };

    expect(getVariables({ runtimeGateway })).toEqual({
      runtimeSessionId: "runtime-1",
      collections: [
        {
          id: "collection-1",
          name: "Primitives",
          modes: ["Light"],
          variables: [
            {
              id: "var-1",
              name: "color/primary",
              type: "COLOR",
              valuesByMode: {
                Light: "#0055FF"
              }
            }
          ]
        }
      ]
    });
  });

  it("returns component inventory", () => {
    const runtimeGateway = {
      getComponentsInventory() {
        return {
          runtimeSessionId: "runtime-1",
          components: [
            {
              id: "component-1",
              key: "button-primary",
              name: "Button/Primary",
              setName: "Button",
              propertyNames: ["State", "Size"]
            }
          ]
        };
      }
    };

    expect(getComponents({ runtimeGateway })).toEqual({
      runtimeSessionId: "runtime-1",
      components: [
        {
          id: "component-1",
          key: "button-primary",
          name: "Button/Primary",
          setName: "Button",
          propertyNames: ["State", "Size"]
        }
      ]
    });
  });
});
