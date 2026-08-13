// tests for scripts/check-version-drift.js — RULES-VERSION 漂移检测器
// 跑法: node --test tests/check-version-drift.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readTopMarker, parseHistoryTable, parseChronologicalTable,
  parseRuleVersions, detectDrifts
} from "../scripts/check-version-drift.js";

// ===== 解析器单元测试 =====

test("readTopMarker 解析标准 v3.4.6 格式", () => {
  const text = "> **当前版本**:**v3.4.6**(2026-08-13)\n> **上一版本**:v3.4.5\n";
  const r = readTopMarker(text);
  assert.equal(r.current, "v3.4.6");
  assert.equal(r.previous, "v3.4.5");
});

test("readTopMarker 兼容全中文标点", () => {
  const text = "**当前版本**：**v3.2.0**(2026-08-11)\n**上一版本**：v3.1.9\n";
  const r = readTopMarker(text);
  assert.equal(r.current, "v3.2.0");
  assert.equal(r.previous, "v3.1.9");
});

test("readTopMarker 缺失字段返回 null(防御)", () => {
  const r = readTopMarker("# rules\n");
  assert.equal(r.current, null);
  assert.equal(r.previous, null);
});

test("parseHistoryTable 解析 MINOR/PATCH/MAJOR 行", () => {
  const text = `| **v3.4.6** | **MINOR:方法树 daemon 三件套 + 持久化 + 同步** — | **28 条**(不变) | **当前最新** |
| **v3.4.5** | **MINOR: 方法树重新绑定 + 八荣八耻 daemon** — | **28 条**(不变) | 已归档 |
| **v3.4.4** | **MINOR: 双层 skill 架构** — | **28 条**(不变) | 已 revert |`;
  const rows = parseHistoryTable(text);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].version, "v3.4.6");
  assert.equal(rows[0].kind, "MINOR");
  assert.equal(rows[1].version, "v3.4.5");
  assert.equal(rows[2].version, "v3.4.4");
});

test("parseHistoryTable 跳过 marker 行(无 **MINOR/PATCH/MAJOR** 开头)", () => {
  const text = "> **当前版本**:**v3.4.6**(2026-08-13)\n| **v3.4.6** | **MINOR: ...** — | **28 条** | 当前最新 |";
  const rows = parseHistoryTable(text);
  assert.equal(rows.length, 1, "marker 行不应被误识为版本行");
  assert.equal(rows[0].version, "v3.4.6");
});

test("parseChronologicalTable 解析日期列", () => {
  const text = `| **v3.4.6** | **2026-08-13** | **MINOR: ...** | \`_recycle_bin/20260813-163300/\` |
| **v3.4.5** | **2026-08-13** | **MINOR: ...** | \`_recycle_bin/20260813-161935/\` |`;
  const rows = parseChronologicalTable(text);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].version, "v3.4.6");
  assert.equal(rows[0].date, "2026-08-13");
  assert.equal(rows[1].version, "v3.4.5");
});

test("parseRuleVersions 捕获 ### RULE 行的版本号 + 行号", () => {
  const text = `## 沉淀
### RULE-LOOP-006(2026-08-13 v3.4.6 PATCH 沉淀 — 大语料 sparse 改造)
### RULE-LOOP-007(2026-08-13 v3.4.7 PATCH 沉淀 — chat.py stdin 编码修复)
### RULE-LOOP-008(2026-08-13 v3.4.8 PATCH 沉淀 — thinking 段规则引用)
### RULE-EIGHT-RULES-DAEMON-001(2026-08-13 v3.4.5 MINOR 沉淀 — 八荣八耻持续注入)
### 不是 RULE 开头的标题`;
  const rules = parseRuleVersions(text);
  assert.equal(rules.length, 4);
  assert.equal(rules[0].rule, "RULE-LOOP-006");
  assert.equal(rules[0].version, "v3.4.6");
  assert.equal(rules[0].line, 2);
  assert.equal(rules[3].rule, "RULE-EIGHT-RULES-DAEMON-001");
  assert.equal(rules[3].version, "v3.4.5");
});

// ===== detectDrifts 集成测试 =====

