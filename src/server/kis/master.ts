import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { unzipSync } from "fflate";
import iconv from "iconv-lite";
import type { KisStock } from "@/server/kis/types";

const GLOBAL_KEY = "__MYCHART_KIS_DOMESTIC_MASTER__";

type Market = "KOSPI" | "KOSDAQ";

type CacheFileShape = {
  version: 1;
  fetchedAt: number; // epoch ms
  stocks: KisStock[];
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getCacheFilePath() {
  return path.join(process.cwd(), ".cache", "kis-domestic-master.json");
}

export async function loadDomesticStockMaster(): Promise<KisStock[]> {
  const g = (globalThis as Record<string, unknown>)[GLOBAL_KEY];
  if (Array.isArray(g)) return g as KisStock[];

  const cached = await readCacheFile();
  if (cached) {
    (globalThis as Record<string, unknown>)[GLOBAL_KEY] = cached;
    return cached;
  }

  const [kospi, kosdaq] = await Promise.all([
    downloadAndParseMarket("KOSPI"),
    downloadAndParseMarket("KOSDAQ"),
  ]);

  // De-dupe by code (prefer KOSPI if conflicts, unlikely).
  const map = new Map<string, KisStock>();
  for (const s of [...kospi, ...kosdaq]) {
    if (!map.has(s.code)) map.set(s.code, s);
  }

  const stocks = Array.from(map.values());

  await writeCacheFile(stocks);
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = stocks;
  return stocks;
}

export async function searchDomesticStocks(query: string, limit = 20): Promise<KisStock[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const stocks = await loadDomesticStockMaster();

  // score: prefix match > includes
  const scored = stocks
    .map((s) => {
      const code = s.code;
      const name = s.name;
      const codeScore = code.startsWith(q) ? 0 : code.includes(q) ? 1 : 9;
      const nameScore = name.toLowerCase().startsWith(q)
        ? 0
        : name.toLowerCase().includes(q)
          ? 2
          : 9;
      const score = Math.min(codeScore, nameScore);
      return { s, score };
    })
    .filter((x) => x.score < 9)
    .sort((a, b) => a.score - b.score || a.s.code.localeCompare(b.s.code));

  return scored.slice(0, limit).map((x) => x.s);
}

async function readCacheFile(): Promise<KisStock[] | null> {
  try {
    const raw = await fs.readFile(getCacheFilePath(), "utf8");
    const parsed = JSON.parse(raw) as CacheFileShape;
    if (parsed?.version !== 1) return null;
    if (!Array.isArray(parsed.stocks)) return null;
    if (typeof parsed.fetchedAt !== "number") return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.stocks as KisStock[];
  } catch {
    return null;
  }
}

async function writeCacheFile(stocks: KisStock[]): Promise<void> {
  try {
    const filePath = getCacheFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const payload: CacheFileShape = { version: 1, fetchedAt: Date.now(), stocks };
    await fs.writeFile(filePath, JSON.stringify(payload), "utf8");
  } catch {
    // ignore (serverless/read-only)
  }
}

async function downloadAndParseMarket(market: Market): Promise<KisStock[]> {
  const url =
    market === "KOSPI"
      ? "https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip"
      : "https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip";

  const tailLen = market === "KOSPI" ? 228 : 222;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok)
    throw new Error(`Failed to download master (${market}): ${res.status} ${res.statusText}`);

  const zipBytes = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(zipBytes);

  const mstName = market === "KOSPI" ? "kospi_code.mst" : "kosdaq_code.mst";
  const mst = files[mstName];
  if (!mst) {
    // fallback: first .mst file
    const first = Object.entries(files).find(([name]) => name.toLowerCase().endsWith(".mst"));
    if (!first) throw new Error(`Master zip (${market}) did not contain .mst`);
    return parseMst(first[1], market, tailLen);
  }

  return parseMst(mst, market, tailLen);
}

function parseMst(mstBytes: Uint8Array, market: Market, tailLen: number): KisStock[] {
  const text = iconv.decode(Buffer.from(mstBytes), "cp949");
  const lines = text.split(/\r?\n/);

  const out: KisStock[] = [];

  for (const row of lines) {
    if (!row) continue;
    if (row.length <= tailLen + 21) continue;

    const head = row.slice(0, row.length - tailLen);
    const code = head.slice(0, 9).trim();
    const name = head.slice(21).trim();
    if (!code || !name) continue;

    // Filter out non-stock lines (just in case)
    if (!/^\d{6}$/.test(code)) continue;

    out.push({ code, name, market });
  }

  return out;
}
