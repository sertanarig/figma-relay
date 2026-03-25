type GetComponentDetails = (options: {
  componentKey?: string;
  nodeId?: string;
  componentName?: string;
}) => Promise<any>;

type CatalogProperty = {
  name: string;
  rawNames: string[];
  kind: "text" | "variant" | "property";
  occurrences: number;
  hasNameCollision: boolean;
};

function normalizePropertyName(name: string) {
  return String(name || "")
    .replace(/^✎\s*/, "")
    .replace(/#.+$/, "")
    .trim();
}

function inferPropertyKind(rawNames: string[]): CatalogProperty["kind"] {
  if (rawNames.some((name) => String(name).startsWith("✎ "))) {
    return "text";
  }

  const normalized = rawNames.map((name) => normalizePropertyName(name).toLowerCase());
  if (normalized.some((name) => name === "state" || name === "value" || name === "size" || name === "variant")) {
    return "variant";
  }

  return "property";
}

export function createFigmaComponentPropertyCatalogClient({
  getComponentDetails
}: {
  getComponentDetails: GetComponentDetails;
}) {
  return {
    async getCatalog(options: {
      componentKey?: string;
      nodeId?: string;
      componentName?: string;
    }) {
      const details = await getComponentDetails(options);
      const component = details?.component;
      if (!component?.id) {
        throw new Error("COMPONENT_NOT_FOUND");
      }

      const propertyNames = Array.isArray(component.propertyNames) ? component.propertyNames : [];
      const groups = propertyNames.reduce((map: Map<string, string[]>, rawName: string) => {
        const normalized = normalizePropertyName(rawName);
        const current = map.get(normalized) || [];
        current.push(rawName);
        map.set(normalized, current);
        return map;
      }, new Map<string, string[]>());

      const properties: CatalogProperty[] = Array.from(groups.entries() as Iterable<[string, string[]]>).map(([name, rawNames]) => ({
        name,
        rawNames,
        kind: inferPropertyKind(rawNames),
        occurrences: rawNames.length,
        hasNameCollision: rawNames.length > 1
      }));

      return {
        runtimeSessionId: details?.runtimeSessionId || null,
        component: {
          id: component.id,
          key: component.key || component.id,
          name: component.name,
          setName: component.setName || null
        },
        summary: {
          propertyCount: propertyNames.length,
          normalizedPropertyCount: properties.length,
          textPropertyCount: properties.filter((item) => item.kind === "text").length,
          variantPropertyCount: properties.filter((item) => item.kind === "variant").length,
          collisionCount: properties.filter((item) => item.hasNameCollision).length
        },
        properties
      };
    }
  };
}
