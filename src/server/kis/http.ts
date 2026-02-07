import "server-only";

import { getKisConfig } from "@/server/kis/config";
import { getAccessToken } from "@/server/kis/auth";

type KisErrorResponse = {
  rt_cd?: string;
  msg_cd?: string;
  msg1?: string;
};

export type KisRequestOptions = {
  path: string;
  trId: string;
  params?: Record<string, string | number | undefined>;
  method?: "GET" | "POST";
  body?: unknown;
};

export async function kisRequest<T>(opts: KisRequestOptions): Promise<T> {
  const cfg = getKisConfig();
  if (!cfg.enabled) {
    throw new Error("KIS is disabled");
  }
  if (!cfg.appKey || !cfg.appSecret) {
    throw new Error("KIS credentials missing");
  }

  const token = await getAccessToken();

  const url = new URL(cfg.baseUrl + opts.path);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      authorization: `${token.tokenType} ${token.accessToken}`,
      appkey: cfg.appKey,
      appsecret: cfg.appSecret,
      tr_id: opts.trId,
      custtype: "P",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KIS request failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = (await res.json()) as unknown;
  const maybeErr = json as KisErrorResponse;
  if (maybeErr && typeof maybeErr === "object" && maybeErr.rt_cd && maybeErr.rt_cd !== "0") {
    throw new Error(
      `KIS error rt_cd=${maybeErr.rt_cd} msg_cd=${maybeErr.msg_cd} msg1=${maybeErr.msg1}`,
    );
  }

  return json as T;
}
