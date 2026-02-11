import { NextResponse } from "next/server";
import type { Timeframe } from "@/lib/timeframe";
import { isTimeframe } from "@/lib/timeframe";
import { getCandles } from "@/server/kis/market";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const timeframeRaw = url.searchParams.get("timeframe") ?? "1D";
  const countRaw = url.searchParams.get("count") ?? "240";

  if (!code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }

  if (!isTimeframe(timeframeRaw)) {
    return NextResponse.json({ error: "invalid timeframe" }, { status: 400 });
  }

  const count = Number(countRaw);

  const timeframe = timeframeRaw as Timeframe;

  try {
    const candles = await getCandles({
      code,
      timeframe,
      count: Number.isFinite(count) ? count : 240,
    });

    return NextResponse.json({ code, timeframe, candles });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "failed to fetch candles", code, timeframe, message },
      { status: 502 },
    );
  }
}
