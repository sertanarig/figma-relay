type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type GenerateDocInput = {
  componentName: string;
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function pickSuggestedByPrefix(candidates: string[], prefixes: string[]) {
  return uniqueSorted(
    candidates.filter((candidate) =>
      prefixes.some((prefix) => candidate.toLowerCase().startsWith(prefix.toLowerCase()))
    )
  );
}

function normalizePropertyName(name: string) {
  return String(name || "")
    .replace(/^✎\s*/, "")
    .replace(/#.+$/, "")
    .trim();
}

function toComponentExampleName(componentName: string) {
  const normalized = String(componentName || "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return normalized || "Component";
}

function toPropExampleName(propertyName: string) {
  const normalized = normalizePropertyName(propertyName)
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!normalized.length) {
    return "prop";
  }

  return normalized
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
}

function getFlatVariableNames(variablesPayload: any) {
  if (Array.isArray(variablesPayload?.variables) && variablesPayload.variables.length > 0) {
    return variablesPayload.variables.map((item: { name?: string }) => String(item.name || ""));
  }

  if (!Array.isArray(variablesPayload?.collections)) {
    return [];
  }

  return variablesPayload.collections.flatMap((collection: any) => {
    return Array.isArray(collection?.variables)
      ? collection.variables.map((item: { name?: string }) => String(item.name || ""))
      : [];
  });
}

function buildRecommendations(input: {
  propertyNames: string[];
  bindingsCount: number;
  suggestedStyles: string[];
  suggestedVariables: string[];
}) {
  const recommendations: string[] = [];

  if (input.propertyNames.length === 0) {
    recommendations.push("Document the expected states or expose component properties for common authoring flows.");
  }

  if (input.bindingsCount === 0 && input.suggestedVariables.length > 0) {
    recommendations.push("Bind core dimensions or spacing to existing variables to improve responsive consistency.");
  }

  if (input.suggestedStyles.length === 0) {
    recommendations.push("Link the component to at least one text, paint, or effect style reference for handoff clarity.");
  }

  if (recommendations.length === 0) {
    recommendations.push("No immediate documentation issues detected; this component is ready for handoff.");
  }

  return recommendations;
}

function buildExamples(componentName: string, propertyNames: string[]) {
  const exampleComponentName = toComponentExampleName(componentName);
  const examples = [
    {
      title: "Default usage",
      code: `<${exampleComponentName} />`
    }
  ];

  if (propertyNames.length > 0) {
    const propLine = propertyNames
      .slice(0, 3)
      .map((name) => `${toPropExampleName(name)}="..."`)
      .join(" ");
    examples.push({
      title: "Configured usage",
      code: `<${exampleComponentName} ${propLine} />`
    });
  }

  return examples;
}

export function createFigmaComponentDocClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async generate(input: GenerateDocInput) {
      const [file, componentsPayload, stylesPayload, variablesPayload] = await Promise.all([
        executeTool("figma_get_file_context", {}),
        executeTool("figma_get_components", { query: input.componentName }),
        executeTool("figma_get_styles", {}),
        executeTool("figma_get_variables", {})
      ]);

      const components = Array.isArray(componentsPayload?.components)
        ? componentsPayload.components as Array<{
            id: string;
            key?: string;
            name?: string;
            setName?: string | null;
            propertyNames?: string[];
          }>
        : [];
      const component = components.find((item) => item.name === input.componentName) || components[0];

      if (!component) {
        throw new Error(`COMPONENT_NOT_FOUND:${input.componentName}`);
      }

      const [detailsPayload, boundVariablesPayload, screenshotPayload] = await Promise.all([
        executeTool("figma_get_component_details", {
          componentKey: component.key,
          nodeId: component.id,
          componentName: component.name
        }).catch(() => null),
        executeTool("figma_get_bound_variables", {
          nodeId: component.id
        }).catch(() => ({ bindings: [] })),
        executeTool("figma_take_screenshot", {
          nodeId: component.id
        }).catch(() => null)
      ]);

      const detailComponent = detailsPayload?.component || component;
      const bindings = Array.isArray(boundVariablesPayload?.bindings)
        ? boundVariablesPayload.bindings
        : [];

      const styleNames = uniqueSorted([
        ...(Array.isArray(stylesPayload?.paintStyles) ? stylesPayload.paintStyles.map((item: { name?: string }) => String(item.name || "")) : []),
        ...(Array.isArray(stylesPayload?.textStyles) ? stylesPayload.textStyles.map((item: { name?: string }) => String(item.name || "")) : []),
        ...(Array.isArray(stylesPayload?.effectStyles) ? stylesPayload.effectStyles.map((item: { name?: string }) => String(item.name || "")) : []),
        ...(Array.isArray(stylesPayload?.gridStyles) ? stylesPayload.gridStyles.map((item: { name?: string }) => String(item.name || "")) : [])
      ]);
      const variableNames = uniqueSorted(getFlatVariableNames(variablesPayload));

      const suggestedStyles = uniqueSorted([
        ...pickSuggestedByPrefix(styleNames, ["color/", "color", "typography/", "typography"]),
        ...pickSuggestedByPrefix(styleNames, ["effects/"])
      ]).slice(0, 6);
      const suggestedVariables = uniqueSorted([
        ...pickSuggestedByPrefix(variableNames, ["color/"]),
        ...pickSuggestedByPrefix(variableNames, ["spacing/"])
      ]).slice(0, 8);
      const propertyNames = Array.isArray(detailComponent.propertyNames) ? detailComponent.propertyNames : [];
      const recommendations = buildRecommendations({
        propertyNames,
        bindingsCount: bindings.length,
        suggestedStyles,
        suggestedVariables
      });
      const examples = buildExamples(String(detailComponent.name || component.name || "Component"), propertyNames);

      const markdown = [
        `# ${detailComponent.name}`,
        "",
        `Source file: ${file?.fileName || "Unknown"} / ${file?.pageName || "Unknown"}`,
        "",
        "## Overview",
        "",
        `- Component set: ${detailComponent.setName || "Standalone"}`,
        `- Component key: ${detailComponent.key || detailComponent.id}`,
        `- Node type: ${detailComponent.nodeType || "Unknown"}`,
        `- Size: ${detailComponent.width || "?"} x ${detailComponent.height || "?"}`,
        `- Properties: ${propertyNames.map((item: string) => normalizePropertyName(item)).join(", ") || "None"}`,
        `- Bound variables: ${bindings.length}`,
        `- Screenshot attached: ${screenshotPayload?.dataUrl ? "Yes" : "No"}`,
        "",
        "## Bound Variable References",
        "",
        ...(bindings.length > 0
          ? bindings.slice(0, 10).map((item: { field?: string; variableName?: string; variableId?: string }) =>
              `- ${item.field || "field"} -> ${item.variableName || item.variableId || "Unknown"}`
            )
          : ["- None"]),
        "",
        "## Suggested Style References",
        "",
        ...(suggestedStyles.length > 0 ? suggestedStyles.map((item) => `- ${item}`) : ["- None"]),
        "",
        "## Suggested Variable References",
        "",
        ...(suggestedVariables.length > 0 ? suggestedVariables.map((item) => `- ${item}`) : ["- None"]),
        "",
        "## Recommendations",
        "",
        ...recommendations.map((item) => `- ${item}`),
        "",
        "## Usage Examples",
        "",
        ...examples.flatMap((example) => [
          `### ${example.title}`,
          "```tsx",
          example.code,
          "```"
        ])
      ].join("\n");

      return {
        component: {
          id: detailComponent.id,
          key: detailComponent.key || detailComponent.id,
          name: detailComponent.name,
          setName: detailComponent.setName || null,
          propertyNames: Array.isArray(detailComponent.propertyNames) ? detailComponent.propertyNames : [],
          nodeType: detailComponent.nodeType || null,
          width: typeof detailComponent.width === "number" ? detailComponent.width : null,
          height: typeof detailComponent.height === "number" ? detailComponent.height : null
        },
        summary: {
          propertyCount: propertyNames.length,
          bindingsCount: bindings.length,
          hasScreenshot: Boolean(screenshotPayload?.dataUrl),
          suggestedStyles,
          suggestedVariables,
          recommendations,
          exampleCount: examples.length
        },
        screenshot: screenshotPayload,
        bindings,
        examples,
        markdown
      };
    }
  };
}
