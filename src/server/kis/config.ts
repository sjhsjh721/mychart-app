import "server-only";

export type KisMode = "real" | "virtual";

export type KisConfig = {
  enabled: boolean;
  mode: KisMode;
  baseUrl: string;
  appKey?: string;
  appSecret?: string;
  forceMock: boolean;
};

const REAL_BASE_URL = "https://openapi.koreainvestment.com:9443";
const VIRTUAL_BASE_URL = "https://openapivts.koreainvestment.com:29443";

export function getKisConfig(): KisConfig {
  const mode = (process.env.KIS_MODE === "real" ? "real" : "virtual") satisfies KisMode;
  const baseUrl = process.env.KIS_BASE_URL ?? (mode === "real" ? REAL_BASE_URL : VIRTUAL_BASE_URL);

  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;

  const forceMock = process.env.KIS_MOCK === "true";
  const enabled = Boolean(appKey && appSecret) && !forceMock;

  return {
    enabled,
    mode,
    baseUrl,
    appKey,
    appSecret,
    forceMock,
  };
}
