import fs from "fs";
import path from "path";
import { Enriched, Decision } from "./logic.js";
import { describeNL, makeNegative } from "./augment.js";
import { CFG } from "./config.js";

type Msg = { role: "system" | "user" | "assistant"; content: string };
type Row = { messages: Msg[] };

function sysPrompt() {
  return `You are a crypto scalping assistant for Binance spot markets.
Rules:
- Answer in concise Korean suitable for execution.
- Provide structured reasoning fields, not step-by-step chain-of-thought.
- Output must recommend entry/exit/risk succinctly when a setup exists.`;
}

export function toRows(
  symbol: string,
  items: { x: Enriched; d: Decision; ctx: { ofRatio: number; spread: number; depthImb: number } }[],
): Row[] {
  const rows: Row[] = [];
  for (const it of items) {
    const user = `${symbol} ${it.x.t} 1m 시황: EMA(${it.x.ema1.toFixed(2)},${it.x.ema2.toFixed(2)},${it.x.ema3.toFixed(2)}), RSI ${it.x.rsi.toFixed(1)}, ATR ${it.x.atr.toFixed(2)}, VP[VH=${it.x.vah.toFixed(2)},VL=${it.x.val.toFixed(2)},POC=${it.x.poc.toFixed(2)}], FVG ${it.x.fvg ? `yes(${it.x.fvgSize.toFixed(2)})` : "no"}, OF ratio ${it.ctx.ofRatio.toFixed(2)}, spread ${(it.ctx.spread * 10000).toFixed(1)}bp, depthImb ${(it.ctx.depthImb * 100).toFixed(0)}%. 판단은?`;
    const assistantObj = {
      label: it.d.label,
      confidence: Math.round(it.d.confidence * 100) / 100,
      reasons: it.d.reasons.slice(0, 4),
      action: it.d.action,
    };
    const assistantText = JSON.stringify(assistantObj);
    rows.push({
      messages: [
        { role: "system", content: sysPrompt() },
        { role: "user", content: user },
        { role: "assistant", content: assistantText },
      ],
    });
    for (let k = 0; k < CFG.augPerSample; k++) {
      const desc = describeNL(it.x, it.d);
      rows.push({
        messages: [
          { role: "system", content: sysPrompt() },
          { role: "user", content: `${symbol} 1m 상황 설명 및 트레이드 가이드` },
          { role: "assistant", content: desc },
        ],
      });
    }
    if (Math.random() < CFG.negativeRatio) {
      const neg = makeNegative(it.x, it.d);
      rows.push({
        messages: [
          { role: "system", content: sysPrompt() },
          { role: "user", content: neg.user },
          { role: "assistant", content: neg.assistant },
        ],
      });
    }
  }
  return rows;
}

export function writeJsonl(filePath: string, rows: Row[]) {
  const lines = rows.map((r) => JSON.stringify(r));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, lines.join("\n"));
}
