import { fullInstructions, summarize } from "../src/rules.js";

function roughTokens(text) {
  if (!text) return 0;
  const value = String(text);
  const cjk = (value.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g) || []).length;
  const other = value.length - cjk;
  return Math.ceil(cjk * 1.5 + other * 0.3);
}
function roughTokensOfCharCount(n) { return roughTokens("x".repeat(n)); }

function pct(num, den) { return den ? (100 * num / den).toFixed(1) + "%" : "n/a"; }
function round(n) { return Math.round(n); }

const TURN_BREAKDOWN = { session: 1, initialAgent: 1, followUps: 10 };
const scenarios = ["lite", "full", "ultra", "off"];
const summaries = scenarios.map((mode) => ({ mode, summary: summarize(mode), full: mode === "off" ? "" : fullInstructions(mode) }));

const totalTurns = TURN_BREAKDOWN.session + TURN_BREAKDOWN.initialAgent + TURN_BREAKDOWN.followUps;
const fullOnce = TURN_BREAKDOWN.session + TURN_BREAKDOWN.initialAgent;
const perTurnFollowing = TURN_BREAKDOWN.followUps;

console.log(`# Token 注入实测 (估算器: 中文 1.5 tok/字 + 其它 0.3 tok/字节)`);
console.log(`# 假设: 1 次 session_start + 1 次 before_agent_start + ${TURN_BREAKDOWN.followUps} 轮后续 before_agent_start = ${totalTurns} 次注入`);
console.log("");
console.log("| mode | 旧每轮 B | 新每轮 B | 旧累计 tok | 新累计 tok | 节省 | 旧持续 | 新持续 |");
console.log("|---|---:|---:|---:|---:|---:|---:|---:|");

for (const entry of summaries) {
  if (entry.mode === "off") {
    console.log(`| off | 0 | 0 | 0 | 0 | 100% | 0 B | 0 B |`);
    continue;
  }
  const summary = entry.summary.summary + (entry.summary.gates.length ? "\n" + entry.summary.gates.join("\n") : "");
  const oldPerTurn = entry.full;
  const newPerTurn = summary;
  const oldTotalChars = oldPerTurn.length * totalTurns;
  const newTotalChars = entry.full.length * fullOnce + newPerTurn.length * perTurnFollowing;
  const oldTotalTok = roughTokensOfCharCount(oldTotalChars);
  const newTotalTok = roughTokensOfCharCount(newTotalChars);
  const saving = pct(oldTotalChars - newTotalChars, oldTotalChars);
  console.log(`| ${entry.mode} | ${oldPerTurn.length} | ${newPerTurn.length} | ${oldTotalTok} | ${newTotalTok} | ${saving} | ${oldTotalChars} | ${newTotalChars} |`);
}

console.log("");
console.log("## 长期会话估算 (100 轮)");
for (const entry of summaries) {
  if (entry.mode === "off") { console.log(`- off: 0 B / 0 tok`); continue; }
  const summary = entry.summary.summary + (entry.summary.gates.length ? "\n" + entry.summary.gates.join("\n") : "");
  const oldChars = entry.full.length * 100;
  const newChars = entry.full.length + summary.length * 99;
  console.log(`- ${entry.mode}: 旧 ${roughTokensOfCharCount(oldChars)} tok  新 ${roughTokensOfCharCount(newChars)} tok  节省 ${pct(oldChars - newChars, oldChars)}`);
}
