import { NextResponse } from "next/server";
import { searchStocks } from "@/server/kis/market";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "20");

  if (!query.trim()) return NextResponse.json({ stocks: [] });

  const stocks = await searchStocks(query);
  return NextResponse.json({ stocks: stocks.slice(0, Number.isFinite(limit) ? limit : 20) });
}
