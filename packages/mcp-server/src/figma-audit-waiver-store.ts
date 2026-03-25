import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type AuditWaiver = {
  id: string;
  fileKey?: string | null;
  profile?: "default" | "release" | "all";
  category: string;
  messagePattern: string;
  createdAt: string;
  note?: string;
};

const DEFAULT_STORE_PATH = resolve(process.cwd(), ".figma-runtime-mcp", "audit-waivers.json");

async function readStore(filePath: string) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.waivers) ? parsed.waivers : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeStore(filePath: string, waivers: AuditWaiver[]) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({ waivers }, null, 2));
}

export function createFigmaAuditWaiverStore(options: {
  filePath?: string;
} = {}) {
  const filePath = options.filePath || DEFAULT_STORE_PATH;

  return {
    async list() {
      return readStore(filePath);
    },

    async upsert(input: {
      id?: string;
      fileKey?: string | null;
      profile?: "default" | "release" | "all";
      category: string;
      messagePattern: string;
      note?: string;
    }) {
      const waivers = await readStore(filePath);
      const id = input.id || `waiver-${Date.now()}`;
      const next: AuditWaiver = {
        id,
        fileKey: input.fileKey || null,
        profile: input.profile || "all",
        category: input.category,
        messagePattern: input.messagePattern,
        createdAt: new Date().toISOString(),
        note: input.note
      };

      const index = waivers.findIndex((item: AuditWaiver) => item.id === id);
      if (index >= 0) {
        waivers[index] = {
          ...waivers[index],
          ...next,
          createdAt: waivers[index].createdAt || next.createdAt
        };
      } else {
        waivers.push(next);
      }

      await writeStore(filePath, waivers);
      return next;
    },

    async remove(id: string) {
      const waivers = await readStore(filePath);
      const next = waivers.filter((item: AuditWaiver) => item.id !== id);
      await writeStore(filePath, next);
      return {
        deleted: next.length !== waivers.length
      };
    },

    async reset() {
      await rm(filePath, { force: true });
    }
  };
}
