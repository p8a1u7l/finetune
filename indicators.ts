export type Series = number[];

export function ema(values: Series, period: number): Series {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const out = [values[0]];
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}

export function rsi(closes: Series, period: number): Series {
  if (closes.length <= period) return new Array(closes.length).fill(NaN);
  const r: number[] = new Array(closes.length).fill(NaN);
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let rs = gain / (loss || 1e-9);
  r[period] = 100 - 100 / (1 + rs);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) {
      gain = (gain * (period - 1) + d) / period;
      loss = (loss * (period - 1) + 0) / period;
    } else {
      gain = (gain * (period - 1) + 0) / period;
      loss = (loss * (period - 1) + -d) / period;
    }
    rs = gain / (loss || 1e-9);
    r[i] = 100 - 100 / (1 + rs);
  }
  return r;
}

export function atr(h: Series, l: Series, c: Series, period: number): Series {
  const tr: number[] = new Array(h.length).fill(NaN);
  for (let i = 1; i < h.length; i++) {
    tr[i] = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]));
  }
  const out = new Array(h.length).fill(NaN);
  let sum = 0;
  for (let i = 1; i <= period; i++) sum += tr[i] ?? 0;
  out[period] = sum / period;
  for (let i = period + 1; i < tr.length; i++) {
    sum = out[i - 1] * period - out[i - 1] + tr[i];
    out[i] = sum / period;
  }
  return out;
}

export function rollingVolumeProfile(prices: Series, vols: Series, win: number, buckets: number = 64) {
  const N = prices.length;
  const vah = new Array<number>(N).fill(NaN);
  const val = new Array<number>(N).fill(NaN);
  const poc = new Array<number>(N).fill(NaN);
  for (let t = win - 1; t < N; t++) {
    const p = prices.slice(t - win + 1, t + 1);
    const v = vols.slice(t - win + 1, t + 1);
    const lo = Math.min(...p);
    const hi = Math.max(...p);
    const step = ((hi - lo) / (buckets || 1)) || 1e-9;
    const hist = new Array<number>(buckets).fill(0);
    for (let i = 0; i < p.length; i++) {
      const idx = Math.max(0, Math.min(buckets - 1, Math.floor((p[i] - lo) / step)));
      hist[idx] += v[i];
    }
    const total = hist.reduce((a, b) => a + b, 0);
    let pocIdx = 0;
    for (let i = 1; i < hist.length; i++) if (hist[i] > hist[pocIdx]) pocIdx = i;
    const target = total * 0.7;
    let acc = hist[pocIdx];
    let L = pocIdx;
    let R = pocIdx;
    while (acc < target && (L > 0 || R < buckets - 1)) {
      const left = L > 0 ? hist[L - 1] : -1;
      const right = R < buckets - 1 ? hist[R + 1] : -1;
      if (right >= left) {
        R++;
        acc += hist[R];
      } else {
        L--;
        acc += hist[L];
      }
    }
    val[t] = lo + L * step;
    vah[t] = lo + R * step;
    poc[t] = lo + pocIdx * step;
  }
  return { vah, val, poc };
}

export function detectFVG(high: Series, low: Series) {
  const N = high.length;
  const has = new Array<number>(N).fill(0);
  const size = new Array<number>(N).fill(0);
  for (let t = 2; t < N; t++) {
    const c1h = high[t - 2];
    const c3l = low[t];
    const c1l = low[t - 2];
    const c3h = high[t];
    const bull = c1h < c3l;
    const bear = c1l > c3h;
    if (bull) {
      has[t] = 1;
      size[t] = Math.abs(c3l - c1h);
    } else if (bear) {
      has[t] = 1;
      size[t] = Math.abs(c1l - c3h);
    }
  }
  return { has, size };
}
