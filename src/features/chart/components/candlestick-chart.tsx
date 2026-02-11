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
  const [hoverText, setHoverText] = useState<string>("");

  const lastClose = useMemo(() => {
    const last = candles[candles.length - 1];
    return last ? last.close : undefined;
  }, [candles]);

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

    candleSeries.setData(candles);
    volumeSeries.setData(volume ?? []);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !chartRef.current) return;
    candleSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(volume ?? []);
    // 종목 변경 시 전체 차트 스케일 리셋
    chartRef.current.timeScale().fitContent();
    chartRef.current.priceScale("right").applyOptions({ autoScale: true });
  }, [candles, volume]);

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
