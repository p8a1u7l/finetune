import axios from "axios";
import { CFG } from "./config.js";

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number; ct: number };
export type AggTrade = { ts: number; p: number; q: number; m: boolean };
export type Depth = {
  bid: number;
  ask: number;
  spread: number;
  bidDepth: number;
  askDepth: number;
  depthImb: number;
  ts: number;
};

export async function fetchKlines(symbol: string): Promise<Candle[]> {
  const url = `${CFG.binanceBase}/api/v3/klines?symbol=${symbol}&interval=${CFG.interval}&limit=${CFG.limit}`;
  const { data } = await axios.get(url, { timeout: 12000 });
  return data.map((r: any) => ({ t: +r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5], ct: +r[6] }));
}

export async function fetchAggTrades(symbol: string, limit: number = CFG.limit): Promise<AggTrade[]> {
  const url = `${CFG.binanceBase}/api/v3/aggTrades?symbol=${symbol}&limit=${limit}`;
  const { data } = await axios.get(url, { timeout: 12000 });
  return data.map((x: any) => ({ ts: +x.T, p: +x.p, q: +x.q, m: !!x.m }));
}

export async function fetchDepth(symbol: string, limit: number = CFG.depthLimit): Promise<Depth> {
  const url = `${CFG.binanceBase}/api/v3/depth?symbol=${symbol}&limit=${limit}`;
  const { data } = await axios.get(url, { timeout: 10000 });
  const sum = (arr: any[][]) =>
    arr.reduce(
      (acc, [price, qty]) => ({
        px: acc.px + parseFloat(price) * parseFloat(qty),
        q: acc.q + parseFloat(qty),
      }),
      { px: 0, q: 0 }
    );
  const b = sum(data.bids);
  const a = sum(data.asks);
  const bestBid = parseFloat(data.bids?.[0]?.[0] ?? "0");
  const bestAsk = parseFloat(data.asks?.[0]?.[0] ?? "0");
  const spread = bestAsk > 0 && bestBid > 0 ? (bestAsk - bestBid) / ((bestAsk + bestBid) / 2) : 0;
  const bidDepth = b.q;
  const askDepth = a.q;
  const depthImb = bidDepth + askDepth ? bidDepth / (bidDepth + askDepth) : 0.5;
  return { bid: bestBid, ask: bestAsk, spread, bidDepth, askDepth, depthImb, ts: Date.now() };
}
