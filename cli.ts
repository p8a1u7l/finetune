import fs from "fs";
import path from "path";
import { CFG } from "./config.js";
import { buildForSymbol } from "./pipeline.js";
import { toRows, writeJsonl } from "./jsonl.js";

const cmd = process.argv[2] ?? "all";

async function gen() {
  const allRows: { sym: string; count: number }[] = [];
  for (const sym of CFG.symbols) {
    console.log(`[gen] ${sym} ...`);
    const items = await buildForSymbol(sym);
    const rows = toRows(sym, items);
    const file = path.join(CFG.outDir, `${sym}_raw.jsonl`);
    writeJsonl(file, rows);
    console.log(`  -> ${file} (${rows.length} lines)`);
    allRows.push({ sym, count: rows.length });
  }
  console.log(`[gen] done:`, allRows);
}

function split() {
  const files = fs.existsSync(CFG.outDir)
    ? fs.readdirSync(CFG.outDir).filter((f) => f.endsWith("_raw.jsonl"))
    : [];
  let lines: string[] = [];
  for (const f of files) {
    const content = fs.readFileSync(path.join(CFG.outDir, f), "utf-8");
    lines = lines.concat(content.trim().split("\n").filter(Boolean));
  }
  const N = lines.length;
  const valN = Math.floor(N * CFG.valRatio);
  const shuffled = lines
    .map((s) => ({ s, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.s);
  const val = shuffled.slice(0, valN);
  const train = shuffled.slice(valN);
  if (!fs.existsSync(CFG.outDir)) fs.mkdirSync(CFG.outDir, { recursive: true });
  fs.writeFileSync(path.join(CFG.outDir, "train.jsonl"), train.join("\n"));
  fs.writeFileSync(path.join(CFG.outDir, "val.jsonl"), val.join("\n"));
  console.log(`[split] train=${train.length} val=${val.length}`);
}

(async () => {
  if (cmd === "gen") await gen();
  else if (cmd === "split") split();
  else if (cmd === "all") {
    await gen();
    split();
  } else {
    console.log("usage: node dist/cli.js [gen|split|all]");
  }
})();
