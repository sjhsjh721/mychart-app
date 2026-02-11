import "server-only";

import { getKisConfig } from "@/server/kis/config";
import { kisRequest } from "@/server/kis/http";
import type { Timeframe } from "@/lib/timeframe";
import type { KisCandle, KisQuote, KisStock } from "@/server/kis/types";
import { mockQuote, mockSearchStocks } from "@/server/kis/mock";
import { searchDomesticStocks } from "@/server/kis/master";
import { getYahooCandles } from "@/server/yahoo/candles";

export async function searchStocks(query: string): Promise<KisStock[]> {
  const cfg = getKisConfig();

  // In mock/disabled mode (no KIS keys), DO NOT hit external master-download endpoints.
  if (!cfg.enabled) return mockSearchStocks(query);

  // If enabled, try a richer domestic-master-based search. Fallback to a small mock list on any failure.
  try {
    return await searchDomesticStocks(query, 20);
  } catch {
    return mockSearchStocks(query);
  }
}

export async function getCandles(params: {
  code: string;
  timeframe: Timeframe;
  count?: number;
}): Promise<KisCandle[]> {
  const cfg = getKisConfig();
  const count = params.count ?? 240;

  // Prefer Yahoo Finance for:
  // - overseas symbols (AAPL, TSLA, etc)
  // - domestic symbols when KIS is not configured/enabled
  // - domestic symbols with suffixes (e.g. 005930.KS)
  const isPlainDomesticCode = /^\d{6}$/.test(params.code);

  if (!cfg.enabled || !isPlainDomesticCode) {
    return getYahooCandles({
      code: params.code,
      timeframe: params.timeframe,
      count,
    });
  }

  // KIS (domestic-only)
  if (params.timeframe === "1D" || params.timeframe === "1W" || params.timeframe === "1M") {
    return getDailyLikeCandles(params.code, params.timeframe, count);
  }

  // intraday
  return getIntradayCandles(params.code, params.timeframe, count);
}

export async function getQuote(code: string): Promise<KisQuote> {
  const cfg = getKisConfig();
  if (!cfg.enabled) return mockQuote(code);

  type Resp = {
    output?: {
      hts_kor_isnm?: string;
      stck_prpr?: string;
      prdy_vrss?: string;
      prdy_ctrt?: string;
    };
  };

  const json = await kisRequest<Resp>({
    path: "/uapi/domestic-stock/v1/quotations/inquire-price",
    trId: "FHKST01010100",
    params: {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: code,
    },
  });

  const out = json.output ?? {};
  const price = Number(out.stck_prpr ?? "NaN");

  return {
    code,
    name: out.hts_kor_isnm,
    price: Number.isFinite(price) ? price : 0,
    change: out.prdy_vrss ? Number(out.prdy_vrss) : undefined,
    changeRate: out.prdy_ctrt ? Number(out.prdy_ctrt) : undefined,
    raw: json,
  };
}

async function getDailyLikeCandles(
  code: string,
  tf: "1D" | "1W" | "1M",
  count: number,
): Promise<KisCandle[]> {
  const period = tf === "1D" ? "D" : tf === "1W" ? "W" : "M";

  const today = kstYmd(new Date());
  const backDays =
    tf === "1D"
      ? Math.ceil(count * 1.7)
      : tf === "1W"
        ? Math.ceil(count * 7 * 1.7)
        : Math.ceil(count * 30 * 1.7);
  const start = kstYmd(addDaysKst(new Date(), -backDays));

  type Resp = {
    output2?: Array<{
      stck_bsop_date?: string; // YYYYMMDD
      stck_oprc?: string;
      stck_hgpr?: string;
      stck_lwpr?: string;
      stck_clpr?: string;
      acml_vol?: string;
    }>;
  };

  const json = await kisRequest<Resp>({
    path: "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
    trId: "FHKST03010100",
    params: {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: code,
      FID_INPUT_DATE_1: start,
      FID_INPUT_DATE_2: today,
      FID_PERIOD_DIV_CODE: period,
      FID_ORG_ADJ_PRC: "0",
    },
  });

  const rows = (json.output2 ?? []).slice().reverse();
  const mapped: KisCandle[] = rows
    .map((r): KisCandle | null => {
      const ymd = r.stck_bsop_date;
      if (!ymd || ymd.length !== 8) return null;
      const t = ymdToUtcTimestamp(ymd);
      return {
        time: t,
        open: Number(r.stck_oprc ?? "NaN"),
        high: Number(r.stck_hgpr ?? "NaN"),
        low: Number(r.stck_lwpr ?? "NaN"),
        close: Number(r.stck_clpr ?? "NaN"),
        volume: r.acml_vol ? Number(r.acml_vol) : undefined,
      };
    })
    .filter(isFiniteCandle);

  // limit to requested count (most recent)
  return mapped.slice(-count);
}

