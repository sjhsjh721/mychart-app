import type { CandlestickData, LineData } from "lightweight-charts";

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(candles: CandlestickData[], period: number): LineData[] {
  if (!Number.isFinite(period) || period <= 0) return [];
  if (!candles?.length) return [];

  const p = Math.floor(period);
  if (p <= 0) return [];

  const out: LineData[] = [];
  let sum = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    sum += c.close;

    if (i >= p) {
      sum -= candles[i - p].close;
    }

    if (i >= p - 1) {
      out.push({
        time: c.time,
        value: sum / p,
      });
    }
  }

  return out;
}

/**
 * RSI (Relative Strength Index)
 * - period: 일반적으로 14
 */
export function calculateRSI(candles: CandlestickData[], period: number = 14): LineData[] {
  if (!candles?.length || candles.length < period + 1) return [];

  const out: LineData[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // 가격 변화 계산
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // 첫 번째 평균 계산
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // RSI 계산
  for (let i = period; i < candles.length; i++) {
    if (i > period) {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    out.push({
      time: candles[i].time,
      value: rsi,
    });
  }

  return out;
}

/**
 * Bollinger Bands
 * - period: 일반적으로 20
 * - stdDev: 표준편차 배수, 일반적으로 2
 */
export interface BollingerBands {
  upper: LineData[];
  middle: LineData[];
  lower: LineData[];
}

export function calculateBollingerBands(
  candles: CandlestickData[],
  period: number = 20,
  stdDev: number = 2,
): BollingerBands {
  if (!candles?.length || candles.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const upper: LineData[] = [];
  const middle: LineData[] = [];
  const lower: LineData[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const closes = slice.map((c) => c.close);

    // SMA (중심선)
    const sma = closes.reduce((a, b) => a + b, 0) / period;

    // 표준편차
    const variance = closes.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const std = Math.sqrt(variance);

    const time = candles[i].time;

    upper.push({ time, value: sma + stdDev * std });
    middle.push({ time, value: sma });
    lower.push({ time, value: sma - stdDev * std });
  }

  return { upper, middle, lower };
}

/**
 * Ichimoku Cloud (일목균형표)
 * - tenkanPeriod: 전환선 (9)
 * - kijunPeriod: 기준선 (26)
 * - senkouBPeriod: 선행스팬B (52)
 * - displacement: 선행/후행 이동 (26)
 */
export interface IchimokuCloud {
  tenkanSen: LineData[]; // 전환선
  kijunSen: LineData[]; // 기준선
  senkouSpanA: LineData[]; // 선행스팬A
  senkouSpanB: LineData[]; // 선행스팬B
  chikouSpan: LineData[]; // 후행스팬
}

function highLowAvg(candles: CandlestickData[], start: number, end: number): number {
  let high = -Infinity;
  let low = Infinity;
  for (let i = start; i <= end; i++) {
    if (candles[i].high > high) high = candles[i].high;
    if (candles[i].low < low) low = candles[i].low;
  }
  return (high + low) / 2;
}

export function calculateIchimoku(
  candles: CandlestickData[],
  tenkanPeriod: number = 9,
  kijunPeriod: number = 26,
  senkouBPeriod: number = 52,
  displacement: number = 26,
): IchimokuCloud {
  if (!candles?.length || candles.length < senkouBPeriod) {
    return { tenkanSen: [], kijunSen: [], senkouSpanA: [], senkouSpanB: [], chikouSpan: [] };
  }

  const tenkanSen: LineData[] = [];
  const kijunSen: LineData[] = [];
  const senkouSpanA: LineData[] = [];
  const senkouSpanB: LineData[] = [];
  const chikouSpan: LineData[] = [];

  for (let i = 0; i < candles.length; i++) {
    const time = candles[i].time;

    // 전환선 (Tenkan-sen): 9일 고가+저가 / 2
    if (i >= tenkanPeriod - 1) {
      const tenkan = highLowAvg(candles, i - tenkanPeriod + 1, i);
      tenkanSen.push({ time, value: tenkan });
    }

    // 기준선 (Kijun-sen): 26일 고가+저가 / 2
    if (i >= kijunPeriod - 1) {
      const kijun = highLowAvg(candles, i - kijunPeriod + 1, i);
      kijunSen.push({ time, value: kijun });
    }

    // 선행스팬A: (전환선 + 기준선) / 2, 26일 앞으로 이동
    if (i >= kijunPeriod - 1 && i + displacement < candles.length) {
      const tenkan = highLowAvg(candles, i - tenkanPeriod + 1, i);
      const kijun = highLowAvg(candles, i - kijunPeriod + 1, i);
      senkouSpanA.push({
        time: candles[i + displacement].time,
        value: (tenkan + kijun) / 2,
      });
    }

    // 선행스팬B: 52일 고가+저가 / 2, 26일 앞으로 이동
    if (i >= senkouBPeriod - 1 && i + displacement < candles.length) {
      const senkouB = highLowAvg(candles, i - senkouBPeriod + 1, i);
      senkouSpanB.push({
        time: candles[i + displacement].time,
        value: senkouB,
      });
    }

    // 후행스팬 (Chikou Span): 현재 종가를 26일 뒤로 이동
    if (i >= displacement) {
      chikouSpan.push({
        time: candles[i - displacement].time,
        value: candles[i].close,
      });
    }
  }

  return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan };
}
