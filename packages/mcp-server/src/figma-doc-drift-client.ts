type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;
type GenerateComponentDoc = (options: { componentName: string }) => Promise<any>;

function normalizeFamilyName(name: string) {
  const raw = String(name || "").trim();
  if (!raw) return "Unknown";
  const slashBase = raw.includes("/") ? raw.split("/")[0] : raw;
  return slashBase.replace(/\s+\d+\.\d+\.\d+$/u, "").trim() || slashBase.trim();
}

function tokenize(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function findDocumentationNode(nodes: any[], familyName: string) {
  const family = familyName.toLowerCase();
  return nodes.find((node) => {
    const name = String(node?.name || "").toLowerCase();
    return name.includes(family) && name.includes("documentation");
  }) || null;
}

export function createFigmaDocDriftClient({
  executeTool,
  generateComponentDoc
}: {
  executeTool: ExecuteTool;
  generateComponentDoc: GenerateComponentDoc;
}) {
  return {
    async detect(options: { componentName: string; depth?: number }) {
      const depth = typeof options.depth === "number" ? options.depth : 2;
      const componentDoc = await generateComponentDoc({
        componentName: options.componentName
      });

      const component = componentDoc?.component;
      if (!component?.name) {
        throw new Error("COMPONENT_DOC_NOT_FOUND");
      }

      const fileData = await executeTool("figma_get_file_data", {
        depth,
        verbosity: "summary"
      });

      const pageNodes = Array.isArray(fileData?.nodes) ? fileData.nodes : [];
      const familyName = normalizeFamilyName(component.name);
      const documentationNode = findDocumentationNode(pageNodes, familyName);
      const sectionReport = documentationNode
        ? await executeTool("figma_generate_section_report", {
            nodeId: documentationNode.id,
            depth: Math.min(depth, 3)
          }).catch(() => null)
        : null;

      const propertyNames = Array.isArray(component?.propertyNames) ? component.propertyNames : [];
      const normalizedProperties = propertyNames.map((name: string) =>
        String(name || "").replace(/^✎\s*/, "").replace(/#.+$/, "").trim()
      );
      const childNames = Array.isArray(sectionReport?.section?.sampleChildren)
        ? sectionReport.section.sampleChildren.map((item: any) => String(item?.name || ""))
        : [];
      const sectionTokens = tokenize(childNames.join(" "));
      const missingPropertyMentions = normalizedProperties.filter((name: string) => {
        const propTokens = tokenize(name);
        return propTokens.length > 0 && !propTokens.every((token) => sectionTokens.includes(token));
      });

      const findings = [];
      if (!documentationNode) {
        findings.push({
          category: "missing-section",
          severity: "warning",
          message: `No documentation section matching "${familyName}" was found on the active page.`
        });
      } else if (missingPropertyMentions.length > 0) {
        findings.push({
          category: "content-drift",
          severity: "warning",
          message: `${missingPropertyMentions.length} component property name(s) are not reflected in the sampled documentation section.`
        });
      }

      if (documentationNode && childNames.length === 0) {
        findings.push({
          category: "empty-section",
          severity: "info",
          message: "Documentation section exists but has no sampled child content."
        });
      }

      const score = Math.max(
        0,
        100 - findings.reduce((total, finding) => total + (finding.severity === "warning" ? 25 : 10), 0)
      );
      const status = score >= 85 ? "aligned" : score >= 65 ? "watch" : "drifted";
      const recommendations =
        findings.length === 0
          ? ["Documentation section appears aligned with the component family."]
          : [
              !documentationNode
                ? `Create or rename a documentation section so it clearly maps to "${familyName}".`
                : null,
              missingPropertyMentions.length > 0
                ? `Review the documentation section for missing property references: ${missingPropertyMentions.slice(0, 5).join(", ")}.`
                : null
            ].filter(Boolean);

      return {
        runtimeSessionId: componentDoc?.runtimeSessionId || sectionReport?.runtimeSessionId || null,
        component: {
          name: component.name,
          familyName,
          propertyCount: normalizedProperties.length
        },
        documentation: documentationNode
          ? {
              nodeId: documentationNode.id || null,
              name: documentationNode.name || "Unnamed",
              sampleChildren: childNames.slice(0, 10)
            }
          : null,
        summary: {
          score,
          status,
          findings: findings.length,
          missingPropertyMentions: missingPropertyMentions.length
        },
        findings,
        recommendations,
        missingPropertyMentions
      };
    }
  };
}
