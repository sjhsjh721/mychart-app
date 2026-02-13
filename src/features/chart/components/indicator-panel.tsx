"use client";

import { useState } from "react";
import { useIndicatorStore } from "@/store/indicator-store";
import { Button } from "@/components/ui/button";

export function IndicatorPanel() {
  const [open, setOpen] = useState(false);
  const {
    ma,
    rsi,
    bollinger,
    ichimoku,
    volume,
    setMA,
    setRSI,
    setBollinger,
    setIchimoku,
    toggleIndicator,
  } = useIndicatorStore();

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-1">
        <span className="text-xs">📊</span>
        지표
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border bg-background p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">지표 설정</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* 이동평균선 */}
          <div className="mb-4 rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ma.enabled}
                  onChange={() => toggleIndicator("ma")}
                  className="rounded"
                />
                <span className="font-medium">이동평균선 (MA)</span>
              </label>
            </div>
            {ma.enabled && (
              <div className="mt-2 flex flex-wrap gap-1">
                {[5, 10, 20, 60, 120, 200].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      const newPeriods = ma.periods.includes(p)
                        ? ma.periods.filter((x) => x !== p)
                        : [...ma.periods, p].sort((a, b) => a - b);
                      setMA({ periods: newPeriods });
                    }}
                    className={`rounded px-2 py-1 text-xs ${
                      ma.periods.includes(p)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RSI */}
          <div className="mb-4 rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rsi.enabled}
                  onChange={() => toggleIndicator("rsi")}
                  className="rounded"
                />
                <span className="font-medium">RSI</span>
              </label>
            </div>
            {rsi.enabled && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">기간</label>
                  <input
                    type="number"
                    value={rsi.period}
                    onChange={(e) => setRSI({ period: Number(e.target.value) || 14 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={1}
                    max={100}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">과매수</label>
                  <input
                    type="number"
                    value={rsi.overbought}
                    onChange={(e) => setRSI({ overbought: Number(e.target.value) || 70 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={50}
                    max={100}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">과매도</label>
                  <input
                    type="number"
                    value={rsi.oversold}
                    onChange={(e) => setRSI({ oversold: Number(e.target.value) || 30 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={0}
                    max={50}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 볼린저 밴드 */}
          <div className="mb-4 rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bollinger.enabled}
                  onChange={() => toggleIndicator("bollinger")}
                  className="rounded"
                />
                <span className="font-medium">볼린저 밴드</span>
              </label>
            </div>
            {bollinger.enabled && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">기간</label>
                  <input
                    type="number"
                    value={bollinger.period}
                    onChange={(e) => setBollinger({ period: Number(e.target.value) || 20 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={1}
                    max={100}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">표준편차</label>
                  <input
                    type="number"
                    value={bollinger.stdDev}
                    onChange={(e) => setBollinger({ stdDev: Number(e.target.value) || 2 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={0.5}
                    max={5}
                    step={0.5}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 일목균형표 */}
          <div className="mb-4 rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ichimoku.enabled}
                  onChange={() => toggleIndicator("ichimoku")}
                  className="rounded"
                />
                <span className="font-medium">일목균형표</span>
              </label>
            </div>
            {ichimoku.enabled && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">전환선</label>
                  <input
                    type="number"
                    value={ichimoku.tenkanPeriod}
                    onChange={(e) => setIchimoku({ tenkanPeriod: Number(e.target.value) || 9 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">기준선</label>
                  <input
                    type="number"
                    value={ichimoku.kijunPeriod}
                    onChange={(e) => setIchimoku({ kijunPeriod: Number(e.target.value) || 26 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">선행B</label>
                  <input
                    type="number"
                    value={ichimoku.senkouBPeriod}
                    onChange={(e) => setIchimoku({ senkouBPeriod: Number(e.target.value) || 52 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">이동</label>
                  <input
                    type="number"
                    value={ichimoku.displacement}
                    onChange={(e) => setIchimoku({ displacement: Number(e.target.value) || 26 })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    min={1}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 거래량 */}
          <div className="rounded-md border p-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={volume.enabled}
                onChange={() => toggleIndicator("volume")}
                className="rounded"
              />
              <span className="font-medium">거래량</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
