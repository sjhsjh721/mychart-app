import "server-only";

import type { Timeframe } from "@/lib/timeframe";
import type { KisCandle, KisQuote, KisStock } from "@/server/kis/types";

const TF_TO_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 60 * 5,
  "15m": 60 * 15,
  "1h": 60 * 60,
  "1D": 60 * 60 * 24,
  "1W": 60 * 60 * 24 * 7,
  "1M": 60 * 60 * 24 * 30,
};

const MOCK_STOCKS: KisStock[] = [
  { code: "005930", name: "삼성전자", market: "KOSPI" },
  { code: "000660", name: "SK하이닉스", market: "KOSPI" },
  { code: "035420", name: "NAVER", market: "KOSPI" },
  { code: "035720", name: "카카오", market: "KOSPI" },
  { code: "051910", name: "LG화학", market: "KOSPI" },
  { code: "068270", name: "셀트리온", market: "KOSPI" },
  { code: "005380", name: "현대차", market: "KOSPI" },
  { code: "373220", name: "LG에너지솔루션", market: "KOSPI" },
  { code: "207940", name: "삼성바이오로직스", market: "KOSPI" },
  { code: "251270", name: "넷마블", market: "KOSPI" },
];

export function mockSearchStocks(query: string, limit = 20): KisStock[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return MOCK_STOCKS.filter((s) => {
    return s.code.includes(q) || s.name.toLowerCase().includes(q);
  }).slice(0, limit);
}

export function mockCandles(timeframe: Timeframe, count = 240, seedPrice = 100): KisCandle[] {
  const step = TF_TO_SECONDS[timeframe] ?? TF_TO_SECONDS["1D"];
  const now = Math.floor(Date.now() / 1000);
  const start = now - step * count;

  let price = seedPrice;
  const data: KisCandle[] = [];

  for (let i = 0; i < count; i++) {
    const time = start + step * i;

    const baseVolatility =
      timeframe === "1m" ? 0.8 : timeframe === "5m" ? 1.2 : timeframe === "15m" ? 1.6 : 2.2;
    const drift = (Math.random() - 0.5) * 0.2;
    const move = (Math.random() - 0.5) * baseVolatility + drift;

    const open = price;
    const close = Math.max(1, open + move);

    const high = Math.max(open, close) + Math.random() * (baseVolatility * 0.6);
    const low = Math.min(open, close) - Math.random() * (baseVolatility * 0.6);

    data.push({
      time,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
    });

    price = close;
  }

  return data;
}

export function mockQuote(code: string): KisQuote {
  const base = 70_000;
  const wobble = Math.round((Math.random() - 0.5) * 800);
  const price = base + wobble;
  const change = Math.round((Math.random() - 0.5) * 500);
  const changeRate = Number(((change / (price - change)) * 100).toFixed(2));

  return {
    code,
    price,
    change,
    changeRate,
    time: new Date().toISOString(),
    raw: { mock: true },
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
