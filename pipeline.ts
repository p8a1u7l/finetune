import { fetchKlines, fetchAggTrades, fetchDepth } from "./binance.js";
import { computeCVD } from "./orderflow.js";
import { enrich, decide, Enriched, Decision } from "./logic.js";
import { CFG } from "./config.js";

function mapTradesToWindow(
  trades: ReturnType<typeof computeCVD>["series"],
  start: number,
  end: number,
) {
  const cut = trades.filter((t) => t.ts >= start && t.ts <= end);
  if (!cut.length) return { ofRatio: 1, buy: 0, sell: 0 };
  const last = cut[cut.length - 1];
  const buy = last.buy;
  const sell = last.sell;
  const ofRatio = sell > 0 ? buy / sell : buy > 0 ? Infinity : 1;
  return { ofRatio, buy, sell };
}

export async function buildForSymbol(symbol: string) {
  const candles = await fetchKlines(symbol);
  const trades = await fetchAggTrades(symbol, Math.min(CFG.limit * 5, 5000));
  const depth = await fetchDepth(symbol);

  const of = computeCVD(trades);
  const enriched = enrich(candles, CFG.vpWindow, [CFG.ema[0], CFG.ema[1], CFG.ema[2]], CFG.rsiPeriod, CFG.atrPeriod);

  const items: { x: Enriched; d: Decision; ctx: { ofRatio: number; spread: number; depthImb: number } }[] = [];
  for (const x of enriched) {
    if (!isFinite(x.ema1) || !isFinite(x.rsi) || !isFinite(x.vah)) continue;
    const ctxOF = mapTradesToWindow(of.series, x.t, x.ct);
    const d = decide(x, ctxOF.ofRatio, depth.spread, depth.depthImb);
    items.push({ x, d, ctx: { ofRatio: ctxOF.ofRatio, spread: depth.spread, depthImb: depth.depthImb } });
  }
  return items;
}
