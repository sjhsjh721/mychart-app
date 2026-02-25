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
  calculateIchimoku,
} from "@/features/chart/lib/indicators";
import { useIndicatorStore } from "@/store/indicator-store";
import { useDrawing } from "@/features/drawing";

const MA_COLORS: Record<number, string> = {
  5: "#f59e0b", // amber
  10: "#eab308", // yellow
  20: "#22c55e", // green
  60: "#3b82f6", // blue
  120: "#a855f7", // purple
  200: "#ec4899", // pink
};

export function CandlestickChart({
  candles,
  volume,
  stockCode = "005930",
}: {
  candles: CandlestickData[];
  volume?: HistogramData[];
  stockCode?: string;
}) {
  const indicators = useIndicatorStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma10SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma60SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma120SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma200SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  // 볼린저 밴드
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  // RSI
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  // 일목균형표
  const ichimokuTenkanRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ichimokuKijunRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ichimokuSpanARef = useRef<ISeriesApi<"Line"> | null>(null);
  const ichimokuSpanBRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ichimokuChikouRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [hoverText, setHoverText] = useState<string>("");

  // Drawing tools integration
  useDrawing({
    chart: chartRef.current,
    series: candleSeriesRef.current,
    stockCode,
  });

  const lastClose = useMemo(() => {
    const last = candles[candles.length - 1];
    return last ? last.close : undefined;
  }, [candles]);

  // MA - 설정에 따라 계산
  const ma5 = useMemo(
    () =>
      indicators.ma.enabled && indicators.ma.periods.includes(5) ? calculateSMA(candles, 5) : [],
    [candles, indicators.ma],
  );
  const ma10 = useMemo(
    () =>
      indicators.ma.enabled && indicators.ma.periods.includes(10) ? calculateSMA(candles, 10) : [],
    [candles, indicators.ma],
  );
  const ma20 = useMemo(
    () =>
      indicators.ma.enabled && indicators.ma.periods.includes(20) ? calculateSMA(candles, 20) : [],
    [candles, indicators.ma],
  );
  const ma60 = useMemo(
    () =>
      indicators.ma.enabled && indicators.ma.periods.includes(60) ? calculateSMA(candles, 60) : [],
    [candles, indicators.ma],
  );
  const ma120 = useMemo(
    () =>
      indicators.ma.enabled && indicators.ma.periods.includes(120)
        ? calculateSMA(candles, 120)
        : [],
    [candles, indicators.ma],
  );
  const ma200 = useMemo(
    () =>
      indicators.ma.enabled && indicators.ma.periods.includes(200)
        ? calculateSMA(candles, 200)
        : [],
    [candles, indicators.ma],
  );

  // 볼린저 밴드
  const bollingerBands = useMemo(
    () =>
      indicators.bollinger.enabled
        ? calculateBollingerBands(candles, indicators.bollinger.period, indicators.bollinger.stdDev)
        : { upper: [], middle: [], lower: [] },
    [candles, indicators.bollinger],
  );

  // RSI
  const rsi = useMemo(
    () => (indicators.rsi.enabled ? calculateRSI(candles, indicators.rsi.period) : []),
    [candles, indicators.rsi],
  );

  // 일목균형표
  const ichimoku = useMemo(
    () =>
      indicators.ichimoku.enabled
        ? calculateIchimoku(
            candles,
            indicators.ichimoku.tenkanPeriod,
            indicators.ichimoku.kijunPeriod,
            indicators.ichimoku.senkouBPeriod,
            indicators.ichimoku.displacement,
          )
        : { tenkanSen: [], kijunSen: [], senkouSpanA: [], senkouSpanB: [], chikouSpan: [] },
    [candles, indicators.ichimoku],
  );

  // 거래량
  const volumeData = useMemo(
    () => (indicators.volume.enabled ? (volume ?? []) : []),
    [volume, indicators.volume.enabled],
  );

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

    const ma10Series = chart.addLineSeries({
      title: "MA10",
      color: MA_COLORS[10],
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

    const ma200Series = chart.addLineSeries({
      title: "MA200",
      color: MA_COLORS[200],
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

    // 일목균형표
    const ichimokuTenkan = chart.addLineSeries({
      title: "전환선",
      color: "#ef4444", // red
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const ichimokuKijun = chart.addLineSeries({
      title: "기준선",
      color: "#3b82f6", // blue
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const ichimokuSpanA = chart.addLineSeries({
      title: "선행A",
      color: "#22c55e", // green
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const ichimokuSpanB = chart.addLineSeries({
      title: "선행B",
      color: "#f97316", // orange
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const ichimokuChikou = chart.addLineSeries({
      title: "후행스팬",
      color: "#a855f7", // purple
      lineWidth: 1,
      lineStyle: 2, // dashed
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
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
    ma10SeriesRef.current = ma10Series;
    ma20SeriesRef.current = ma20Series;
    ma60SeriesRef.current = ma60Series;
    ma120SeriesRef.current = ma120Series;
    ma200SeriesRef.current = ma200Series;
    bbUpperRef.current = bbUpperSeries;
    bbMiddleRef.current = bbMiddleSeries;
    bbLowerRef.current = bbLowerSeries;
    rsiSeriesRef.current = rsiSeries;
    ichimokuTenkanRef.current = ichimokuTenkan;
    ichimokuKijunRef.current = ichimokuKijun;
    ichimokuSpanARef.current = ichimokuSpanA;
    ichimokuSpanBRef.current = ichimokuSpanB;
    ichimokuChikouRef.current = ichimokuChikou;

    candleSeries.setData(candles);
    volumeSeries.setData(volumeData);
    ma5Series.setData(ma5);
    ma10Series.setData(ma10);
    ma20Series.setData(ma20);
    ma60Series.setData(ma60);
    ma120Series.setData(ma120);
    ma200Series.setData(ma200);
    bbUpperSeries.setData(bollingerBands.upper);
    bbMiddleSeries.setData(bollingerBands.middle);
    bbLowerSeries.setData(bollingerBands.lower);
    rsiSeries.setData(rsi);
    ichimokuTenkan.setData(ichimoku.tenkanSen);
    ichimokuKijun.setData(ichimoku.kijunSen);
    ichimokuSpanA.setData(ichimoku.senkouSpanA);
    ichimokuSpanB.setData(ichimoku.senkouSpanB);
    ichimokuChikou.setData(ichimoku.chikouSpan);
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
      ma10SeriesRef.current = null;
      ma20SeriesRef.current = null;
      ma60SeriesRef.current = null;
      ma120SeriesRef.current = null;
      ma200SeriesRef.current = null;
      bbUpperRef.current = null;
      bbMiddleRef.current = null;
      bbLowerRef.current = null;
      rsiSeriesRef.current = null;
      ichimokuTenkanRef.current = null;
      ichimokuKijunRef.current = null;
      ichimokuSpanARef.current = null;
      ichimokuSpanBRef.current = null;
      ichimokuChikouRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;

    if (!chart || !candleSeries || !volumeSeries) return;

    candleSeries.setData(candles);
    volumeSeries.setData(volumeData);

    ma5SeriesRef.current?.setData(ma5);
    ma10SeriesRef.current?.setData(ma10);
    ma20SeriesRef.current?.setData(ma20);
    ma60SeriesRef.current?.setData(ma60);
    ma120SeriesRef.current?.setData(ma120);
    ma200SeriesRef.current?.setData(ma200);
    bbUpperRef.current?.setData(bollingerBands.upper);
    bbMiddleRef.current?.setData(bollingerBands.middle);
    bbLowerRef.current?.setData(bollingerBands.lower);
    rsiSeriesRef.current?.setData(rsi);
    ichimokuTenkanRef.current?.setData(ichimoku.tenkanSen);
    ichimokuKijunRef.current?.setData(ichimoku.kijunSen);
    ichimokuSpanARef.current?.setData(ichimoku.senkouSpanA);
    ichimokuSpanBRef.current?.setData(ichimoku.senkouSpanB);
    ichimokuChikouRef.current?.setData(ichimoku.chikouSpan);

    // 종목 변경 시 전체 차트 스케일 리셋
    chart.timeScale().fitContent();
    chart.priceScale("right").applyOptions({ autoScale: true });
  }, [candles, volumeData, ma5, ma10, ma20, ma60, ma120, ma200, bollingerBands, rsi, ichimoku]);

  // 지표 visible 토글
  useEffect(() => {
    // MA
    ma5SeriesRef.current?.applyOptions({
      visible: indicators.ma.enabled && indicators.ma.periods.includes(5),
    });
    ma10SeriesRef.current?.applyOptions({
      visible: indicators.ma.enabled && indicators.ma.periods.includes(10),
    });
    ma20SeriesRef.current?.applyOptions({
      visible: indicators.ma.enabled && indicators.ma.periods.includes(20),
    });
    ma60SeriesRef.current?.applyOptions({
      visible: indicators.ma.enabled && indicators.ma.periods.includes(60),
    });
    ma120SeriesRef.current?.applyOptions({
      visible: indicators.ma.enabled && indicators.ma.periods.includes(120),
    });
    ma200SeriesRef.current?.applyOptions({
      visible: indicators.ma.enabled && indicators.ma.periods.includes(200),
    });
    // 볼린저 밴드
    bbUpperRef.current?.applyOptions({ visible: indicators.bollinger.enabled });
    bbMiddleRef.current?.applyOptions({ visible: indicators.bollinger.enabled });
    bbLowerRef.current?.applyOptions({ visible: indicators.bollinger.enabled });
    // RSI
    rsiSeriesRef.current?.applyOptions({ visible: indicators.rsi.enabled });
    // 일목균형표
    ichimokuTenkanRef.current?.applyOptions({ visible: indicators.ichimoku.enabled });
    ichimokuKijunRef.current?.applyOptions({ visible: indicators.ichimoku.enabled });
    ichimokuSpanARef.current?.applyOptions({ visible: indicators.ichimoku.enabled });
    ichimokuSpanBRef.current?.applyOptions({ visible: indicators.ichimoku.enabled });
    ichimokuChikouRef.current?.applyOptions({ visible: indicators.ichimoku.enabled });
    // 거래량
    volumeSeriesRef.current?.applyOptions({ visible: indicators.volume.enabled });
  }, [indicators]);

  return (
    <div className="relative isolate h-full w-full">
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
