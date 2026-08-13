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
// 兼容老格式:| **v3.2.0** | + 准则 ... | 26 条 | 已发布 |
// 跳过 chrono 行(第 2 列是 **YYYY-MM-DD**)
export function parseHistoryTable(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    // 先检查是否 chrono 行(第 2 列是日期)— 跳过
    if (/^\|\s*\*\*v\d+\.\d+\.\d+\*\*\s*\|\s*\*\*\d{4}-\d{2}-\d{2}\*\*/.test(line)) continue;
    // 必须 | **vX.Y.Z** | 开头,避免匹配 marker 行
    const m = line.match(/^\|\s*\*\*v(\d+\.\d+\.\d+)\*\*\s*\|/);
    if (!m) continue;
    const rest = line.slice(m[0].length);
    const kindMatch = rest.match(/\b(MINOR|PATCH|MAJOR)\b/);
    rows.push({ version: `v${m[1]}`, kind: kindMatch ? kindMatch[1] : "UNKNOWN", line });
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

// ===== 自动修复(D3 critical) =====

// 按 SemVer 比较版本号
function cmpSemver(a, b) {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

// 从 RULES-TREE.md 提取 RULE 标题(从 ### 行往后读,直到下一个 ### / ## / ---)
function readRuleBody(rtText, lineNumber) {
  const lines = rtText.split("\n");
  const start = Math.max(0, lineNumber - 1);
  let body = lines[start] || "";
  for (let i = start + 1; i < Math.min(lines.length, start + 8); i += 1) {
    if (/^###\s/.test(lines[i]) || /^##\s/.test(lines[i]) || /^---$/.test(lines[i])) break;
    body += "\n" + lines[i];
  }
  return body;
}

// 从 RULE 标题提取 KIND
function extractKind(body) {
  const m = body.match(/(?:MINOR|PATCH|MAJOR|PATCH\s+沉积)/);
  return m ? m[0].replace(/\s+沉积$/, "") : "PATCH";
}

// 从 RULE 标题提取一句话标题(### RULE-X(... vX.Y.Z KIND 沉淀 — <TITLE>))
function extractTitle(body) {
  const m = body.match(/沉淀\s*[—\-]\s*([^)\n]+)/);
  if (m) return m[1].trim();
  return body.split("\n")[0].replace(/^###\s+/, "").slice(0, 80);
}

// 从 RULE body 提取一句话触发场景(作为 row 补充信息)
function extractTrigger(body) {
  const m = body.match(/\*\*触发(?:场景)?\*\*[::]\s*([^\n*]+)/);
  return m ? m[1].trim() : "";
}

// 生成一个历史表行(保守:不强行重排,只追加在表格末尾)
function buildHistoryRow(rule, body) {
  const kind = extractKind(body);
  const title = extractTitle(body);
  const trigger = extractTrigger(body).slice(0, 60);
  return `| **${rule.version}** | **${kind}: 沉淀 ${rule.rule} — ${title.replace(/[*]/g, "")}** — auto-added by \`check-version-drift.js --fix\`(RULES-TREE.md L${rule.line})${trigger ? `; ${trigger.replace(/[*]/g, "")}` : ""} | **28 条**(不变) | 已归档 |`;
}

// 生成 chrono 表行
function buildChronoRow(rule, body) {
  const kind = extractKind(body);
  const title = extractTitle(body);
  const dateMatch = body.match(/\((\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
  return `| **${rule.version}** | **${date}** | **${kind}: 沉淀 ${rule.rule} — ${title.replace(/[*]/g, "").slice(0, 60)}** — auto-added from RULES-TREE.md L${rule.line} | \`(无 /\_recycle\_bin 备份; 脚本追溯)\` |`;
}

// 在历史表中插入新行(保持表头与表尾不变,中间行重排为 semver 排序)
export function buildFixedRvText(rvText, allRules) {
  const lines = rvText.split("\n");

  // 找历史表范围:`## 二、` 到下一个 `##` 或文件尾
  let historyStart = -1, historyEnd = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^## 二、/.test(lines[i])) {
      historyStart = i;
      // 找下一个 ## 或 ---
      for (let j = i + 1; j < lines.length; j += 1) {
        if (/^## /.test(lines[j]) || /^---$/.test(lines[j]) || /^[#]{2,3}\s+三/.test(lines[j])) {
          historyEnd = j;
          break;
        }
      }
      break;
    }
  }
  if (historyStart < 0 || historyEnd < 0) {
    return { text: rvText, added: 0, error: "can't find history table section" };
  }

  // 提取历史表的所有现有行(包括表头 + 分隔线)— 兼容老格式
  const headerSection = lines.slice(historyStart, historyEnd);
  const existingDataRows = headerSection.filter((l) => /^\|\s*\*\*v\d+\.\d+\.\d+\*\*\s*\|/.test(l));

  // 合并现有 + 新规则 + 去重
  const rulesForVersions = allRules.filter((r) => !existingDataRows.some((row) => row.includes(`**${r.version}**`)));
  const newRows = rulesForVersions.map((r) => ({ version: r.version, row: buildHistoryRow(r, readRuleBody(r.ruleText || "", r.line)) }));

  // 合并 + 排序(升序)
  const allRows = [...existingDataRows, ...newRows.map((n) => n.row)].sort((a, b) => {
    const va = (a.match(/\*\*v(\d+\.\d+\.\d+)\*\*/) || [])[1] || "0.0.0";
    const vb = (b.match(/\*\*v(\d+\.\d+\.\d+)\*\*/) || [])[1] || "0.0.0";
    return cmpSemver(va, vb);
  });

  // 重建历史表 section:保留 header (historyStart+1 ~ header 末尾 + 分隔线) + 数据行 + ...
  const headerLines = headerSection.slice(0, 2);  // ## 标题 + 表头行
  // 找最后一条分隔线(常见格式: `|---|---|---|---|`)
  const sepLines = headerSection.filter((l) => /^\|[-\s|]+\|$/.test(l));
  const sepLine = sepLines[sepLines.length - 1] || "|---|---|---|---|";
  const rebuiltSection = [...headerLines, sepLine, ...allRows];

  // 替换原 section
  const newLines = [...lines.slice(0, historyStart), ...rebuiltSection, ...lines.slice(historyEnd)];

  return {
    text: newLines.join("\n"),
    added: newRows.length,
    versions: newRows.map((n) => n.version)
  };
}

// ===== 入口 =====

function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes("--fix");
  const dryRun = args.includes("--dry-run");
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

  if (fixMode && !dryRun) {
    // 在 fix 模式下,同时给 rules 配 ruleText 供 buildFixedRvText 使用
    const rulesWithText = result.rules.map((r) => ({ ...r, ruleText: rtText }));
    const fixed = buildFixedRvText(rvText, rulesWithText);
    if (fixed.error) {
      console.error(`✖ --fix failed: ${fixed.error}`);
      process.exit(2);
    }
    fs.writeFileSync(rvPath, fixed.text);
    console.log(`[fix] RULES-VERSION.md 已更新:`);
    console.log(`  - 添加 ${fixed.added} 行: ${fixed.versions.join(", ")}`);
    // 重新检测
    const reText = fs.readFileSync(rvPath, "utf8");
    const reResult = detectDrifts({ rvText: reText, rtText });
    console.log(`  - 修复后漂移:`);
    console.log(renderReport(reResult));
    const blocking = reResult.drifts.filter((d) => d.severity === "critical" || d.severity === "warn");
    process.exit(blocking.length ? 1 : 0);
  }

  console.log(renderReport(result));
  if (fixMode && dryRun) {
    // 仅打印预览,不写文件
    const rulesWithText = result.rules.map((r) => ({ ...r, ruleText: rtText }));
    const fixed = buildFixedRvText(rvText, rulesWithText);
    console.log(`\n[dry-run] 预览 (不会写文件):会添加 ${fixed.added || 0} 行到 RULES-VERSION.md 历史表`);
    if (fixed.added > 0) {
      const d3Rules = result.rules.filter((r) => !result.historyVersions.includes(r.version));
      console.log(`  待插入版本: ${[...new Set(d3Rules.map((r) => r.version))].sort((a, b) => cmpSemver(a, b)).join(", ")}`);
    }
    console.log(`  跑真实修复:去掉 --dry-run 参数`);
  }
  const blocking = drifts.filter((d) => d.severity === "critical" || d.severity === "warn");
  process.exit(blocking.length ? 1 : 0);
}

// 只在直接调用时跑;被 import 时不跑(测试)
const isMain = process.argv[1] && path.basename(process.argv[1]) === "check-version-drift.js";
if (isMain) main();
