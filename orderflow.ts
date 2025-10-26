import { AggTrade } from "./binance.js";

export function computeCVD(trades: AggTrade[]) {
  let cvd = 0;
  const arr: { ts: number; cvd: number; buy: number; sell: number }[] = [];
  let buy = 0;
  let sell = 0;
  for (const t of trades) {
    if (t.m) {
      sell += t.q;
      cvd -= t.q;
    } else {
      buy += t.q;
      cvd += t.q;
    }
    arr.push({ ts: t.ts, cvd, buy, sell });
  }
  const ratio = sell > 0 ? buy / sell : buy > 0 ? Infinity : 1;
  return { series: arr, ofRatio: ratio, buy, sell };
}
