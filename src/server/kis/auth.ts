import "server-only";

import { getKisConfig } from "@/server/kis/config";
import type { KisAccessToken } from "@/server/kis/types";
import { loadCachedToken, saveCachedToken } from "@/server/kis/token-store";

const REFRESH_SKEW_MS = 60_000; // refresh 60s early

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  access_token_token_expired?: string;
};

function parseExpiredAt(v?: string): number | null {
  if (!v) return null;
  // expected: "YYYY-MM-DD HH:mm:ss"
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})\s*$/.exec(v);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss] = m;
  // KIS returns KST time; store as epoch ms using Asia/Seoul offset (+09:00)
  const iso = `${y}-${mo}-${d}T${hh}:${mm}:${ss}+09:00`;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

async function issueAccessToken(): Promise<KisAccessToken> {
  const cfg = getKisConfig();
  if (!cfg.appKey || !cfg.appSecret) {
    throw new Error("KIS credentials are missing (KIS_APP_KEY / KIS_APP_SECRET)");
  }

  const url = `${cfg.baseUrl}/oauth2/tokenP`;
  const issuedAt = Date.now();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: cfg.appKey,
      appsecret: cfg.appSecret,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KIS token issuance failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = (await res.json()) as TokenResponse;

  const expiresAtFromStr = parseExpiredAt(json.access_token_token_expired);
  const expiresAt =
    expiresAtFromStr ??
    (typeof json.expires_in === "number"
      ? issuedAt + json.expires_in * 1000
      : issuedAt + 24 * 60 * 60 * 1000);

  const token: KisAccessToken = {
    accessToken: json.access_token,
    tokenType: json.token_type ?? "Bearer",
    expiresAt,
    issuedAt,
    raw: json,
  };

  await saveCachedToken(token);
  return token;
}

export async function getAccessToken(): Promise<KisAccessToken> {
  const cfg = getKisConfig();
  if (!cfg.enabled) {
    throw new Error("KIS is disabled (missing env or forced mock)");
  }

  const cached = await loadCachedToken();
  if (cached && cached.expiresAt - REFRESH_SKEW_MS > Date.now()) return cached;

  return issueAccessToken();
}
