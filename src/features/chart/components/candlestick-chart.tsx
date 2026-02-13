"use client";

import {
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  type CandlestickData,
  type HistogramData,
  type ISeriesApi,
  type MouseEventParams,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateSMA,
  calculateRSI,
  calculateBollingerBands,
  // calculateIchimoku, // TODO: 일목균형표 토글 UI 추가 시 사용
} from "@/features/chart/lib/indicators";

const MA_COLORS: Record<5 | 20 | 60 | 120, string> = {
  5: "#f59e0b", // amber
  20: "#22c55e", // green
  60: "#3b82f6", // blue
  120: "#a855f7", // purple
};

export function CandlestickChart({
  candles,
  volume,
}: {
  candles: CandlestickData[];
  volume?: HistogramData[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma60SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma120SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  // 볼린저 밴드
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  // RSI
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [hoverText, setHoverText] = useState<string>("");

  const lastClose = useMemo(() => {
    const last = candles[candles.length - 1];
    return last ? last.close : undefined;
  }, [candles]);

  const ma5 = useMemo(() => calculateSMA(candles, 5), [candles]);
  const ma20 = useMemo(() => calculateSMA(candles, 20), [candles]);
  const ma60 = useMemo(() => calculateSMA(candles, 60), [candles]);
  const ma120 = useMemo(() => calculateSMA(candles, 120), [candles]);
  const bollingerBands = useMemo(() => calculateBollingerBands(candles, 20, 2), [candles]);
  const rsi = useMemo(() => calculateRSI(candles, 14), [candles]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.28,
        },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        locale: "ko-KR",
        // KST (UTC+9) 타임존으로 시간 포맷팅
        timeFormatter: (timestamp: number) => {
          const date = new Date(timestamp * 1000);
          return date.toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00c853",
      downColor: "#ff1744",
      borderUpColor: "#00c853",
      borderDownColor: "#ff1744",
      wickUpColor: "#00c853",
      wickDownColor: "#ff1744",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: "volume",
      priceFormat: { type: "volume" },
    });

    const ma5Series = chart.addLineSeries({
      title: "MA5",
      color: MA_COLORS[5],
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const ma20Series = chart.addLineSeries({
      title: "MA20",
      color: MA_COLORS[20],
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const ma60Series = chart.addLineSeries({
      title: "MA60",
      color: MA_COLORS[60],
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const ma120Series = chart.addLineSeries({
      title: "MA120",
      color: MA_COLORS[120],
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // 볼린저 밴드
    const bbUpperSeries = chart.addLineSeries({
      title: "BB Upper",
      color: "#ef4444",
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const bbMiddleSeries = chart.addLineSeries({
      title: "BB Middle",
      color: "#6366f1",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const bbLowerSeries = chart.addLineSeries({
      title: "BB Lower",
      color: "#22c55e",
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // RSI (별도 스케일)
    const rsiSeries = chart.addLineSeries({
      title: "RSI",
      color: "#f97316",
      lineWidth: 1,
      priceScaleId: "rsi",
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });

    chart.priceScale("rsi").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0.02,
      },
      visible: true,
      borderColor: "rgba(148, 163, 184, 0.2)",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.75,
        bottom: 0,
      },
      visible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ma5SeriesRef.current = ma5Series;
    ma20SeriesRef.current = ma20Series;
    ma60SeriesRef.current = ma60Series;
    ma120SeriesRef.current = ma120Series;
    bbUpperRef.current = bbUpperSeries;
    bbMiddleRef.current = bbMiddleSeries;
    bbLowerRef.current = bbLowerSeries;
    rsiSeriesRef.current = rsiSeries;

    candleSeries.setData(candles);
    volumeSeries.setData(volume ?? []);
    ma5Series.setData(ma5);
    ma20Series.setData(ma20);
    ma60Series.setData(ma60);
    ma120Series.setData(ma120);
    bbUpperSeries.setData(bollingerBands.upper);
    bbMiddleSeries.setData(bollingerBands.middle);
    bbLowerSeries.setData(bollingerBands.lower);
    rsiSeries.setData(rsi);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    });
    ro.observe(container);

    const onCrosshairMove = (param: MouseEventParams) => {
      const p = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      const v = param.seriesData.get(volumeSeries) as HistogramData | undefined;

      if (!p) {
        setHoverText("");
        return;
      }

      const parts = [`O ${p.open}`, `H ${p.high}`, `L ${p.low}`, `C ${p.close}`];
      if (v && Number.isFinite(v.value)) {
        parts.push(`V ${formatVolume(v.value)}`);
      }
      setHoverText(parts.join("  "));
    };

    chart.subscribeCrosshairMove(onCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ma5SeriesRef.current = null;
      ma20SeriesRef.current = null;
      ma60SeriesRef.current = null;
      ma120SeriesRef.current = null;
      bbUpperRef.current = null;
      bbMiddleRef.current = null;
      bbLowerRef.current = null;
      rsiSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;

    if (!chart || !candleSeries || !volumeSeries) return;

    candleSeries.setData(candles);
    volumeSeries.setData(volume ?? []);

    ma5SeriesRef.current?.setData(ma5);
    ma20SeriesRef.current?.setData(ma20);
    ma60SeriesRef.current?.setData(ma60);
    ma120SeriesRef.current?.setData(ma120);
    bbUpperRef.current?.setData(bollingerBands.upper);
    bbMiddleRef.current?.setData(bollingerBands.middle);
    bbLowerRef.current?.setData(bollingerBands.lower);
    rsiSeriesRef.current?.setData(rsi);

    // 종목 변경 시 전체 차트 스케일 리셋
    chart.timeScale().fitContent();
    chart.priceScale("right").applyOptions({ autoScale: true });
  }, [candles, volume, ma5, ma20, ma60, ma120, bollingerBands, rsi]);

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-background/70 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
        {hoverText || (lastClose ? `Last: ${lastClose}` : "")}
      </div>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function formatVolume(v: number) {
  try {
    return Math.round(v).toLocaleString();
  } catch {
    return String(Math.round(v));
  }
}
