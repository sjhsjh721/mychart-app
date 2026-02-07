export type KisAccessToken = {
  accessToken: string;
  tokenType: string;
  /** epoch millis */
  expiresAt: number;
  /** epoch millis */
  issuedAt: number;
  raw: unknown;
};

export type KisStock = {
  code: string;
  name: string;
  market?: string;
};

export type KisCandle = {
  /** lightweight-charts UTCTimestamp (seconds) */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type KisQuote = {
  code: string;
  name?: string;
  price: number;
  change?: number;
  changeRate?: number;
  time?: string;
  raw?: unknown;
};
