type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;
type GetCatalog = (options: {
  componentKey?: string;
  nodeId?: string;
  componentName?: string;
}) => Promise<any>;

function normalizeFamilyName(name: string) {
  const raw = String(name || "").trim();
  if (!raw) return "Unknown";

  const slashBase = raw.includes("/") ? raw.split("/")[0] : raw;
  return slashBase.replace(/\s+\d+\.\d+\.\d+$/u, "").trim() || slashBase.trim();
}

function pickAnchorComponent(components: any[], options: {
  componentKey?: string;
  nodeId?: string;
  componentName?: string;
  familyName?: string;
}) {
  if (options.componentKey) {
    const match = components.find((item) => item?.key === options.componentKey);
    if (match) return match;
  }
  if (options.nodeId) {
    const match = components.find((item) => item?.id === options.nodeId);
    if (match) return match;
  }
  if (options.componentName) {
    const exact = components.find((item) => item?.name === options.componentName);
    if (exact) return exact;
  }
  if (options.familyName) {
    const family = normalizeFamilyName(options.familyName);
    return components.find((item) => normalizeFamilyName(item?.setName || item?.name || "") === family) || null;
  }
  return null;
}

function inferStatus(score: number) {
  if (score >= 85) return "ready";
  if (score >= 65) return "watch";
  return "needs-attention";
}

function isVariantMember(component: any, anchorName: string) {
  const name = String(component?.name || "");
  const setName = String(component?.setName || "");

  return name.includes("=") || (Boolean(setName) && setName === anchorName);
}

export function createFigmaComponentFamilyHealthClient({
  executeTool,
  getComponentPropertyCatalog
}: {
  executeTool: ExecuteTool;
  getComponentPropertyCatalog: GetCatalog;
}) {
  return {
    async getHealth(options: {
      componentKey?: string;
      nodeId?: string;
      componentName?: string;
      familyName?: string;
    }) {
      const inventory = await executeTool("figma_get_components", {
        query: typeof options.familyName === "string" ? options.familyName : options.componentName || undefined
      });
      const components = Array.isArray(inventory?.components) ? inventory.components : [];
      const anchor = pickAnchorComponent(components, options);

      if (!anchor) {
        throw new Error("COMPONENT_FAMILY_NOT_FOUND");
      }

      const familyName = normalizeFamilyName(anchor?.setName || anchor?.name || options.familyName || "");
      const familyComponents = components.filter((component: any) => {
        const candidateFamily = normalizeFamilyName(component?.setName || component?.name || "");
        return candidateFamily === familyName;
      });
      const anchorName = String(anchor?.name || "");
      const variantMembers = familyComponents.filter((component: any) => isVariantMember(component, anchorName));
      const standaloneMembers = familyComponents.filter((component: any) => !isVariantMember(component, anchorName));

      const uniqueNames = new Set(
        familyComponents.map((component: any) => String(component?.name || "").trim()).filter(Boolean)
      );
      const duplicateCount = Math.max(0, familyComponents.length - uniqueNames.size);
      const zeroPropertyCount = standaloneMembers.filter((component: any) => {
        const names = Array.isArray(component?.propertyNames) ? component.propertyNames : [];
        return names.length === 0;
      }).length;

      const catalog = await getComponentPropertyCatalog({
        componentKey: anchor?.key || undefined,
        nodeId: anchor?.id || undefined,
        componentName: anchor?.name || undefined
      }).catch(() => null);

      const collisionCount = typeof catalog?.summary?.collisionCount === "number" ? catalog.summary.collisionCount : 0;
      const variantPropertyCount =
        typeof catalog?.summary?.variantPropertyCount === "number" ? catalog.summary.variantPropertyCount : 0;
      const textPropertyCount =
        typeof catalog?.summary?.textPropertyCount === "number" ? catalog.summary.textPropertyCount : 0;

      const findings = [];
      if (duplicateCount > 0) {
        findings.push({
          category: "naming",
          severity: "warning",
          message: `${duplicateCount} duplicate component names found in this family.`
        });
      }
      if (zeroPropertyCount > 0) {
        findings.push({
          category: "properties",
          severity: "info",
          message: `${zeroPropertyCount} standalone family member(s) expose no component properties.`
        });
      }
      if (variantMembers.length > 0) {
        findings.push({
          category: "variants",
          severity: "info",
          message: `${variantMembers.length} variant member(s) were treated as variant children and not penalized for missing direct properties.`
        });
      }
      if (collisionCount > 0) {
        findings.push({
          category: "properties",
          severity: "warning",
          message: `${collisionCount} normalized property name collision(s) detected in the anchor component.`
        });
      }
      if (variantPropertyCount === 0 && familyComponents.length > 1) {
        findings.push({
          category: "variants",
          severity: "info",
          message: "Family has multiple members but no variant-style property was detected on the anchor component."
        });
      }

      const score = Math.max(
        0,
        100 - duplicateCount * 15 - zeroPropertyCount * 8 - collisionCount * 12 - (variantPropertyCount === 0 && familyComponents.length > 1 ? 10 : 0)
      );

      const recommendations = [];
      if (duplicateCount > 0) {
        recommendations.push("Rename duplicate family members so search and documentation stay deterministic.");
      }
      if (collisionCount > 0) {
        recommendations.push("Align component property names so text and non-text variants do not normalize to the same label.");
      }
      if (zeroPropertyCount > 0) {
        recommendations.push("Check whether property-less standalone members should be folded into variants or documented as standalone components.");
      }
      if (recommendations.length === 0) {
        recommendations.push("No immediate family-level issues detected.");
      }

      return {
        runtimeSessionId: inventory?.runtimeSessionId || catalog?.runtimeSessionId || null,
        family: {
          name: familyName,
          anchorComponentId: anchor?.id || null,
          anchorComponentName: anchor?.name || "Unnamed",
          count: familyComponents.length
        },
        summary: {
          score,
          status: inferStatus(score),
          duplicateCount,
          zeroPropertyCount,
          variantMemberCount: variantMembers.length,
          collisionCount,
          variantPropertyCount,
          textPropertyCount
        },
        members: familyComponents.slice(0, 20).map((component: any) => ({
          id: component?.id || null,
          key: component?.key || null,
          name: component?.name || "Unnamed",
          setName: component?.setName || null,
          propertyCount: Array.isArray(component?.propertyNames) ? component.propertyNames.length : 0
        })),
        findings,
        recommendations
      };
    }
  };
}
