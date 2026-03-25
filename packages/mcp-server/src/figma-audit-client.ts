type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type AuditOptions = {
  profile?: "default" | "release";
  ignorePrefixes?: string[];
  ignoreNamePatterns?: string[];
  relaxedComponentNaming?: boolean;
};
type AuditWaiver = {
  id: string;
  fileKey?: string | null;
  profile?: "default" | "release" | "all";
  category: string;
  messagePattern: string;
  createdAt: string;
  note?: string;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function countInvalidSlashNames(items: Array<{ name?: string }>) {
  return items.filter((item) => {
    const name = String(item.name || "");
    return Boolean(name) && !name.includes("/");
  }).length;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toNameMatchers(patterns: string[] = []) {
  return patterns
    .map((pattern) => {
      const trimmed = String(pattern || "").trim();
      if (!trimmed) {
        return null;
      }

      try {
        return new RegExp(trimmed, "i");
      } catch {
        return new RegExp(escapeRegExp(trimmed), "i");
      }
    })
    .filter(Boolean) as RegExp[];
}

function shouldIgnoreName(name: string, options: ResolvedAuditOptions) {
  const normalized = normalizeName(name);

  if (!normalized) {
    return false;
  }

  if (options.ignorePrefixes.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }

  return options.ignoreNameMatchers.some((pattern) => pattern.test(name));
}

function isRelaxedComponentName(name: string) {
  return (
    name.includes("/") ||
    /\b\d+\.\d+\.\d+\b/.test(name) ||
    /^[A-Z][A-Za-z0-9.+-]*(?: [A-Z0-9][A-Za-z0-9.+-]*){0,4}$/.test(name)
  );
}

type ResolvedAuditOptions = {
  profile: "default" | "release";
  ignorePrefixes: string[];
  ignoreNameMatchers: RegExp[];
  relaxedComponentNaming: boolean;
};

function resolveAuditOptions(options: AuditOptions = {}): ResolvedAuditOptions {
  const profile = options.profile === "release" ? "release" : "default";
  const ignorePrefixes = (options.ignorePrefixes || []).map((item) => normalizeName(String(item)));
  const ignoreNamePatterns = options.ignoreNamePatterns || [];

  if (profile === "release" && !ignorePrefixes.includes("runtime mcp")) {
    ignorePrefixes.push("runtime mcp");
  }

  if (profile === "release" && !ignoreNamePatterns.some((item) => String(item).toLowerCase().includes("documentation"))) {
    ignoreNamePatterns.push("documentation");
  }

  return {
    profile,
    ignorePrefixes,
    ignoreNameMatchers: toNameMatchers(ignoreNamePatterns),
    relaxedComponentNaming:
      typeof options.relaxedComponentNaming === "boolean"
        ? options.relaxedComponentNaming
        : profile === "release"
  };
}

type NamedItem = { name?: string };
type ComponentItem = { name?: string; setName?: string | null; propertyNames?: string[] };
type ComponentFamily = { familyName: string; members: number; hasProperties: boolean };

function getFlatVariablesInventory(variables: any): NamedItem[] {
  if (Array.isArray(variables?.variables) && variables.variables.length > 0) {
    return variables.variables;
  }

  if (!Array.isArray(variables?.collections)) {
    return [];
  }

  return variables.collections.flatMap((collection: any) => {
    return Array.isArray(collection?.variables) ? collection.variables : [];
  });
}

function countDuplicateNames(items: Array<{ name?: string }>) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const name = String(item?.name || "").trim();
    if (!name) {
      continue;
    }
    const normalized = normalizeName(name);
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  let duplicates = 0;
  for (const count of counts.values()) {
    if (count > 1) {
      duplicates += count - 1;
    }
  }

  return duplicates;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function safeRatio(numerator: number, denominator: number) {
  if (denominator <= 0) return 100;
  return clampScore((numerator / denominator) * 100);
}

function calculateNamingScore(
  options: ResolvedAuditOptions,
  counts: {
    invalidVariableNames: number;
    invalidComponentNames: number;
    invalidStyleNames: number;
    duplicateVariableNames: number;
    duplicateComponentNames: number;
    duplicateStyleNames: number;
  }
) {
  const tuned =
    options.profile === "release"
      ? {
          invalidVariableNames: 5,
          invalidComponentNames: 6,
          invalidStyleNames: 4,
          duplicateVariableNames: 5,
          duplicateComponentNames: 3,
          duplicateStyleNames: 5,
          duplicateCap: 5
        }
      : {
          invalidVariableNames: 7,
          invalidComponentNames: 14,
          invalidStyleNames: 5,
          duplicateVariableNames: 8,
          duplicateComponentNames: 12,
          duplicateStyleNames: 8,
          duplicateCap: Number.POSITIVE_INFINITY
        };

  return clampScore(
    100 -
      counts.invalidVariableNames * tuned.invalidVariableNames -
      counts.invalidComponentNames * tuned.invalidComponentNames -
      counts.invalidStyleNames * tuned.invalidStyleNames -
      Math.min(counts.duplicateVariableNames, tuned.duplicateCap) * tuned.duplicateVariableNames -
      Math.min(counts.duplicateComponentNames, tuned.duplicateCap) * tuned.duplicateComponentNames -
      Math.min(counts.duplicateStyleNames, tuned.duplicateCap) * tuned.duplicateStyleNames
  );
}

export function createFigmaAuditClient({
  executeTool,
  listWaivers
}: {
  executeTool: ExecuteTool;
  listWaivers?: () => Promise<AuditWaiver[]>;
}) {
  return {
    async audit(options: AuditOptions = {}) {
      const resolved = resolveAuditOptions(options);
      const [file, styles, variables, components] = await Promise.all([
        executeTool("figma_get_file_context", {}),
        executeTool("figma_get_styles", {}),
        executeTool("figma_get_variables", {}),
        executeTool("figma_get_components", {})
      ]);

      const variableList = getFlatVariablesInventory(variables).filter((item: NamedItem) => {
        return !shouldIgnoreName(String(item?.name || ""), resolved);
      });
      const componentList = (Array.isArray(components?.components) ? components.components : []).filter((item: ComponentItem) => {
        return !shouldIgnoreName(String(item?.name || ""), resolved);
      });
      const styleCount = [
        styles?.paintStyles,
        styles?.textStyles,
        styles?.effectStyles,
        styles?.gridStyles
      ].reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0);
      const textStyles = Array.isArray(styles?.textStyles) ? styles.textStyles : [];
      const paintStyles = Array.isArray(styles?.paintStyles) ? styles.paintStyles : [];
      const effectStyles = Array.isArray(styles?.effectStyles) ? styles.effectStyles : [];
      const gridStyles = Array.isArray(styles?.gridStyles) ? styles.gridStyles : [];
      const styleList = [...textStyles, ...paintStyles, ...effectStyles, ...gridStyles].filter((item: NamedItem) => {
        return !shouldIgnoreName(String(item?.name || ""), resolved);
      });
      const collectionCount = Array.isArray(variables?.collections) ? variables.collections.length : 0;

      const findings = [];

      const invalidVariableNames = countInvalidSlashNames(variableList);
      if (invalidVariableNames > 0) {
        findings.push({
          category: "variables",
          severity: "warning",
          message: `${invalidVariableNames} variable names do not follow slash-based token naming.`
        });
      }

      const componentFamilies: ComponentFamily[] = Array.from(
        componentList.reduce((map: Map<string, ComponentFamily>, item: ComponentItem) => {
          const familyName = String(item?.setName || item?.name || "").trim();
          if (!familyName || shouldIgnoreName(familyName, resolved)) {
            return map;
          }

          const current = map.get(familyName) || {
            familyName,
            members: 0,
            hasProperties: false
          };
          current.members += 1;
          if (Array.isArray(item?.propertyNames) && item.propertyNames.length > 0) {
            current.hasProperties = true;
          }
          map.set(familyName, current);
          return map;
        }, new Map<string, ComponentFamily>()).values()
      );

      const invalidComponentNames = componentFamilies.filter((family) => {
        const name = family.familyName;
        if (!name) {
          return false;
        }

        if (resolved.relaxedComponentNaming) {
          return !isRelaxedComponentName(name);
        }

        return !name.includes("/");
      }).length;
      if (invalidComponentNames > 0) {
        findings.push({
          category: "components",
          severity: "warning",
          message: `${invalidComponentNames} component family names do not follow the active naming rules.`
        });
      }

      const invalidStyleNames = countInvalidSlashNames(styleList);
      if (invalidStyleNames > 0) {
        findings.push({
          category: "styles",
          severity: "info",
          message: `${invalidStyleNames} style names do not follow slash-based naming.`
        });
      }

      const duplicateVariableNames = countDuplicateNames(variableList);
      if (duplicateVariableNames > 0) {
        findings.push({
          category: "variables",
          severity: "warning",
          message: `${duplicateVariableNames} duplicate variable names detected.`
        });
      }

      const duplicateComponentNames = countDuplicateNames(componentList);
      if (duplicateComponentNames > 0) {
        findings.push({
          category: "components",
          severity: "warning",
          message: `${duplicateComponentNames} duplicate component names detected.`
        });
      }

      const duplicateStyleNames = countDuplicateNames(styleList);
      if (duplicateStyleNames > 0) {
        findings.push({
          category: "styles",
          severity: "warning",
          message: `${duplicateStyleNames} duplicate style names detected.`
        });
      }

      const componentFamiliesWithoutProperties = componentFamilies.filter((family) => {
        return family.members > 1 && !family.hasProperties;
      }).length;
      if (componentFamiliesWithoutProperties > 0) {
        findings.push({
          category: "components",
          severity: "info",
          message: `${componentFamiliesWithoutProperties} multi-variant component families expose no variant/property metadata.`
        });
      }

      if (textStyles.length === 0) {
        findings.push({
          category: "styles",
          severity: "warning",
          message: "No text styles found in the active file."
        });
      }

      if (paintStyles.length === 0) {
        findings.push({
          category: "styles",
          severity: "warning",
          message: "No paint styles found in the active file."
        });
      }

      if (collectionCount === 0) {
        findings.push({
          category: "variables",
          severity: "warning",
          message: "No variable collections found in the active file."
        });
      }

      const namingScore = calculateNamingScore(resolved, {
        invalidVariableNames,
        invalidComponentNames,
        invalidStyleNames,
        duplicateVariableNames,
        duplicateComponentNames,
        duplicateStyleNames
      });
      const structureScore = clampScore(100 - componentFamiliesWithoutProperties * 8);
      const coverageScore = clampScore(
        safeRatio(textStyles.length > 0 ? 1 : 0, 1) * 0.4 +
        safeRatio(paintStyles.length > 0 ? 1 : 0, 1) * 0.4 +
        safeRatio(collectionCount > 0 ? 1 : 0, 1) * 0.2
      );

      const score = clampScore(
        namingScore * 0.45 + structureScore * 0.25 + coverageScore * 0.3
      );

      const activeWaivers = listWaivers ? await listWaivers().catch(() => []) : [];
      const applicableWaivers = activeWaivers.filter((waiver) => {
        const profileMatches = !waiver.profile || waiver.profile === "all" || waiver.profile === resolved.profile;
        const fileMatches = !waiver.fileKey || waiver.fileKey === file?.fileKey;
        return profileMatches && fileMatches;
      });

      const suppressed: Array<{ waiverId: string; category: string; message: string }> = [];
      const visibleFindings = findings.filter((finding: any) => {
        const match = applicableWaivers.find((waiver) => {
          if (waiver.category !== finding.category) {
            return false;
          }
          const message = String(finding.message || "");
          try {
            return new RegExp(waiver.messagePattern, "i").test(message);
          } catch {
            return message.toLowerCase().includes(String(waiver.messagePattern || "").toLowerCase());
          }
        });

        if (match) {
          suppressed.push({
            waiverId: match.id,
            category: finding.category,
            message: finding.message
          });
          return false;
        }

        return true;
      });

      return {
        file: {
          fileKey: file?.fileKey || null,
          fileName: file?.fileName || "Unknown",
          pageName: file?.pageName || "Unknown"
        },
        summary: {
          styles: styleCount,
          variables: variableList.length,
          collections: collectionCount,
          components: componentList.length,
          findings: visibleFindings.length,
          suppressedFindings: suppressed.length,
          profile: resolved.profile,
          categoryScores: {
            naming: namingScore,
            structure: structureScore,
            coverage: coverageScore
          },
          score
        },
        findings: visibleFindings,
        waivers: {
          active: applicableWaivers,
          suppressed
        }
      };
    }
  };
}
