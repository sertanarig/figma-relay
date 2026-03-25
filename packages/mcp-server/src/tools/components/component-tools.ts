import type { RuntimeComponentsGateway } from "@codex-figma/figma-runtime/src/commands/components/types.js";
import { createComponentSnapshot } from "@codex-figma/figma-runtime/src/commands/components/create-component.js";
import { instantiateComponentSnapshot } from "@codex-figma/figma-runtime/src/commands/components/instantiate-component.js";
import { searchComponentsSnapshot } from "@codex-figma/figma-runtime/src/commands/components/search-components.js";
import { setInstancePropertiesSnapshot } from "@codex-figma/figma-runtime/src/commands/components/set-instance-properties.js";

export function createComponent({
  runtimeGateway,
  name
}: {
  runtimeGateway: RuntimeComponentsGateway;
  name: string;
}) {
  return createComponentSnapshot(runtimeGateway, { name });
}

export function searchComponents({
  runtimeGateway,
  query
}: {
  runtimeGateway: RuntimeComponentsGateway;
  query?: string;
}) {
  return searchComponentsSnapshot(runtimeGateway, { query });
}

export function instantiateComponent({
  runtimeGateway,
  componentKey,
  nodeId,
  parentId,
  overrides,
  variant
}: {
  runtimeGateway: RuntimeComponentsGateway;
  componentKey?: string;
  nodeId?: string;
  parentId?: string;
  overrides?: Record<string, unknown>;
  variant?: Record<string, string>;
}) {
  return instantiateComponentSnapshot(runtimeGateway, {
    componentKey,
    nodeId,
    parentId,
    overrides,
    variant
  });
}

export function setInstanceProperties({
  runtimeGateway,
  nodeId,
  properties
}: {
  runtimeGateway: RuntimeComponentsGateway;
  nodeId: string;
  properties: Record<string, unknown>;
}) {
  return setInstancePropertiesSnapshot(runtimeGateway, { nodeId, properties });
}