test("detectDrifts 干净状态:三表+marker+RULEs 全对齐", () => {
  const rvText = `> **当前版本**:**v3.4.6**(2026-08-13)
> **上一版本**:v3.4.5

## 二、当前版本对照表

| **v3.4.4** | **MINOR: 双层 skill 架构** — ... | **28 条** | 已发布 |
| **v3.4.5** | **MINOR: 方法树重新绑定 + daemon** — ... | **28 条** | 已归档 |
| **v3.4.6** | **MINOR: 方法树 daemon 复用 + 持久化** — ... | **28 条** | **当前最新** |

## 三、归档

| **v3.4.4** | **2026-08-13** | **MINOR: 双层 skill** | \`recycle/...\`
| **v3.4.5** | **2026-08-13** | **MINOR: 方法树重新绑定 + daemon** | \`recycle/...\`
| **v3.4.6** | **2026-08-13** | **MINOR: 方法树 daemon 复用 + 持久化** | \`recycle/...\`
`;

  const rtText = `### RULE-X-001(2026-08-13 v3.4.6 MINOR 沉淀 — foo)
### RULE-Y-001(2026-08-13 v3.4.5 PATCH 沉淀 — bar)
### RULE-Z-001(2026-08-13 v3.4.4 MINOR 沉淀 — baz)
`;

  const result = detectDrifts({ rvText, rtText });
  // 只可能有 D4 孤儿:顶部 marker 说的 previous 是 v3.4.5,历史表倒数第二是 v3.4.5 ✓,current=v3.4.6 与末行 ✓
  // D3 没有(v3.4.4/5/6 全在 history 表)
  // D4 没有(history 三个版本都被 RULEs 声称)
  const d3 = result.drifts.filter((d) => d.type === "D3_rule_version_missing");
  const d1 = result.drifts.filter((d) => d.type === "D1_top_current_mismatch");
  assert.equal(d1.length, 0, "D1 不应有");
  assert.equal(d3.length, 0, "D3 不应有(三个 RULE 版本都在 history 表)");
});

test("detectDrifts D1 顶部当前版本 ≠ 历史表末行", () => {
  const rvText = `> **当前版本**:**v3.4.5**(2026-08-13)
> **上一版本**:v3.4.4

| **v3.4.4** | **MINOR: foo** — | **28 条** | 已发布 |
| **v3.4.5** | **MINOR: bar** — | **28 条** | 已归档 |
| **v3.4.6** | **MINOR: baz** — | **28 条** | **当前最新** |`;
  const rtText = "";
  const result = detectDrifts({ rvText, rtText });
  const d1 = result.drifts.find((d) => d.type === "D1_top_current_mismatch");
  assert.ok(d1, "应检测到 D1");
  assert.match(d1.detail, /v3.4.5/);
  assert.match(d1.detail, /v3.4.6/);
});

test("detectDrifts D3 RULE 声称版本在历史表找不到", () => {
  const rvText = `> **当前版本**:**v3.4.5**(2026-08-13)
| **v3.4.5** | **MINOR: foo** — | **28 条** | **当前最新** |`;
  const rtText = `## 沉淀

### RULE-A-001(2026-08-13 v3.4.7 PATCH 沉淀 — leaky)
### RULE-B-001(2026-08-13 v3.4.5 MINOR 沉淀 — aligned)
`;
  const result = detectDrifts({ rvText, rtText });
  const d3s = result.drifts.filter((d) => d.type === "D3_rule_version_missing");
  assert.equal(d3s.length, 1);
  assert.match(d3s[0].where, /L3/, "where 应包含 RULE-A-001 所在的行号 L3");
  assert.match(d3s[0].detail, /RULE-A-001/);
  assert.match(d3s[0].detail, /v3.4.7/);
});

test("detectDrifts D4 历史表有版本但 RULES-TREE 无 RULE 声称", () => {
  const rvText = `> **当前版本**:**v3.4.6**(2026-08-13)
| **v3.4.5** | **MINOR: a** — | **28 条** | 已归档 |
| **v3.4.6** | **MINOR: b** — | **28 条** | **当前最新** |`;
  const rtText = `### RULE-ONLY-346(2026-08-13 v3.4.6 MINOR 沉淀 — 仅此一条)`;
  const result = detectDrifts({ rvText, rtText });
  const d4s = result.drifts.filter((d) => d.type === "D4_orphan_version");
  assert.equal(d4s.length, 1);
  assert.match(d4s[0].detail, /v3.4.5/);
});

test("detectDrifts 严重级别:critical 漂移使 exit=1,warn 也使 exit=1,info 仅 warn", () => {
  // top.current=v3.4.6 但 history 末行 v3.4.5 → D1 (critical)
  // top.previous=v3.4.0 但 history 倒数第二 v3.4.4 → D2 (warn)
  // history 有 v3.4.0/4 但 RULES-TREE 没 RULE 声称 → D4 (info)
  const rvText = `> **当前版本**:**v3.4.6**(2026-08-13)
> **上一版本**:v3.4.0
| **v3.4.0** | **MINOR: old** — | **28 条** | 已发布 |
| **v3.4.4** | **MINOR: middle** — | **28 条** | 已发布 |
| **v3.4.5** | **MINOR: bar** — | **28 条** | 已归档 |`;
  const rtText = "";
  const result = detectDrifts({ rvText, rtText });
  // D1 current mismatch (critical) + D2 previous mismatch (warn) + D4 v3.4.0/4 orphans (info)
  const crit = result.drifts.filter((d) => d.severity === "critical").length;
  const warn = result.drifts.filter((d) => d.severity === "warn").length;
  const info = result.drifts.filter((d) => d.severity === "info").length;
  assert.ok(crit >= 1, "应有 critical 漂移(D1 top.current mismatch)");
  assert.ok(warn >= 1, "应有 warn 漂移(D2 top.previous mismatch)");
  assert.ok(info >= 1, "应有 info 漂移(D4 孤儿)");
});
