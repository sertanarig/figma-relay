import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type GetReadiness = () => Promise<any>;

type Snapshot = {
  capturedAt: string;
  fileName: string;
  pageName: string;
  status: string;
  auditScore: number | null;
  warningIssues: number;
  blockingIssues: number;
};

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function resolveHistoryPath(cwd: string) {
  return path.join(cwd, ".figma-runtime-mcp", "release-readiness-history.json");
}

async function readHistory(historyPath: string) {
  try {
    const raw = await readFile(historyPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as Snapshot[] : [];
  } catch {
    return [];
  }
}

async function writeHistory(historyPath: string, snapshots: Snapshot[]) {
  await mkdir(path.dirname(historyPath), { recursive: true });
  await writeFile(historyPath, `${JSON.stringify(snapshots, null, 2)}\n`, "utf8");
}

function statusRank(status: string) {
  if (status === "ready") return 2;
  if (status === "watch") return 1;
  return 0;
}

function buildTrend(current: Snapshot, previous: Snapshot | null) {
  if (!previous) {
    return {
      direction: "new",
      summary: "First readiness snapshot recorded."
    };
  }

  const currentRank = statusRank(current.status);
  const previousRank = statusRank(previous.status);
  const scoreDelta =
    typeof current.auditScore === "number" && typeof previous.auditScore === "number"
      ? current.auditScore - previous.auditScore
      : null;

  if (currentRank > previousRank || (currentRank === previousRank && typeof scoreDelta === "number" && scoreDelta > 0)) {
    return {
      direction: "improving",
      summary: `Readiness improved from ${previous.status} to ${current.status}.`
    };
  }

  if (currentRank < previousRank || (currentRank === previousRank && typeof scoreDelta === "number" && scoreDelta < 0)) {
    return {
      direction: "regressing",
      summary: `Readiness regressed from ${previous.status} to ${current.status}.`
    };
  }

  return {
    direction: "steady",
    summary: `Readiness stayed at ${current.status}.`
  };
}

export function createFigmaReleaseReadinessTrendClient({
  getReadiness,
  cwd = process.cwd()
}: {
  getReadiness: GetReadiness;
  cwd?: string;
}) {
  return {
    async getTrend(options: { limit?: number; record?: boolean } = {}) {
      const limit = typeof options.limit === "number" ? options.limit : 10;
      const record = options.record !== false;
      const readiness = await getReadiness();
      const historyPath = resolveHistoryPath(cwd);
      const existing = await readHistory(historyPath);

      const current: Snapshot = {
        capturedAt: new Date().toISOString(),
        fileName: String(readiness?.file?.fileName || "Unknown"),
        pageName: String(readiness?.file?.pageName || "Unknown"),
        status: String(readiness?.status || "unknown"),
        auditScore: toNumber(readiness?.summary?.auditScore),
        warningIssues: typeof readiness?.summary?.warningIssues === "number" ? readiness.summary.warningIssues : 0,
        blockingIssues: typeof readiness?.summary?.blockingIssues === "number" ? readiness.summary.blockingIssues : 0
      };

      const previous = existing.length > 0 ? existing[existing.length - 1] : null;
      const trend = buildTrend(current, previous);
      const updated = record ? [...existing, current].slice(-50) : existing.slice(-50);

      if (record) {
        await writeHistory(historyPath, updated);
      }

      return {
        file: {
          fileName: current.fileName,
          pageName: current.pageName
        },
        current,
        previous,
        trend,
        history: updated.slice(-limit)
      };
    }
  };
}
