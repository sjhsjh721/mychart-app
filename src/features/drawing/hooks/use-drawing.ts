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
    selectedId,
    addDrawing,
    getDrawings,
    deleteDrawing,
    selectDrawing,
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

  // Find closest drawing to click point
  const findClosestDrawing = useCallback(
    (clickPrice: number, clickTime: number, threshold = 0.02) => {
      const drawings = getDrawings(stockCode);
      let closest: { id: string; distance: number } | null = null;

      for (const drawing of drawings) {
        let distance = Infinity;

        if (drawing.type === "horizontal-line") {
          // Distance is relative price difference
          const priceDiff = Math.abs(drawing.price - clickPrice) / clickPrice;
          distance = priceDiff;
        } else if (drawing.type === "trend-line" || drawing.type === "ray") {
          // Point-to-line distance
          const { startPoint, endPoint } = drawing;
          const dx = endPoint.time - startPoint.time;
          const dy = endPoint.price - startPoint.price;

          if (dx === 0 && dy === 0) {
            distance = Math.abs(clickPrice - startPoint.price) / clickPrice;
          } else {
            // Parametric projection
            const t = Math.max(
              0,
              Math.min(
                1,
                ((clickTime - startPoint.time) * dx + (clickPrice - startPoint.price) * dy) /
                  (dx * dx + dy * dy),
              ),
            );
            const projPrice = startPoint.price + t * dy;
            distance = Math.abs(clickPrice - projPrice) / clickPrice;
          }
        } else if (drawing.type === "fib-retracement") {
          // Check distance to any fib level
          const { startPoint, endPoint, levels } = drawing;
          const priceRange = endPoint.price - startPoint.price;
          for (const level of levels) {
            const levelPrice = startPoint.price + priceRange * level;
            const priceDiff = Math.abs(levelPrice - clickPrice) / clickPrice;
            if (priceDiff < distance) {
              distance = priceDiff;
            }
          }
        }

        if (distance < threshold && (!closest || distance < closest.distance)) {
          closest = { id: drawing.id, distance };
        }
      }

      return closest?.id || null;
    },
    [getDrawings, stockCode],
  );

  // Handle chart click
  const handleClick = useCallback(
    (param: MouseEventParams) => {
      if (!series || !param.point) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;

      const time = param.time as number;

      // Select mode: find and select closest drawing
      if (activeTool === "select" || !activeTool) {
        const closestId = findClosestDrawing(price, time || 0);
        selectDrawing(closestId);
        return;
      }

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
      findClosestDrawing,
      selectDrawing,
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

    // Helper: get highlight style for selected drawing
    const getHighlightColor = (color: string, isSelected: boolean) => {
      if (!isSelected) return color;
      // Make color brighter/more saturated for selection
      return "#FFEB3B"; // Yellow highlight
    };

    const getHighlightWidth = (width: number, isSelected: boolean): LineWidth => {
      return (isSelected ? Math.min(width + 1, 4) : width) as LineWidth;
    };

    // Add/update drawings
    drawings.forEach((drawing) => {
      const isSelected = drawing.id === selectedId;

      if (drawing.type === "horizontal-line" && drawing.visible) {
        const existing = priceLinesRef.current.get(drawing.id);

        const lineStyle: LineStyle =
          drawing.style.lineStyle === "dashed" ? 1 : drawing.style.lineStyle === "dotted" ? 2 : 0;

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);

        if (existing) {
          existing.applyOptions({
            price: drawing.price,
            color,
            lineWidth,
            lineStyle,
          });
        } else {
          const priceLine = series.createPriceLine({
            price: drawing.price,
            color,
            lineWidth,
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

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);

        const lineData: LineData[] = [
          { time: drawing.startPoint.time as Time, value: drawing.startPoint.price },
          { time: drawing.endPoint.time as Time, value: drawing.endPoint.price },
        ];

        if (existing) {
          existing.applyOptions({
            color,
            lineWidth,
            lineStyle,
          });
          existing.setData(lineData);
        } else {
          const lineSeries = chart.addLineSeries({
            color,
            lineWidth,
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

        const color = getHighlightColor(drawing.style.color, isSelected);
        const lineWidth = getHighlightWidth(drawing.style.lineWidth, isSelected);

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
            color,
            lineWidth,
            lineStyle,
          });
          existing.setData(lineData);
        } else {
          const lineSeries = chart.addLineSeries({
            color,
            lineWidth,
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
        const fibLineWidth = isSelected ? (2 as LineWidth) : (1 as LineWidth);

        levels.forEach((level) => {
          const price = startPoint.price + priceRange * level;
          const baseColor = fibColors[level] || drawing.style.color;
          const color = isSelected ? "#FFEB3B" : baseColor;
          const levelPercent = (level * 100).toFixed(1);

          const priceLine = series.createPriceLine({
            price,
            color,
            lineWidth: fibLineWidth,
            lineStyle: 2, // Dotted
            axisLabelVisible: true,
            title: `${levelPercent}%`,
          });
          newLines.push(priceLine);
        });

        fibLinesRef.current.set(drawing.id, newLines);
      }
    });
  }, [chart, series, stockCode, getDrawings, selectedId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          // Delete selected drawing
          if (selectedId) {
            deleteDrawing(stockCode, selectedId);
          }
          break;
        case "Escape":
          // Cancel current tool or deselect
          setActiveTool(null);
          selectDrawing(null);
          clearTempPoints();
          break;
        case "v":
        case "V":
          setActiveTool("select");
          break;
        case "h":
        case "H":
          setActiveTool("horizontal-line");
          break;
        case "t":
        case "T":
          setActiveTool("trend-line");
          break;
        case "f":
        case "F":
          setActiveTool("fib-retracement");
          break;
        case "r":
        case "R":
          setActiveTool("rectangle");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, stockCode, deleteDrawing, selectDrawing, setActiveTool, clearTempPoints]);

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
    selectedId,
    drawings: getDrawings(stockCode),
    selectDrawing,
    deleteDrawing: (id: string) => deleteDrawing(stockCode, id),
  };
}
