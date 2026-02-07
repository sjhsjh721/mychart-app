import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { KisAccessToken } from "@/server/kis/types";

const GLOBAL_KEY = "__MYCHART_KIS_ACCESS_TOKEN__";

function getCacheFilePath() {
  return path.join(process.cwd(), ".cache", "kis-token.json");
}

function isValidTokenShape(t: unknown): t is KisAccessToken {
  if (!t || typeof t !== "object") return false;
  const anyT = t as Record<string, unknown>;
  return (
    typeof anyT.accessToken === "string" &&
    typeof anyT.tokenType === "string" &&
    typeof anyT.expiresAt === "number" &&
    typeof anyT.issuedAt === "number"
  );
}

export async function loadCachedToken(): Promise<KisAccessToken | null> {
  const g = (globalThis as Record<string, unknown>)[GLOBAL_KEY];
  if (isValidTokenShape(g)) return g;

  // Optional: persist to disk for local dev convenience.
  try {
    const raw = await fs.readFile(getCacheFilePath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isValidTokenShape(parsed)) {
      (globalThis as Record<string, unknown>)[GLOBAL_KEY] = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function saveCachedToken(token: KisAccessToken): Promise<void> {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = token;

  try {
    const filePath = getCacheFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(token, null, 2), "utf8");
  } catch {
    // ignore (serverless / read-only env)
  }
}

export async function clearCachedToken(): Promise<void> {
  delete (globalThis as Record<string, unknown>)[GLOBAL_KEY];
  try {
    await fs.unlink(getCacheFilePath());
  } catch {
    // ignore
  }
}
