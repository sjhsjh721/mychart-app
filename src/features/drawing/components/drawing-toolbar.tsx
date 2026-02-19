"use client";

import { useDrawingStore, type DrawingTool } from "@/store/drawing-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Minus,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Square,
  Triangle,
  Type,
  MousePointer2,
  Trash2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolButtonProps {
  tool: DrawingTool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const TOOLS: ToolButtonProps[] = [
  { tool: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "선택", shortcut: "V" },
  { tool: "horizontal-line", icon: <Minus className="h-4 w-4" />, label: "수평선", shortcut: "H" },
  { tool: "vertical-line", icon: <GripVertical className="h-4 w-4" />, label: "수직선" },
  { tool: "trend-line", icon: <TrendingUp className="h-4 w-4" />, label: "추세선", shortcut: "T" },
  { tool: "ray", icon: <ArrowRight className="h-4 w-4" />, label: "레이" },
  {
    tool: "fib-retracement",
    icon: <BarChart3 className="h-4 w-4" />,
    label: "피보나치",
    shortcut: "F",
  },
  { tool: "rectangle", icon: <Square className="h-4 w-4" />, label: "사각형", shortcut: "R" },
  { tool: "triangle", icon: <Triangle className="h-4 w-4" />, label: "삼각형" },
  { tool: "text", icon: <Type className="h-4 w-4" />, label: "텍스트" },
];

interface DrawingToolbarProps {
  stockCode: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function DrawingToolbar({
  stockCode,
  orientation = "vertical",
  className,
}: DrawingToolbarProps) {
  const { activeTool, setActiveTool, clearDrawings, getDrawings } = useDrawingStore();
  const drawingCount = getDrawings(stockCode).length;

  const handleToolClick = (tool: DrawingTool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  const handleClear = () => {
    if (drawingCount > 0 && confirm(`${drawingCount}개의 작도를 모두 삭제하시겠습니까?`)) {
      clearDrawings(stockCode);
    }
  };

  const isVertical = orientation === "vertical";

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex gap-1 p-1.5 bg-background/95 backdrop-blur border rounded-lg shadow-sm",
          isVertical ? "flex-col" : "flex-row flex-wrap",
          className,
        )}
      >
        {TOOLS.map((tool, index) => (
          <div key={tool.tool}>
            {/* 선택 도구 후 구분선 */}
            {index === 1 && (
              <Separator
                orientation={isVertical ? "horizontal" : "vertical"}
                className={cn(isVertical ? "my-1" : "mx-1 h-6")}
              />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.tool ? "secondary" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    activeTool === tool.tool && "bg-primary/10 text-primary",
                  )}
                  onClick={() => handleToolClick(tool.tool)}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isVertical ? "right" : "bottom"}>
                <p>
                  {tool.label}
                  {tool.shortcut && (
                    <span className="ml-2 text-muted-foreground">({tool.shortcut})</span>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}

        <Separator
          orientation={isVertical ? "horizontal" : "vertical"}
          className={cn(isVertical ? "my-1" : "mx-1 h-6")}
        />

        {/* 삭제 버튼 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleClear}
              disabled={drawingCount === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={isVertical ? "right" : "bottom"}>
            <p>모두 삭제 ({drawingCount})</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
