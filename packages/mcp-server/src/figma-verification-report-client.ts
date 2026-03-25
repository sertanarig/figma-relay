type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;
type CacheEntry = {
  value: Promise<any>;
  expiresAt: number;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildSeverityBreakdown(findings: Array<{ severity?: string }>) {
  return findings.reduce(
    (totals, finding) => {
      const severity = finding?.severity === "warning" ? "warning" : "info";
      totals[severity] += 1;
      return totals;
    },
    { warning: 0, info: 0 }
  );
}

function inferReadinessStatus(score: number, warningCount: number) {
  if (warningCount >= 3 || score < 60) {
    return "needs-attention";
  }

  if (warningCount > 0 || score < 85) {
    return "watch";
  }

  return "ready";
}

export function createFigmaVerificationReportClient({
  executeTool,
  cacheTtlMs = 5_000
}: {
  executeTool: ExecuteTool;
  cacheTtlMs?: number;
}) {
  const cache = new Map<string, CacheEntry>();

  function getCachedValue(cacheKey: string, factory: () => Promise<any>) {
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
    async generate(options: {
      nodeId?: string;
      includeChildren?: boolean;
      includeScreenshot?: boolean;
    }) {
      const selection = options.nodeId ? null : await executeTool("figma_get_selection", {});
      const selectedNode = Array.isArray(selection?.selection) ? selection.selection[0] : null;
      const nodeId = options.nodeId || selectedNode?.id;

      if (!nodeId) {
        throw new Error("NODE_ID_REQUIRED");
      }

      const cacheKey = JSON.stringify({
        nodeId,
        includeChildren: Boolean(options.includeChildren),
        includeScreenshot: options.includeScreenshot !== false
      });
      const cachedReport = cache.get(cacheKey);
      const now = Date.now();
      if (cachedReport && cachedReport.expiresAt > now) {
        return cachedReport.value;
      }

      const reportValue = (async () => {
        const [node, bindings, screenshot, children] = await Promise.all([
          getCachedValue(`verification-node:${nodeId}`, () => executeTool("figma_get_node", { nodeId })),
          getCachedValue(`verification-bindings:${nodeId}`, () =>
            executeTool("figma_get_bound_variables", { nodeId }).catch(() => null)
          ),
          options.includeScreenshot === false
            ? Promise.resolve(null)
            : getCachedValue(`verification-screenshot:${nodeId}`, () =>
                executeTool("figma_take_screenshot", { nodeId }).catch(() => null)
              ),
          options.includeChildren
            ? getCachedValue(`verification-children:${nodeId}`, () =>
                executeTool("figma_get_children", { nodeId }).catch(() => null)
              )
            : Promise.resolve(null)
        ]);

        const snapshot = node?.node || null;
        const childList = Array.isArray(children?.children)
          ? children.children
          : Array.isArray(children?.nodes)
            ? children.nodes
            : [];
        const bindingMap = bindings?.bindings || {};
        const bindingKeys = Object.keys(bindingMap);
        const findings = [];
        const recommendations = [];

        if (snapshot?.visible === false) {
          findings.push({
            category: "visibility",
            severity: "warning",
            message: "Node is hidden."
          });
          recommendations.push("Reveal the node before validation or handoff.");
        }

        if (snapshot?.locked === true) {
          findings.push({
            category: "locking",
            severity: "info",
            message: "Node is locked."
          });
          recommendations.push("Unlock the node if edits or automated adjustments are expected.");
        }

        if ((snapshot?.type === "FRAME" || snapshot?.type === "COMPONENT" || snapshot?.type === "COMPONENT_SET")
          && options.includeChildren
          && childList.length === 0) {
          findings.push({
            category: "structure",
            severity: "info",
            message: "Container has no children."
          });
          recommendations.push("Verify whether the container should hold documented child content.");
        }

        if (snapshot?.layout?.layoutMode && bindingKeys.length === 0) {
          findings.push({
            category: "bindings",
            severity: "warning",
            message: "Layout-capable node has no variable bindings."
          });
          recommendations.push("Bind responsive or spacing variables to layout fields for consistency.");
        }

        if (!screenshot && options.includeScreenshot !== false) {
          findings.push({
            category: "screenshot",
            severity: "warning",
            message: "Screenshot could not be captured."
          });
          recommendations.push("Retry screenshot capture after ensuring the node is visible and within the page.");
        }

        const score = clampScore(
          100 -
          findings.reduce((total, finding) => total + (finding.severity === "warning" ? 20 : 8), 0)
        );
        const severityBreakdown = buildSeverityBreakdown(findings);
        const readinessStatus = inferReadinessStatus(score, severityBreakdown.warning);

        return {
          runtimeSessionId: node?.runtimeSessionId || selection?.runtimeSessionId || null,
          summary: {
            score,
            findings: findings.length,
            bindingCount: bindingKeys.length,
            childCount: childList.length,
            recommendations: recommendations.length,
            severityBreakdown,
            readinessStatus
          },
          node: snapshot
            ? {
                id: snapshot.id || null,
                name: snapshot.name || "Unnamed",
                type: snapshot.type || null,
                visible: snapshot.visible ?? null,
                locked: snapshot.locked ?? null,
                x: snapshot.x ?? null,
                y: snapshot.y ?? null,
                width: snapshot.width ?? null,
                height: snapshot.height ?? null,
                layout: snapshot.layout || null
              }
            : null,
          bindings: bindingMap,
          children: options.includeChildren
            ? {
                count: childList.length,
                sample: childList.slice(0, 10).map((item: any) => ({
                  id: item.id || null,
                  name: item.name || "Unnamed",
                  type: item.type || null
                }))
              }
            : null,
          findings,
          recommendations,
          screenshot: screenshot
            ? {
                format: screenshot.format || "png",
                imageRef: screenshot.imageRef || null,
                dataUrl: screenshot.dataUrl || null,
                bytesLength: screenshot.bytesLength ?? null
              }
            : null
        };
      })();

      cache.set(cacheKey, {
        value: reportValue,
        expiresAt: now + cacheTtlMs
      });

      return reportValue;
    }
  };
}