async function getIntradayCandles(
  code: string,
  tf: Timeframe,
  count: number,
): Promise<KisCandle[]> {
  // KIS: 주식당일분봉조회 (1분 단위). Higher TFs are aggregated server-side.
  type Resp = {
    output2?: Array<{
      stck_bsop_date?: string; // YYYYMMDD
      stck_cntg_hour?: string; // HHMMSS
      stck_oprc?: string;
      stck_hgpr?: string;
      stck_lwpr?: string;
      stck_prpr?: string; // close
      cntg_vol?: string;
    }>;
  };

  const json = await kisRequest<Resp>({
    path: "/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice",
    trId: "FHKST03010200",
    params: {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: code,
      FID_INPUT_HOUR_1: "090000",
      FID_ETC_CLS_CODE: "",
      FID_PW_DATA_INCU_YN: "Y",
    },
  });

  const rows = (json.output2 ?? []).slice();
  const minuteCandles: KisCandle[] = rows
    .map((r): KisCandle | null => {
      const ymd = r.stck_bsop_date;
      const hms = r.stck_cntg_hour;
      if (!ymd || ymd.length !== 8 || !hms || hms.length < 4) return null;
      const t = ymdHmsToUtcTimestamp(ymd, hms);
      return {
        time: t,
        open: Number(r.stck_oprc ?? "NaN"),
        high: Number(r.stck_hgpr ?? "NaN"),
        low: Number(r.stck_lwpr ?? "NaN"),
        close: Number(r.stck_prpr ?? "NaN"),
        volume: r.cntg_vol ? Number(r.cntg_vol) : undefined,
      };
    })
    .filter(isFiniteCandle)
    .sort((a, b) => a.time - b.time);

  const aggregated = aggregateByTimeframe(minuteCandles, tf);
  return aggregated.slice(-count);
}

function aggregateByTimeframe(candles: KisCandle[], tf: Timeframe): KisCandle[] {
  const minutes = tf === "1m" ? 1 : tf === "5m" ? 5 : tf === "15m" ? 15 : tf === "1h" ? 60 : 1;
  if (minutes === 1) return candles;

  const bucketSec = minutes * 60;
  const map = new Map<number, KisCandle>();

  for (const c of candles) {
    const bucket = Math.floor(c.time / bucketSec) * bucketSec;
    const prev = map.get(bucket);
    if (!prev) {
      map.set(bucket, { ...c, time: bucket });
      continue;
    }
    prev.high = Math.max(prev.high, c.high);
    prev.low = Math.min(prev.low, c.low);
    prev.close = c.close;
    prev.volume = (prev.volume ?? 0) + (c.volume ?? 0);
  }

  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

function isFiniteCandle(x: KisCandle | null): x is KisCandle {
  if (!x) return false;
  return [x.open, x.high, x.low, x.close].every((n) => Number.isFinite(n));
}

function ymdToUtcTimestamp(ymd: string): number {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  return Math.floor(Date.UTC(y, m - 1, d, 0, 0, 0) / 1000);
}

function ymdHmsToUtcTimestamp(ymd: string, hms: string): number {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));

  const hh = Number(hms.slice(0, 2));
  const mm = Number(hms.slice(2, 4));
  const ss = hms.length >= 6 ? Number(hms.slice(4, 6)) : 0;

  // KIS timestamp is KST; convert to UTC seconds.
  const utcMs = Date.parse(`${y}-${pad2(m)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}:${pad2(ss)}+09:00`);
  return Math.floor(utcMs / 1000);
}

function kstYmd(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const day = kst.getUTCDate();
  return `${y}${pad2(m)}${pad2(day)}`;
}

function addDaysKst(d: Date, days: number): Date {
  // shift in absolute ms. Good enough for KST (no DST).
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
