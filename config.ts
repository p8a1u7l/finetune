import "dotenv/config";

export const CFG = {
  symbols: (process.env.SYMBOLS ?? "BTCUSDT")
    .split(",")
    .map((s: string) => s.trim())
    .filter((s): s is string => s.length > 0),
  interval: process.env.INTERVAL ?? "1m",
  limit: parseInt(process.env.LIMIT ?? "1000", 10),
  outDir: process.env.OUT_DIR ?? "out",
  binanceBase: process.env.BINANCE_BASE ?? "https://api.binance.com",
  depthLimit: parseInt(process.env.DEPTH_LIMIT ?? "5", 10),
  vpWindow: parseInt(process.env.VP_WINDOW ?? "240", 10),
  rsiPeriod: parseInt(process.env.RSI_PERIOD ?? "14", 10),
  ema: [
    parseInt(process.env.EMA_1 ?? "25", 10),
    parseInt(process.env.EMA_2 ?? "50", 10),
    parseInt(process.env.EMA_3 ?? "100", 10),
  ],
  atrPeriod: parseInt(process.env.ATR_PERIOD ?? "22", 10),
  augPerSample: parseInt(process.env.AUG_PER_SAMPLE ?? "2", 10),
  negativeRatio: Math.max(0, Math.min(1, parseFloat(process.env.NEGATIVE_RATIO ?? "0.15"))),
  valRatio: Math.max(0.01, Math.min(0.5, parseFloat(process.env.VAL_RATIO ?? "0.1"))),
} as const;
