"use client";

import {
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  type CandlestickData,
  type ISeriesApi,
  type MouseEventParams,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";

export function CandlestickChart({ data }: { data: CandlestickData[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [hoverText, setHoverText] = useState<string>("");

  const lastClose = useMemo(() => {
    const last = data[data.length - 1];
    return last ? last.close : undefined;
  }, [data]);

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
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#00c853",
      downColor: "#ff1744",
      borderUpColor: "#00c853",
      borderDownColor: "#ff1744",
      wickUpColor: "#00c853",
      wickDownColor: "#ff1744",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    series.setData(data);
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
      const p = param.seriesData.get(series) as CandlestickData | undefined;
      if (!p) {
        setHoverText("");
        return;
      }
      setHoverText(`O ${p.open}  H ${p.high}  L ${p.low}  C ${p.close}`);
    };

    chart.subscribeCrosshairMove(onCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    seriesRef.current.setData(data);
    chartRef.current.timeScale().fitContent();
  }, [data]);

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-background/70 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
        {hoverText || (lastClose ? `Last: ${lastClose}` : "")}
      </div>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
