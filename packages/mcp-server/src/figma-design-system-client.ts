type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type CacheEntry = {
  value: Promise<any>;
  expiresAt: number;
};

function normalizeNames(items: any[], pickName: (item: any) => string | null) {
  return items
    .map(pickName)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b));
}

function buildNameGroups(items: any[], pickName: (item: any) => string | null, limit = 50) {
  const groups = new Map<string, string[]>();

  for (const item of items) {
    const name = pickName(item);
    if (!name) {
      continue;
    }

    const [group = "Ungrouped"] = name.split("/");
    const bucket = groups.get(group) || [];
    if (bucket.length < limit) {
      bucket.push(name);
    }
    groups.set(group, bucket);
  }

  return Array.from(groups.entries())
    .map(([group, names]) => ({
      group,
      names: names.sort((a, b) => a.localeCompare(b)),
      count: names.length
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

function getSortableLabel(item: any) {
  return String(item?.name || item?.group || "");
}

function resolveBrowsePreset(options: {
  preset?: string;
  sortBy?: "name" | "count";
  order?: "asc" | "desc";
}) {
  if (options.preset === "largest-groups") {
    return {
      sortBy: "count" as const,
      order: "desc" as const
    };
  }

  if (options.preset === "alphabetical") {
    return {
      sortBy: "name" as const,
      order: "asc" as const
    };
  }

  if (options.preset === "smallest-groups") {
    return {
      sortBy: "count" as const,
      order: "asc" as const
    };
  }

  return {
    sortBy: options.sortBy,
    order: options.order
  };
}

function sortNamedItems<T>(items: T[], sortBy?: "name" | "count", order?: "asc" | "desc") {
  const direction = order === "desc" ? -1 : 1;
  const normalized = [...items];

  if (sortBy === "count") {
    return normalized.sort((a: any, b: any) => {
      const aCount = typeof a?.count === "number" ? a.count : 0;
      const bCount = typeof b?.count === "number" ? b.count : 0;
      return (aCount - bCount) * direction || getSortableLabel(a).localeCompare(getSortableLabel(b));
    });
  }

  return normalized.sort((a, b) => getSortableLabel(a).localeCompare(getSortableLabel(b)) * direction);
}

function buildComponentIdentifier(component: any) {
  return {
    id: component?.id || null,
    key: component?.key || null,
    name: component?.name || "Unnamed",
    setName: component?.setName || null,
    nodeType: component?.nodeType || null,
    width: component?.width ?? null,
    height: component?.height ?? null,
    propertyNames: Array.isArray(component?.propertyNames) ? component.propertyNames : []
  };
}

export function createFigmaDesignSystemClient({
  executeTool,
  getComponentDetails,
  getComponentImage,
  cacheTtlMs = 5_000
}: {
  executeTool: ExecuteTool;
  getComponentDetails?: (input: {
    nodeId?: string;
    componentKey?: string;
    componentName?: string;
  }) => Promise<any>;
  getComponentImage?: (input: {
    nodeId?: string;
    componentKey?: string;
    componentName?: string;
  }) => Promise<any>;
  cacheTtlMs?: number;
}) {
  const cache = new Map<string, CacheEntry>();

  function getCachedInventory(toolName: string, options: { refresh?: boolean } = {}) {
    const now = Date.now();
    const existing = cache.get(toolName);
    if (!options.refresh && existing && existing.expiresAt > now) {
      return existing.value;
    }

    const value = executeTool(toolName, {});
    cache.set(toolName, {
      value,
      expiresAt: now + cacheTtlMs
    });

    return value;
  }

  async function getBaseInventory(options: { refresh?: boolean } = {}) {
    const [context, styles, variables, components] = await Promise.all([
      getCachedInventory("figma_get_file_context", options),
      getCachedInventory("figma_get_styles", options),
      getCachedInventory("figma_get_variables", options),
      getCachedInventory("figma_get_components", options)
    ]);

    return { context, styles, variables, components };
  }

  function buildComponentCacheKey(prefix: string, component: {
    id?: string | null;
    key?: string | null;
    name?: string | null;
  }) {
    return [
      prefix,
      component.id || "",
      component.key || "",
      component.name || ""
    ].join(":");
  }

  function getCachedComponentValue(cacheKey: string, factory: () => Promise<any>) {
    const now = Date.now();
    const existing = cache.get(cacheKey);
    if (existing && existing.expiresAt > now) {
      return existing.value;
    }

    const value = factory();
    cache.set(cacheKey, {
      value,
      expiresAt: now + cacheTtlMs
    });

    return value;
  }

  return {
    async getSummary(options: { refresh?: boolean } = {}) {
      const { context, styles, variables, components } = await getBaseInventory(options);

      const collections = Array.isArray(variables?.collections) ? variables.collections : [];
      const allVariables = collections.flatMap((collection: any) => collection.variables || []);
      const textStyles = Array.isArray(styles?.textStyles) ? styles.textStyles : [];
      const paintStyles = Array.isArray(styles?.paintStyles) ? styles.paintStyles : [];
      const effectStyles = Array.isArray(styles?.effectStyles) ? styles.effectStyles : [];
      const gridStyles = Array.isArray(styles?.gridStyles) ? styles.gridStyles : [];
      const componentList = Array.isArray(components?.components) ? components.components : [];

      return {
        runtimeSessionId: context?.runtimeSessionId || null,
        fileName: context?.fileName || "Unknown",
        pageName: context?.pageName || "Unknown",
        collections: normalizeNames(collections, (item) => item?.name || null),
        counts: {
          variableCollections: collections.length,
          variables: allVariables.length,
          textStyles: textStyles.length,
          paintStyles: paintStyles.length,
          effectStyles: effectStyles.length,
          gridStyles: gridStyles.length,
          components: componentList.length
        },
        sample: {
          variables: normalizeNames(allVariables, (item) => item?.name || null).slice(0, 10),
          styles: normalizeNames(
            [...textStyles, ...paintStyles, ...effectStyles, ...gridStyles],
            (item) => item?.name || null
          ).slice(0, 10),
          components: normalizeNames(componentList, (item) => item?.name || null).slice(0, 10)
        }
      };
    },

    async getTokenValues(options: {
      filter?: string;
      type?: string;
      limit?: number;
    }) {
      const variables = await getCachedInventory("figma_get_variables");
      const collections = Array.isArray(variables?.collections) ? variables.collections : [];
      const filter = options.filter ? String(options.filter).toLowerCase() : null;
      const type = options.type ? String(options.type).toUpperCase() : null;
      const limit = typeof options.limit === "number" ? options.limit : 50;

      const matches = collections.flatMap((collection: any) =>
        (collection.variables || [])
          .filter((variable: any) => {
            if (type && String(variable?.type || "").toUpperCase() !== type) {
              return false;
            }
            if (!filter) {
              return true;
            }
            return String(variable?.name || "").toLowerCase().includes(filter);
          })
          .map((variable: any) => ({
            id: variable.id,
            name: variable.name,
            type: variable.type,
            collection: collection.name,
            valuesByMode: variable.valuesByMode || {}
          }))
      );

      return {
        count: matches.length,
        tokens: matches
          .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
          .slice(0, limit)
      };
    },

    async browseTokens(options: {
      filter?: string;
      type?: string;
      collection?: string;
      limitPerCollection?: number;
      refresh?: boolean;
      preset?: "alphabetical" | "largest-groups" | "smallest-groups";
      sortBy?: "name" | "count";
      order?: "asc" | "desc";
    }) {
      const preset = resolveBrowsePreset(options);
      const variables = await getCachedInventory("figma_get_variables", { refresh: options.refresh });
      const collections = Array.isArray(variables?.collections) ? variables.collections : [];
      const filter = options.filter ? String(options.filter).toLowerCase() : null;
      const type = options.type ? String(options.type).toUpperCase() : null;
      const collectionFilter = options.collection ? String(options.collection).toLowerCase() : null;
      const limitPerCollection = typeof options.limitPerCollection === "number" ? options.limitPerCollection : 25;

      const filteredCollections = sortNamedItems(
        collections
        .filter((collection: any) => {
          if (!collectionFilter) {
            return true;
          }
          return String(collection?.name || "").toLowerCase().includes(collectionFilter);
        })
        .map((collection: any) => {
          const variablesInCollection = (collection.variables || []).filter((variable: any) => {
            if (type && String(variable?.type || "").toUpperCase() !== type) {
              return false;
            }
            if (!filter) {
              return true;
            }
            return String(variable?.name || "").toLowerCase().includes(filter);
          });

          return {
            id: collection.id || null,
            name: collection.name || "Unnamed",
            variableCount: variablesInCollection.length,
            groups: buildNameGroups(variablesInCollection, (item) => item?.name || null, limitPerCollection),
            tokens: sortNamedItems(variablesInCollection, "name", preset.order)
              .slice(0, limitPerCollection)
              .map((variable: any) => ({
                id: variable.id || null,
                name: variable.name || "Unnamed",
                type: variable.type || null,
                valuesByMode: variable.valuesByMode || {}
              }))
          };
        }),
        preset.sortBy,
        preset.order
      );

      return {
        count: filteredCollections.reduce((sum: number, item: any) => sum + item.variableCount, 0),
        collections: filteredCollections
      };
    },

    async browseDesignSystem(options: {
      filter?: string;
      componentLimit?: number;
      styleLimit?: number;
      refresh?: boolean;
      preset?: "alphabetical" | "largest-groups" | "smallest-groups";
      sortBy?: "name" | "count";
      order?: "asc" | "desc";
    }) {
      const preset = resolveBrowsePreset(options);
      const [styles, components] = await Promise.all([
        getCachedInventory("figma_get_styles", { refresh: options.refresh }),
        getCachedInventory("figma_get_components", { refresh: options.refresh })
      ]);

      const filter = options.filter ? String(options.filter).toLowerCase() : null;
      const componentLimit = typeof options.componentLimit === "number" ? options.componentLimit : 50;
      const styleLimit = typeof options.styleLimit === "number" ? options.styleLimit : 50;
      const styleItems = [
        ...(Array.isArray(styles?.textStyles) ? styles.textStyles.map((item: any) => ({ ...item, styleType: "TEXT" })) : []),
        ...(Array.isArray(styles?.paintStyles) ? styles.paintStyles.map((item: any) => ({ ...item, styleType: "PAINT" })) : []),
        ...(Array.isArray(styles?.effectStyles) ? styles.effectStyles.map((item: any) => ({ ...item, styleType: "EFFECT" })) : []),
        ...(Array.isArray(styles?.gridStyles) ? styles.gridStyles.map((item: any) => ({ ...item, styleType: "GRID" })) : [])
      ].filter((item: any) => {
        if (!filter) {
          return true;
        }
        return String(item?.name || "").toLowerCase().includes(filter);
      });

      const componentItems = (Array.isArray(components?.components) ? components.components : []).filter((item: any) => {
        if (!filter) {
          return true;
        }
        return String(item?.name || "").toLowerCase().includes(filter);
      });

      return {
        counts: {
          styles: styleItems.length,
          components: componentItems.length
        },
        styleGroups: sortNamedItems(
          buildNameGroups(styleItems, (item) => item?.name || null, styleLimit),
          preset.sortBy,
          preset.order
        ),
        componentGroups: sortNamedItems(
          buildNameGroups(componentItems, (item) => item?.name || null, componentLimit),
          preset.sortBy,
          preset.order
        ),
        styles: sortNamedItems(styleItems, "name", preset.order)
          .slice(0, styleLimit)
          .map((item: any) => ({
            id: item.id || null,
            name: item.name || "Unnamed",
            styleType: item.styleType
          })),
        components: sortNamedItems(componentItems, "name", preset.order)
          .slice(0, componentLimit)
          .map((item: any) => buildComponentIdentifier(item))
      };
    },

    async getKit(options: {
      includeImage?: boolean;
      componentNames?: string[];
      componentLimit?: number;
    }) {
      const { context, styles, variables, components } = await getBaseInventory();

      const collections = Array.isArray(variables?.collections) ? variables.collections : [];
      const allVariables = collections.flatMap((collection: any) => collection.variables || []);
      const textStyles = Array.isArray(styles?.textStyles) ? styles.textStyles : [];
      const paintStyles = Array.isArray(styles?.paintStyles) ? styles.paintStyles : [];
      const effectStyles = Array.isArray(styles?.effectStyles) ? styles.effectStyles : [];
      const gridStyles = Array.isArray(styles?.gridStyles) ? styles.gridStyles : [];
      const componentList = Array.isArray(components?.components) ? components.components : [];
      const filterNames = Array.isArray(options.componentNames)
        ? options.componentNames.map((item) => item.toLowerCase())
        : [];
      const filteredComponents = componentList.filter((component: any) => {
        if (!filterNames.length) {
          return true;
        }

        const name = String(component?.name || "").toLowerCase();
        return filterNames.some((filterName) => name.includes(filterName));
      });
      const limitedComponents = filteredComponents.slice(
        0,
        typeof options.componentLimit === "number" ? options.componentLimit : 25
      );

      const componentEntries = await Promise.all(
        limitedComponents.map(async (component: any) => {
          let detailPayload: any = null;
          const componentRef = {
            id: component?.id || null,
            key: component?.key || null,
            name: component?.name || null
          };

          if (getComponentDetails) {
            try {
              detailPayload = await getCachedComponentValue(
                buildComponentCacheKey("component-detail", componentRef),
                () =>
                  getComponentDetails({
                    nodeId: component?.id || undefined,
                    componentKey: component?.key || undefined,
                    componentName: component?.name || undefined
                  })
              );
            } catch (_error) {
              detailPayload = null;
            }
          } else {
            detailPayload = await getCachedComponentValue(
              buildComponentCacheKey("component-detail", componentRef),
              () =>
                executeTool("figma_get_component_details", {
                  nodeId: component?.id || undefined,
                  componentKey: component?.key || undefined,
                  componentName: component?.name || undefined
                })
            );
          }

          if (!detailPayload) {
            detailPayload = null;
          }

          const base = buildComponentIdentifier({
            ...component,
            id: detailPayload?.component?.id || detailPayload?.id || component?.id || null,
            key: detailPayload?.component?.key || detailPayload?.key || component?.key || null,
            setName: detailPayload?.component?.setName || detailPayload?.setName || component?.setName || null,
            nodeType: detailPayload?.component?.nodeType || detailPayload?.nodeType || component?.nodeType || null,
            width: detailPayload?.component?.width ?? detailPayload?.width ?? component?.width ?? null,
            height: detailPayload?.component?.height ?? detailPayload?.height ?? component?.height ?? null,
            propertyNames:
              detailPayload?.component?.propertyNames ||
              detailPayload?.propertyNames ||
              component?.propertyNames ||
              []
          });

          if (!options.includeImage) {
            return base;
          }

          try {
            const image = getComponentImage
              ? await getCachedComponentValue(
                  buildComponentCacheKey("component-image", base),
                  () =>
                    getComponentImage({
                      nodeId: base.id || undefined,
                      componentKey: base.key || undefined,
                      componentName: base.name || undefined
                    })
                )
              : await getCachedComponentValue(
                  buildComponentCacheKey("component-image", base),
                  () =>
                    executeTool("figma_get_component_image", {
                      nodeId: base.id || undefined,
                      componentKey: base.key || undefined,
                      componentName: base.name || undefined
                    })
                );

            return {
              ...base,
              image: {
                hasImage: Boolean(image?.image?.dataUrl || image?.image?.imageRef || image?.dataUrl || image?.imageRef),
                imageRef: image?.image?.imageRef || image?.imageRef || null,
                dataUrl: image?.image?.dataUrl || image?.dataUrl || null
              }
            };
          } catch (error) {
            return {
              ...base,
              image: {
                hasImage: false,
                error: error instanceof Error ? error.message : String(error)
              }
            };
          }
        })
      );

      return {
        runtimeSessionId: context?.runtimeSessionId || null,
        fileKey: context?.fileKey || null,
        fileName: context?.fileName || "Unknown",
        pageName: context?.pageName || "Unknown",
        counts: {
          variableCollections: collections.length,
          variables: allVariables.length,
          textStyles: textStyles.length,
          paintStyles: paintStyles.length,
          effectStyles: effectStyles.length,
          gridStyles: gridStyles.length,
          components: componentList.length,
          returnedComponents: componentEntries.length
        },
        styles: {
          text: textStyles,
          paint: paintStyles,
          effect: effectStyles,
          grid: gridStyles
        },
        variables: {
          collections
        },
        components: componentEntries
      };
    }
  };
}
