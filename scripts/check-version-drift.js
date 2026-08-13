#!/usr/bin/env node
// 八荣八耻 RULES-VERSION.md 自动版本漂移检测脚本(v3.4.6 配套)
// 沉淀:RULE-VERSION-DRIFT-CHECK-001
// 用途:任何 MINOR/PATCH 升级后跑一次,确保 RULES-VERSION.md 三表 + 顶部 marker +
//      RULES-TREE.md 中所有 RULE 声称的版本都对得上。
// 检测 4 类漂移:
//   D1 顶部 当前版本 ≠ 历史表末行
//   D2 顶部 上一版本 ≠ 历史表倒数第二行
//   D3 某个 RULE 在 RULES-TREE.md 声称 vX.Y.Z,但 RULES-VERSION.md 历史表找不到
//   D4 历史表有某版本,但 RULES-TREE.md 中没有 RULE 声称该版本(孤儿版本)
// 跑法:node scripts/check-version-drift.js
// CI friendly:exit 0 干净 / exit 1 有漂移
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const VERSION_RE = /v(\d+)\.(\d+)\.(\d+)/;

// ===== 解析器(导出供测试)=====

export function readTopMarker(text) {
  // 容许多种写法:**v3.X.Y** 或 v3.X.Y 或 vX.Y.Z
  const cur = text.match(/\*\*当前版本\*\*[:：]?\s*\*?\*?v?(\d+\.\d+\.\d+)/);
  const prev = text.match(/\*\*上一版本\*\*[:：]?\s*\*?\*?v?(\d+\.\d+\.\d+)/);
  return { current: cur ? `v${cur[1]}` : null, previous: prev ? `v${prev[1]}` : null };
}

// 历史表行:| **v3.4.5** | <KIND>: ... | **28 条** | <状态> |
export function parseHistoryTable(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    // 必须 | **vX.Y.Z** | 开头,避免匹配 marker 行
    const m = line.match(/^\|\s*\*\*v(\d+\.\d+\.\d+)\*\*\s*\|\s*\*\*(MINOR|PATCH|MAJOR)/);
    if (m) rows.push({ version: `v${m[1]}`, kind: m[2], line });
  }
  return rows;
}

// 时间序表行:| **v3.4.6** | **2026-08-13** | ...
export function parseChronologicalTable(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\|\s*\*\*v(\d+\.\d+\.\d+)\*\*\s*\|\s*\*\*(\d{4}-\d{2}-\d{2})\*\*/);
    if (m) rows.push({ version: `v${m[1]}`, date: m[2], line });
  }
  return rows;
}

// RULES-TREE.md 中 ### RULE-XXX(... vX.Y.Z <KIND> 沉淀 — ...) 行
export function parseRuleVersions(text) {
  const rules = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^###\s+(RULE-[A-Z0-9-]+).*?v(\d+\.\d+\.\d+)/);
    if (m) rules.push({ rule: m[1], version: `v${m[2]}`, line: i + 1 });
  }
  return rules;
}

// ===== 漂移检测 =====

