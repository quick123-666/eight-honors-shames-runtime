import { runBenchmark, writeBenchmarkReport, summarizeReport } from "../src/benchmark.js";
import { resolveEnvFiles, loadEnvFiles, requiredKeysPresent, secretSummary } from "../src/env.js";
import { rulesVersion, rulesPath } from "../src/core.js";
import fs from "node:fs";
import path from "node:path";

loadEnvFiles(resolveEnvFiles());
const MODES = ["baseline", "lite", "full", "ultra"];
const scenarios = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../benchmarks/scenarios/scenarios.json"), "utf8"));
const provider = process.env.EIGHT_RULES_LLM || "deterministic";
console.log(`# benchmark provider: ${provider}`);
console.log(`# rules: ${rulesPath} (${rulesVersion().principles} 条, 来源 ${rulesVersion().source})`);
console.log(`# scenarios: ${scenarios.length}  modes: ${MODES.join(", ")}`);
if (provider === "openai") {
  const env = requiredKeysPresent();
  console.log(`# env check: ${env.present ? "ok" : `missing: ${env.missing.join(", ")}`}`);
  console.log(`# secret summary: ${JSON.stringify(secretSummary())}`);
}
console.log("");
const results = runBenchmark(scenarios, MODES);
const file = writeBenchmarkReport(results, path.join(import.meta.dirname, "../benchmarks/reports/latest.json"));
const summary = summarizeReport(results);
console.log("## 总览");
console.log("| mode | 场景数 | 成功 | 失败 | 平均分 | prompt tok | completion tok | 违规 |");
console.log("|---|---:|---:|---:|---:|---:|---:|---:|");
for (const [mode, value] of Object.entries(summary)) {
  console.log(`| ${mode} | ${value.count} | ${value.ok} | ${value.error} | ${value.avgScore} | ${value.totalPromptTokens} | ${value.totalCompletionTokens} | ${value.violations} |`);
}
const errorModes = Object.entries(summary).filter(([, v]) => v.error > 0);
if (errorModes.length) {
  console.log("");
  console.log("## 错误归类");
  for (const [mode, v] of errorModes) {
    const entries = Object.entries(v.errors).map(([code, n]) => `${code}=${n}`).join(", ");
    console.log(`- ${mode}: ${entries}`);
  }
}
console.log("");
const baseline = summary.baseline;
if (baseline && baseline.ok > 0) {
  console.log("## 对比 baseline（仅当 baseline 成功 ≥1 时输出）");
  for (const [mode, value] of Object.entries(summary)) {
    if (mode === "baseline") continue;
    if (!value.ok) { console.log(`- ${mode}: 全部 ${value.error} 次调用失败，跳过对比`); continue; }
    const scoreDelta = (parseFloat(value.avgScore) - parseFloat(baseline.avgScore)).toFixed(1);
    const tokenDelta = value.totalPromptTokens + value.totalCompletionTokens - (baseline.totalPromptTokens + baseline.totalCompletionTokens);
    const violationDelta = value.violations - baseline.violations;
    console.log(`- ${mode} vs baseline: 分数 ${scoreDelta >= 0 ? "+" : ""}${scoreDelta}  total tok ${tokenDelta >= 0 ? "+" : ""}${tokenDelta}  违规 ${violationDelta >= 0 ? "+" : ""}${violationDelta}`);
  }
} else {
  console.log("## 对比 baseline: 跳过（baseline 调用全部失败，看 errors 表）");
}
console.log("");
console.log(`# 报告: ${file}`);
console.log(`# 错误样例:`);
const errorSample = results.find((r) => r.status === "error");
if (errorSample) console.log(JSON.stringify(errorSample, null, 2));
else console.log("(无错误)");
