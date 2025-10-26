import { Candle } from "./binance.js";
import { ema, rsi, atr, rollingVolumeProfile, detectFVG } from "./indicators.js";

export type Enriched = Candle & {
  ema1: number;
  ema2: number;
  ema3: number;
  rsi: number;
  atr: number;
  vah: number;
  val: number;
  poc: number;
  fvg: number;
  fvgSize: number;
};

export type Decision = {
  label: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  reasons: string[];
  action: { entry: string; exit: string; risk: string; hold: string };
};

export function enrich(
  candles: Candle[],
  vpWin: number,
  emaP: [number, number, number],
  rsiP: number,
  atrP: number,
): Enriched[] {
  const close = candles.map((x) => x.c);
  const high = candles.map((x) => x.h);
  const low = candles.map((x) => x.l);
  const vol = candles.map((x) => x.v);
  const e1 = ema(close, emaP[0]);
  const e2 = ema(close, emaP[1]);
  const e3 = ema(close, emaP[2]);
  const r = rsi(close, rsiP);
  const a = atr(high, low, close, atrP);
  const vp = rollingVolumeProfile(close, vol, vpWin, 64);
  const fvg = detectFVG(high, low);
  const out: Enriched[] = candles.map((c, i) => ({
    ...c,
    ema1: e1[i] ?? NaN,
    ema2: e2[i] ?? NaN,
    ema3: e3[i] ?? NaN,
    rsi: r[i] ?? NaN,
    atr: a[i] ?? NaN,
    vah: vp.vah[i] ?? NaN,
    val: vp.val[i] ?? NaN,
    poc: vp.poc[i] ?? NaN,
    fvg: fvg.has[i] ?? 0,
    fvgSize: fvg.size[i] ?? 0,
  }));
  return out;
}

export function decide(x: Enriched, ofRatio: number, spread: number, depthImb: number): Decision {
  const bull = x.ema1 > x.ema2 && x.ema2 > x.ema3 && x.c > x.ema1;
  const bear = x.ema1 < x.ema2 && x.ema2 < x.ema3 && x.c < x.ema1;
  const aboveVAH = x.c > x.vah;
  const belowVAL = x.c < x.val;
  const insideVA = x.c < x.vah && x.c > x.val;
  const strongOF = ofRatio >= 2.0;
  const tightSpread = spread <= 0.0002;
  const depthBiasBull = depthImb >= 0.6;
  const depthBiasBear = depthImb <= 0.4;

  if (
    bull &&
    aboveVAH &&
    (strongOF || (x.fvg === 1 && x.fvgSize >= (x.atr || 0) * 0.2)) &&
    x.rsi >= 52 &&
    tightSpread &&
    depthBiasBull
  ) {
    return {
      label: "LONG",
      confidence: 0.82,
      reasons: [
        "EMA 정배열 & 가격>EMA",
        "VAH 상방 돌파",
        strongOF ? "오더플로우 매수 우위" : "FVG(+)",
        `RSI=${x.rsi.toFixed(1)}≥52`,
        "스프레드 타이트",
        "심도 매수편향",
      ],
      action: {
        entry: "돌파 레벨/VAH 재테스트에서 부분 진입",
        exit: "1차 1:2~1:3R 부분익절, POC/이전 고점에서 잔량 트레일",
        risk: "직전 스윙저점 또는 ATR×0.5 손절, BE 이동",
        hold: "≤150초 또는 ≤3캔들",
      },
    };
  }

  if (
    bear &&
    belowVAL &&
    (strongOF || (x.fvg === 1 && x.fvgSize >= (x.atr || 0) * 0.2)) &&
    x.rsi <= 48 &&
    tightSpread &&
    depthBiasBear
  ) {
    return {
      label: "SHORT",
      confidence: 0.82,
      reasons: [
        "EMA 역배열 & 가격<EMA",
        "VAL 하방 돌파",
        strongOF ? "오더플로우 매도 우위" : "FVG(-)",
        `RSI=${x.rsi.toFixed(1)}≤48`,
        "스프레드 타이트",
        "심도 매도편향",
      ],
      action: {
        entry: "돌파 레벨/VAL 재테스트에서 부분 진입",
        exit: "1차 1:2~1:3R 부분익절, POC/이전 저점에서 트레일",
        risk: "최근 스윙고점 또는 ATR×0.5 손절",
        hold: "≤150초 또는 ≤3캔들",
      },
    };
  }

  if (insideVA && x.rsi >= 45 && x.rsi <= 55) {
    return {
      label: "NEUTRAL",
      confidence: 0.65,
      reasons: ["VA 내 등락", "RSI 중앙대(45~55)", "평균회귀 우세"],
      action: {
        entry: "VAL/VAH 페이크아웃 후 복귀 시 반대방향 소량 진입",
        exit: "POC 도달 시 청산",
        risk: "급격한 OF 우위 발생 시 무효",
        hold: "≤120초",
      },
    };
  }

  return {
    label: "NEUTRAL",
    confidence: 0.4,
    reasons: ["명확한 엣지 없음"],
    action: { entry: "대기", exit: "대기", risk: "대기", hold: "-" },
  };
}
