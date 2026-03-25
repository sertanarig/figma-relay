import { describe, expect, it } from "vitest";
import {
  createComponent,
  instantiateComponent,
  searchComponents,
  setInstanceProperties
} from "./component-tools.js";

describe("component tools", () => {
  it("creates and searches components", () => {
    const runtimeGateway = {
      createComponent(input: { name: string }) {
        return {
          runtimeSessionId: "runtime-1",
          component: {
            id: "component-1",
            key: "button-primary",
            name: input.name
          }
        };
      },
      searchComponents(input: { query?: string }) {
        return {
          runtimeSessionId: "runtime-1",
          components: [
            {
              id: "component-1",
              key: "button-primary",
              name: "Button/Primary"
            }
          ].filter((component) =>
            input.query ? component.name.toLowerCase().includes(input.query.toLowerCase()) : true
          )
        };
      }
    };

    expect(createComponent({ runtimeGateway, name: "Button/Primary" })).toEqual({
      runtimeSessionId: "runtime-1",
      component: {
        id: "component-1",
        key: "button-primary",
        name: "Button/Primary"
      }
    });

    expect(searchComponents({ runtimeGateway, query: "primary" })).toEqual({
      runtimeSessionId: "runtime-1",
      components: [
        {
          id: "component-1",
          key: "button-primary",
          name: "Button/Primary"
        }
      ]
    });
  });

  it("instantiates a component and updates instance properties", () => {
    const runtimeGateway = {
      instantiateComponent(input: {
        componentKey?: string;
        nodeId?: string;
        parentId?: string;
        overrides?: Record<string, unknown>;
        variant?: Record<string, string>;
      }) {
        return {
          runtimeSessionId: "runtime-1",
          instance: {
            id: "instance-1",
            componentKey: input.componentKey ?? null,
            nodeId: input.nodeId ?? null,
            parentId: input.parentId ?? null
          }
        };
      },
      setInstanceProperties(input: {
        nodeId: string;
        properties: Record<string, unknown>;
      }) {
        return {
          runtimeSessionId: "runtime-1",
          nodeId: input.nodeId,
          properties: input.properties
        };
      }
    };

    expect(
      instantiateComponent({
        runtimeGateway,
        componentKey: "button-primary",
        nodeId: "component-1",
        parentId: "frame-1",
        variant: { State: "Default" }
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      instance: {
        id: "instance-1",
        componentKey: "button-primary",
        nodeId: "component-1",
        parentId: "frame-1"
      }
    });

    expect(
      setInstanceProperties({
        runtimeGateway,
        nodeId: "instance-1",
        properties: { Label: "Continue" }
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      nodeId: "instance-1",
      properties: { Label: "Continue" }
    });
  });
});