export function detectDrifts({ rvText, rtText, rvPath = "RULES-VERSION.md", rtPath = "RULES-TREE.md" }) {
  const top = readTopMarker(rvText);
  const history = parseHistoryTable(rvText);
  const chrono = parseChronologicalTable(rvText);
  const rules = parseRuleVersions(rtText);

  const historyVersions = history.map((h) => h.version);
  const chronoVersions = chrono.map((c) => c.version);
  const ruleVersions = Array.from(new Set(rules.map((r) => r.version))).sort();
  const knownVersions = new Set(historyVersions);

  const drifts = [];

  // D1 + D2 顶部 marker ↔ 历史表末行
  const last = historyVersions[historyVersions.length - 1];
  const prev = historyVersions[historyVersions.length - 2];
  if (top.current && last && top.current !== last) {
    drifts.push({
      type: "D1_top_current_mismatch",
      severity: "critical",
      where: `${rvPath}:header(当前版本)`,
      detail: `顶部当前版本 ${top.current} ≠ 历史表末行 ${last}`,
      fix: `把 ${rvPath} L5 「当前版本」改为 **${last}**`
    });
  }
  if (top.previous && prev && top.previous !== prev) {
    drifts.push({
      type: "D2_top_previous_mismatch",
      severity: "warn",
      where: `${rvPath}:header(上一版本)`,
      detail: `顶部上一版本 ${top.previous} ≠ 历史表倒数第二行 ${prev}`,
      fix: `把 ${rvPath} L6 「上一版本」改为 **${prev}**`
    });
  }

  // D3 RULE 声称的版本在历史表找不到
  for (const r of rules) {
    if (!knownVersions.has(r.version)) {
      drifts.push({
        type: "D3_rule_version_missing",
        severity: "critical",
        where: `${rtPath}:L${r.line}`,
        detail: `${r.rule} 声称 ${r.version} 沉淀,但 RULES-VERSION.md 历史表无此版本`,
        fix: `${rvPath} 加 ${r.version} 行 (对应 ${r.rule} 沉淀内容)`
      });
    }
  }

  // D4 历史表有版本但 RULES-TREE.md 没有 RULE 声称(孤儿)
  const ruleSet = new Set(ruleVersions);
  for (const v of historyVersions) {
    if (!ruleSet.has(v)) {
      drifts.push({
        type: "D4_orphan_version",
        severity: "info",
        where: `${rvPath}:history`,
        detail: `${v} 在历史表存在,但 RULES-TREE.md 无 RULE 声称该版本(可能纯配置文件变更)`,
        fix: `若无新 RULE,这是 OK;若有 RULE 漏写版本声明,请补 ${v}`
      });
    }
  }

  return {
    top, historyVersions, chronoVersions, ruleVersions,
    rules, history, chrono, drifts
  };
}

// ===== CLI 渲染 =====

function renderReport(result) {
  const { top, historyVersions, chronoVersions, ruleVersions, drifts, rules } = result;
  const lines = [
    "┌─────────────────────────────────────────────────────────────",
    "│ 八荣八耻 RULES-VERSION 版本漂移检测 (v3.4.6 · RULE-VERSION-DRIFT-CHECK-001)",
    "├─────────────────────────────────────────────────────────────",
    `│ Top marker     : current=${top.current || "(none)"} previous=${top.previous || "(none)"}`,
    `│ History table  : ${historyVersions.length} 行 [${historyVersions.join(", ")}]`,
    `│ Chrono table   : ${chronoVersions.length} 行 [${chronoVersions.join(", ")}]`,
    `│ RULEs claimed  : ${rules.length} 个 RULE 涉及 ${ruleVersions.length} 个版本 [${ruleVersions.join(", ")}]`,
    `│ Drift count    : ${drifts.length} ${drifts.length === 0 ? "✅ 干净" : "✖ 有漂移"}`,
    "├─────────────────────────────────────────────────────────────"
  ];
  if (!drifts.length) {
    lines.push("│ ✅ No drift detected. CI green.");
  } else {
    lines.push("│ DRIFTS:");
    drifts.forEach((d, i) => {
      const sev = d.severity === "critical" ? "🔴" : d.severity === "warn" ? "🟡" : "🔵";
      lines.push(`│  ${sev} [${d.type}] ${d.where}`);
      lines.push(`│     ${d.detail}`);
      lines.push(`│     → fix: ${d.fix}`);
      if (i < drifts.length - 1) lines.push(`│  ─────`);
    });
  }
  lines.push("└─────────────────────────────────────────────────────────────");
  return lines.join("\n");
}

// ===== 入口 =====

function main() {
  const cwd = process.cwd();
  const rvPath = path.join(cwd, "RULES-VERSION.md");
  const rtPath = path.join(cwd, "RULES-TREE.md");
  if (!fs.existsSync(rvPath) || !fs.existsSync(rtPath)) {
    console.error(`✖ missing required files:\n  - ${rvPath} ${fs.existsSync(rvPath) ? "✓" : "MISSING"}\n  - ${rtPath} ${fs.existsSync(rtPath) ? "✓" : "MISSING"}`);
    process.exit(2);
  }
  const rvText = fs.readFileSync(rvPath, "utf8");
  const rtText = fs.readFileSync(rtPath, "utf8");
  const result = detectDrifts({ rvText, rtText });
  const drifts = result.drifts;
  console.log(renderReport(result));
  // exit:critical/warn 漂移 → 1,info 漂移 → 0,干净 → 0
  const blocking = drifts.filter((d) => d.severity === "critical" || d.severity === "warn");
  process.exit(blocking.length ? 1 : 0);
}

// 只在直接调用时跑;被 import 时不跑(测试)
const isMain = process.argv[1] && path.basename(process.argv[1]) === "check-version-drift.js";
if (isMain) main();
