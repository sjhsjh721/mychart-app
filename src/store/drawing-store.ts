import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==================== Types ====================

export type DrawingTool =
  | "select"
  | "horizontal-line"
  | "vertical-line"
  | "trend-line"
  | "ray"
  | "fib-retracement"
  | "parallel-channel"
  | "rectangle"
  | "triangle"
  | "text";

export interface Point {
  time: number; // Unix timestamp
  price: number;
}

export interface DrawingStyle {
  color: string;
  lineWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  fillColor?: string;
  fillOpacity?: number;
}

// Base drawing interface
export interface BaseDrawing {
  id: string;
  type: DrawingTool;
  style: DrawingStyle;
  visible: boolean;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
}

// Specific drawing types
export interface HorizontalLineDrawing extends BaseDrawing {
  type: "horizontal-line";
  price: number;
}

export interface VerticalLineDrawing extends BaseDrawing {
  type: "vertical-line";
  time: number;
}

export interface TrendLineDrawing extends BaseDrawing {
  type: "trend-line";
  startPoint: Point;
  endPoint: Point;
  extendLeft?: boolean;
  extendRight?: boolean;
}

export interface RayDrawing extends BaseDrawing {
  type: "ray";
  startPoint: Point;
  endPoint: Point; // Direction
}

export interface FibRetracementDrawing extends BaseDrawing {
  type: "fib-retracement";
  startPoint: Point;
  endPoint: Point;
  levels: number[]; // [0, 0.236, 0.382, 0.5, 0.618, 1]
}

export interface ParallelChannelDrawing extends BaseDrawing {
  type: "parallel-channel";
  line1Start: Point;
  line1End: Point;
  channelWidth: number; // in price units
}

export interface RectangleDrawing extends BaseDrawing {
  type: "rectangle";
  topLeft: Point;
  bottomRight: Point;
}

export interface TriangleDrawing extends BaseDrawing {
  type: "triangle";
  point1: Point;
  point2: Point;
  point3: Point;
}

export interface TextDrawing extends BaseDrawing {
  type: "text";
  position: Point;
  text: string;
  fontSize: number;
}

export type Drawing =
  | HorizontalLineDrawing
  | VerticalLineDrawing
  | TrendLineDrawing
  | RayDrawing
  | FibRetracementDrawing
  | ParallelChannelDrawing
  | RectangleDrawing
  | TriangleDrawing
  | TextDrawing;

// ==================== Store ====================

export interface DrawingState {
  // State
  activeTool: DrawingTool | null;
  selectedId: string | null;
  drawings: Record<string, Drawing[]>; // stockCode -> drawings
  isDrawing: boolean; // Currently drawing (mouse down)
  tempPoints: Point[]; // Temporary points while drawing

  // Default style
  defaultStyle: DrawingStyle;

  // Actions
  setActiveTool: (tool: DrawingTool | null) => void;
  selectDrawing: (id: string | null) => void;
  
  // Drawing CRUD
  addDrawing: (stockCode: string, drawing: Drawing) => void;
  updateDrawing: (stockCode: string, id: string, updates: Partial<Drawing>) => void;
  deleteDrawing: (stockCode: string, id: string) => void;
  clearDrawings: (stockCode: string) => void;
  
  // Drawing state
  setIsDrawing: (isDrawing: boolean) => void;
  addTempPoint: (point: Point) => void;
  clearTempPoints: () => void;
  
  // Style
  setDefaultStyle: (style: Partial<DrawingStyle>) => void;
  
  // Getters
  getDrawings: (stockCode: string) => Drawing[];
}

const DEFAULT_STYLE: DrawingStyle = {
  color: "#2962FF",
  lineWidth: 2,
  lineStyle: "solid",
  fillColor: "#2962FF",
  fillOpacity: 0.1,
};

export const useDrawingStore = create<DrawingState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeTool: null,
      selectedId: null,
      drawings: {},
      isDrawing: false,
      tempPoints: [],
      defaultStyle: DEFAULT_STYLE,

      // Actions
      setActiveTool: (tool) => set({ activeTool: tool, selectedId: null }),
      selectDrawing: (id) => set({ selectedId: id, activeTool: id ? "select" : null }),

      addDrawing: (stockCode, drawing) =>
        set((state) => ({
          drawings: {
            ...state.drawings,
            [stockCode]: [...(state.drawings[stockCode] || []), drawing],
          },
        })),

      updateDrawing: (stockCode, id, updates) =>
        set((state) => ({
          drawings: {
            ...state.drawings,
            [stockCode]: (state.drawings[stockCode] || []).map((d) =>
              d.id === id ? ({ ...d, ...updates, updatedAt: Date.now() } as Drawing) : d
            ),
          },
        })),

      deleteDrawing: (stockCode, id) =>
        set((state) => ({
          drawings: {
            ...state.drawings,
            [stockCode]: (state.drawings[stockCode] || []).filter((d) => d.id !== id),
          },
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      clearDrawings: (stockCode) =>
        set((state) => ({
          drawings: {
            ...state.drawings,
            [stockCode]: [],
          },
          selectedId: null,
        })),

      setIsDrawing: (isDrawing) => set({ isDrawing }),
      addTempPoint: (point) => set((state) => ({ tempPoints: [...state.tempPoints, point] })),
      clearTempPoints: () => set({ tempPoints: [] }),

      setDefaultStyle: (style) =>
        set((state) => ({ defaultStyle: { ...state.defaultStyle, ...style } })),

      getDrawings: (stockCode) => get().drawings[stockCode] || [],
    }),
    {
      name: "mychart-drawings",
      // Only persist drawings and defaultStyle, not transient state
      partialize: (state) => ({
        drawings: state.drawings,
        defaultStyle: state.defaultStyle,
      }),
    }
  )
);

// ==================== Utility ====================

export function createDrawingId(): string {
  return `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
