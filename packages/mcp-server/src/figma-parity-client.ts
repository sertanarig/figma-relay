type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type ParityInput = {
  expectedComponents?: string[];
  expectedVariables?: string[];
  expectedStyles?: string[];
};

function normalizeComparableName(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function compareNames(expected: string[], actual: string[]) {
  const expectedIndex = new Map(expected.map((name) => [normalizeComparableName(name), name]));
  const actualIndex = new Map(actual.map((name) => [normalizeComparableName(name), name]));

  return {
    matched: uniqueSorted(expected.filter((name) => actualIndex.has(normalizeComparableName(name)))),
    missing: uniqueSorted(expected.filter((name) => !actualIndex.has(normalizeComparableName(name)))),
    extra: uniqueSorted(actual.filter((name) => !expectedIndex.has(normalizeComparableName(name))))
  };
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function categorySummary(result: { matched: string[]; missing: string[]; extra: string[] }) {
  const checked = result.matched.length + result.missing.length;
  return {
    checked,
    matched: result.matched.length,
    missing: result.missing.length,
    extra: result.extra.length,
    score: checked > 0 ? clampScore((result.matched.length / checked) * 100) : 100
  };
}

export function createFigmaParityClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async check(input: ParityInput) {
      const [styles, variables, components] = await Promise.all([
        executeTool("figma_get_styles", {}),
        executeTool("figma_get_variables", {}),
        executeTool("figma_get_components", {})
      ]);

      const actualStyles = uniqueSorted([
        ...(Array.isArray(styles?.paintStyles) ? styles.paintStyles.map((item: { name?: string }) => String(item.name || "")) : []),
        ...(Array.isArray(styles?.textStyles) ? styles.textStyles.map((item: { name?: string }) => String(item.name || "")) : []),
        ...(Array.isArray(styles?.effectStyles) ? styles.effectStyles.map((item: { name?: string }) => String(item.name || "")) : []),
        ...(Array.isArray(styles?.gridStyles) ? styles.gridStyles.map((item: { name?: string }) => String(item.name || "")) : [])
      ]);
      const actualVariables = uniqueSorted(
        Array.isArray(variables?.variables) ? variables.variables.map((item: { name?: string }) => String(item.name || "")) : []
      );
      const actualComponents = uniqueSorted(
        Array.isArray(components?.components) ? components.components.map((item: { name?: string }) => String(item.name || "")) : []
      );

      const componentsResult = compareNames(uniqueSorted(input.expectedComponents || []), actualComponents);
      const variablesResult = compareNames(uniqueSorted(input.expectedVariables || []), actualVariables);
      const stylesResult = compareNames(uniqueSorted(input.expectedStyles || []), actualStyles);

      const checked =
        (input.expectedComponents || []).length +
        (input.expectedVariables || []).length +
        (input.expectedStyles || []).length;
      const matched =
        componentsResult.matched.length +
        variablesResult.matched.length +
        stylesResult.matched.length;
      const missing =
        componentsResult.missing.length +
        variablesResult.missing.length +
        stylesResult.missing.length;
      const extra =
        componentsResult.extra.length +
        variablesResult.extra.length +
        stylesResult.extra.length;

      const score = checked > 0 ? clampScore((matched / checked) * 100) : 100;

      return {
        summary: {
          checked,
          matched,
          missing,
          extra,
          score,
          categories: {
            components: categorySummary(componentsResult),
            variables: categorySummary(variablesResult),
            styles: categorySummary(stylesResult)
          }
        },
        components: componentsResult,
        variables: variablesResult,
        styles: stylesResult
      };
    }
  };
}
