"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineData,
  LineStyle,
  LineWidth,
  MouseEventParams,
  Time,
} from "lightweight-charts";
import {
  useDrawingStore,
  createDrawingId,
  type HorizontalLineDrawing,
  type TrendLineDrawing,
  type VerticalLineDrawing,
  type RayDrawing,
  type FibRetracementDrawing,
  type Point,
} from "@/store/drawing-store";

interface UseDrawingOptions {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  stockCode: string;
}

export function useDrawing({ chart, series, stockCode }: UseDrawingOptions) {
  const {
    activeTool,
    addDrawing,
    getDrawings,
    defaultStyle,
    setActiveTool,
    tempPoints,
    addTempPoint,
    clearTempPoints,
  } = useDrawingStore();

  // Track price lines for cleanup
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  // Track trend line series
  const trendLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  // Track vertical line series
  const verticalLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  // Track ray line series
  const rayLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  // Track fibonacci price lines (multiple per drawing)
  const fibLinesRef = useRef<Map<string, IPriceLine[]>>(new Map());

  // Handle chart click
  const handleClick = useCallback(
    (param: MouseEventParams) => {
      if (!activeTool || activeTool === "select" || !series || !param.point) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;

      if (activeTool === "horizontal-line") {
        const drawing: HorizontalLineDrawing = {
          id: createDrawingId(),
          type: "horizontal-line",
          price,
          style: { ...defaultStyle },
          visible: true,
          locked: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addDrawing(stockCode, drawing);
        setActiveTool(null);
      } else if (activeTool === "vertical-line") {
        const time = param.time as number;
        if (!time) return;

        const drawing: VerticalLineDrawing = {
          id: createDrawingId(),
          type: "vertical-line",
          time,
          style: { ...defaultStyle },
          visible: true,
          locked: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addDrawing(stockCode, drawing);
        setActiveTool(null);
      } else if (activeTool === "trend-line") {
        // Trend line needs two points
        const time = param.time as number;
        const point: Point = { time, price };

        if (tempPoints.length === 0) {
          addTempPoint(point);
        } else {
          const startPoint = tempPoints[0];
          const drawing: TrendLineDrawing = {
            id: createDrawingId(),
            type: "trend-line",
            startPoint,
            endPoint: point,
            extendLeft: false,
            extendRight: false,
            style: { ...defaultStyle },
            visible: true,
            locked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addDrawing(stockCode, drawing);
          clearTempPoints();
          setActiveTool(null);
        }
      } else if (activeTool === "ray") {
        const time = param.time as number;
        const point: Point = { time, price };

        if (tempPoints.length === 0) {
          addTempPoint(point);
        } else {
          const startPoint = tempPoints[0];
          const drawing: RayDrawing = {
            id: createDrawingId(),
            type: "ray",
            startPoint,
            endPoint: point,
            style: { ...defaultStyle },
            visible: true,
            locked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addDrawing(stockCode, drawing);
          clearTempPoints();
          setActiveTool(null);
        }
      } else if (activeTool === "fib-retracement") {
        const time = param.time as number;
        const point: Point = { time, price };

        if (tempPoints.length === 0) {
          addTempPoint(point);
        } else {
          const startPoint = tempPoints[0];
          const drawing: FibRetracementDrawing = {
            id: createDrawingId(),
            type: "fib-retracement",
            startPoint,
            endPoint: point,
            levels: [0, 0.236, 0.382, 0.5, 0.618, 1],
            style: { ...defaultStyle },
            visible: true,
            locked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addDrawing(stockCode, drawing);
          clearTempPoints();
          setActiveTool(null);
        }
      }
    },
    [
      activeTool,
      series,
      stockCode,
      addDrawing,
      defaultStyle,
      setActiveTool,
      tempPoints,
      addTempPoint,
      clearTempPoints,
    ],
  );

  // Subscribe to chart clicks
  useEffect(() => {
    if (!chart) return;

    chart.subscribeClick(handleClick);
    return () => {
      chart.unsubscribeClick(handleClick);
    };
  }, [chart, handleClick]);

  // Sync drawings with chart
  useEffect(() => {
    if (!series || !chart) return;

    const drawings = getDrawings(stockCode);
    const currentIds = new Set(drawings.map((d) => d.id));

    // Remove price lines for deleted drawings
    priceLinesRef.current.forEach((priceLine, id) => {
      if (!currentIds.has(id)) {
        series.removePriceLine(priceLine);
        priceLinesRef.current.delete(id);
      }
    });

    // Remove trend lines for deleted drawings
    trendLinesRef.current.forEach((lineSeries, id) => {
      if (!currentIds.has(id)) {
        chart.removeSeries(lineSeries);
        trendLinesRef.current.delete(id);
      }
    });

    // Remove vertical lines for deleted drawings
    verticalLinesRef.current.forEach((lineSeries, id) => {
      if (!currentIds.has(id)) {
        chart.removeSeries(lineSeries);
        verticalLinesRef.current.delete(id);
      }
    });

    // Remove ray lines for deleted drawings
    rayLinesRef.current.forEach((lineSeries, id) => {
      if (!currentIds.has(id)) {
        chart.removeSeries(lineSeries);
        rayLinesRef.current.delete(id);
      }
    });

    // Remove fibonacci lines for deleted drawings
    fibLinesRef.current.forEach((priceLines, id) => {
      if (!currentIds.has(id)) {
        priceLines.forEach((line) => {
          try {
            series.removePriceLine(line);
          } catch {
            // Ignore
          }
        });
        fibLinesRef.current.delete(id);
      }
    });

    // Add/update drawings
    drawings.forEach((drawing) => {
      if (drawing.type === "horizontal-line" && drawing.visible) {
        const existing = priceLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        if (existing) {
          existing.applyOptions({
            price: drawing.price,
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
          });
        } else {
          const priceLine = series.createPriceLine({
            price: drawing.price,
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
            axisLabelVisible: true,
            title: "",
          });
          priceLinesRef.current.set(drawing.id, priceLine);
        }
      } else if (drawing.type === "trend-line" && drawing.visible) {
        const existing = trendLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        const lineData: LineData[] = [
          { time: drawing.startPoint.time as Time, value: drawing.startPoint.price },
          { time: drawing.endPoint.time as Time, value: drawing.endPoint.price },
        ];

        if (existing) {
          existing.applyOptions({
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
          });
          existing.setData(lineData);
        } else {
          const lineSeries = chart.addLineSeries({
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData(lineData);
          trendLinesRef.current.set(drawing.id, lineSeries);
        }
      } else if (drawing.type === "vertical-line" && drawing.visible) {
        // Vertical line: Lightweight Charts doesn't support true vertical lines natively
        // We use createPriceLine with a marker at the specific time
        // Alternative: Use series markers for visual indication
        const existingMarkers = series.markers();
        const hasMarker = existingMarkers?.some((m) => (m as { id?: string }).id === drawing.id);

        if (!hasMarker) {
          const markers = [
            ...(existingMarkers || []),
            {
              id: drawing.id,
              time: drawing.time as Time,
              position: "aboveBar" as const,
              color: drawing.style.color,
              shape: "arrowDown" as const,
              text: "│",
            },
          ];
          series.setMarkers(markers);
          verticalLinesRef.current.set(drawing.id, series as unknown as ISeriesApi<"Line">);
        }
      } else if (drawing.type === "ray" && drawing.visible) {
        // Ray: extends from startPoint through endPoint to chart boundary
        const existing = rayLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        // Calculate ray extension
        const { startPoint, endPoint } = drawing;
        const dx = endPoint.time - startPoint.time;
        const dy = endPoint.price - startPoint.price;

        // Extend to a far future point (1 year = ~31536000 seconds)
        const extensionFactor = 31536000;
        const extendedTime =
          dx > 0 ? endPoint.time + extensionFactor : endPoint.time - extensionFactor;
        const extendedPrice =
          dy !== 0 && dx !== 0
            ? endPoint.price + (dy / dx) * (dx > 0 ? extensionFactor : -extensionFactor)
            : endPoint.price;

        const lineData: LineData[] = [
          { time: startPoint.time as Time, value: startPoint.price },
          { time: extendedTime as Time, value: extendedPrice },
        ];

        // Sort by time (lineSeries requires ascending order)
        lineData.sort((a, b) => (a.time as number) - (b.time as number));

        if (existing) {
          existing.applyOptions({
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
          });
          existing.setData(lineData);
        } else {
          const lineSeries = chart.addLineSeries({
            color: drawing.style.color,
            lineWidth: drawing.style.lineWidth as LineWidth,
            lineStyle,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData(lineData);
          rayLinesRef.current.set(drawing.id, lineSeries);
        }
      } else if (drawing.type === "fib-retracement" && drawing.visible) {
        // Fibonacci Retracement: multiple horizontal lines at fib levels
        const existingLines = fibLinesRef.current.get(drawing.id);

        // Remove existing lines first (to recreate with updated values)
        if (existingLines) {
          existingLines.forEach((line) => {
            try {
              series.removePriceLine(line);
            } catch {
              // Ignore
            }
          });
        }

        const { startPoint, endPoint, levels } = drawing;
        const priceRange = endPoint.price - startPoint.price;

        // Fibonacci level colors
        const fibColors: Record<number, string> = {
          0: "#787B86",
          0.236: "#F7525F",
          0.382: "#FF9800",
          0.5: "#4CAF50",
          0.618: "#2196F3",
          1: "#787B86",
        };

        const newLines: IPriceLine[] = [];

        levels.forEach((level) => {
          const price = startPoint.price + priceRange * level;
          const color = fibColors[level] || drawing.style.color;
          const levelPercent = (level * 100).toFixed(1);

          const priceLine = series.createPriceLine({
            price,
            color,
            lineWidth: 1 as LineWidth,
            lineStyle: 2, // Dotted
            axisLabelVisible: true,
            title: `${levelPercent}%`,
          });
          newLines.push(priceLine);
        });

        fibLinesRef.current.set(drawing.id, newLines);
      }
    });
  }, [chart, series, stockCode, getDrawings]);

  // Cleanup on unmount or stock change
  useEffect(() => {
    return () => {
      if (series) {
        priceLinesRef.current.forEach((priceLine) => {
          try {
            series.removePriceLine(priceLine);
          } catch {
            // Ignore if already removed
          }
        });
        priceLinesRef.current.clear();

        // Cleanup fibonacci lines
        fibLinesRef.current.forEach((priceLines) => {
          priceLines.forEach((line) => {
            try {
              series.removePriceLine(line);
            } catch {
              // Ignore
            }
          });
        });
        fibLinesRef.current.clear();
      }
      if (chart) {
        trendLinesRef.current.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore if already removed
          }
        });
        trendLinesRef.current.clear();

        verticalLinesRef.current.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore if already removed
          }
        });
        verticalLinesRef.current.clear();

        rayLinesRef.current.forEach((lineSeries) => {
          try {
            chart.removeSeries(lineSeries);
          } catch {
            // Ignore if already removed
          }
        });
        rayLinesRef.current.clear();
      }
    };
  }, [chart, series, stockCode]);

  return {
    activeTool,
    drawings: getDrawings(stockCode),
  };
}
