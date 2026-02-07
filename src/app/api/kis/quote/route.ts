import { NextResponse } from "next/server";
import { getQuote } from "@/server/kis/market";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";

  if (!code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }

  const quote = await getQuote(code);
  return NextResponse.json({ quote });
}
