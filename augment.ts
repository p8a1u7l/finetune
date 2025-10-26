import { Decision, Enriched } from "./logic.js";
import { CFG } from "./config.js";

const T_LONG = [
  (x: Enriched) =>
    `EMA 정배열( ${x.ema1.toFixed(2)} > ${x.ema2.toFixed(2)} > ${x.ema3.toFixed(2)} ), RSI ${x.rsi.toFixed(1)}로 강세. VAH 상향 돌파. 매수 관점.`,
  (x: Enriched) => `추세 상방(EMA up), RSI ${x.rsi.toFixed(1)}. VAH 위에서 체결, FVG 또는 OF 우위 동반 시 매수 유리.`,
  (x: Enriched) => `상승 모멘텀 유지: 가격이 VAH 위, RSI ${x.rsi.toFixed(1)}. 재테스트 매수 대기.`,
];
const T_SHORT = [
  (x: Enriched) =>
    `EMA 역배열( ${x.ema1.toFixed(2)} < ${x.ema2.toFixed(2)} < ${x.ema3.toFixed(2)} ), RSI ${x.rsi.toFixed(1)} 약세. VAL 하향 돌파. 매도 관점.`,
  (x: Enriched) => `하락 추세(EMA down), RSI ${x.rsi.toFixed(1)}. VAL 아래 체결, FVG- 또는 OF 매도 우위 시 공략.`,
  (x: Enriched) => `하방 모멘텀: 가격이 VAL 아래, RSI ${x.rsi.toFixed(1)}. 되돌림 후 매도 진입 검토.`,
];
const T_NEUT = [
  (x: Enriched) => `가치영역 내부 등락. RSI ${x.rsi.toFixed(1)} 중립. 명확한 엣지 부재.`,
  (x: Enriched) => `횡보: VA 안, RSI 중앙대. 평균 회귀 우세하나 확신 낮음.`,
  (_x: Enriched) => `방향성 모호. 추세 신호 대기.`,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function describeNL(x: Enriched, d: Decision): string {
  if (d.label === "LONG") return pick(T_LONG)(x);
  if (d.label === "SHORT") return pick(T_SHORT)(x);
  return pick(T_NEUT)(x);
}

export function makeNegative(x: Enriched, d: Decision): { user: string; assistant: string } {
  if (d.label === "LONG") {
    return {
      user: `현재 ${x.c.toFixed(2)}이며 EMA 하락세로 보이는지 판단해줘.`,
      assistant: `EMA 역배열이며 VAL 하향 돌파 중이라 매도 관점.`,
    };
  }
  if (d.label === "SHORT") {
    return {
      user: `가격 반등 신호가 있는지 확인해줘.`,
      assistant: `EMA 정배열과 VAH 상향 돌파로 매수 관점.`,
    };
  }
  return {
    user: `방향성이 모호한가?`,
    assistant: `강한 추세 돌파로 즉시 진입해야 함.`,
  };
}
