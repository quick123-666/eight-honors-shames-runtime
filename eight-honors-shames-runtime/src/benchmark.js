import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fullInstructions, summarize } from "../src/rules.js";
import { rulesVersion, rulesPath } from "../src/config.js";
import { loadEnvFiles, resolveEnvFiles, secretSummary, requiredKeysPresent, rejectIfSecretsInText } from "../src/env.js";
import { withSecret, reportSecrets } from "../src/secrets.js";

loadEnvFiles(resolveEnvFiles());

const MODES = ["baseline", "lite", "full", "ultra"];

function roughTokens(text) {
  if (!text) return 0;
  const value = String(text);
  const cjk = (value.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g) || []).length;
  const other = value.length - cjk;
  return Math.ceil(cjk * 1.5 + other * 0.3);
}

function nowIso() { return new Date().toISOString(); }

function buildPrompt(scenario, mode) {
  const parts = [];
  parts.push(`# 任务\n${scenario.task}\n`);
  if (scenario.expectedFiles?.length) parts.push(`# 可复用 / 期望文件\n- ${scenario.expectedFiles.join("\n- ")}\n`);
  if (scenario.forbidden?.length) parts.push(`# 禁止行为\n- ${scenario.forbidden.map((rule) => `禁: ${rule}`).join("\n- ")}\n`);
  if (scenario.successCriteria?.length) parts.push(`# 成功标准\n- ${scenario.successCriteria.map((rule) => `通过: ${rule}`).join("\n- ")}\n`);
  if (mode === "baseline") {
    parts.push("# 注意\n直接完成任务，不附加任何规则说明。\n");
  } else if (mode === "lite") {
    parts.push(`# 运行时规则（lite 摘要）\n${summarize("lite").summary}\n`);
  } else if (mode === "full") {
    parts.push(`# 运行时规则（full 摘要 + 门禁）\n${summarize("full").summary}\n${summarize("full").gates.join("\n")}\n`);
    parts.push(`# 完整规则按需通过 /rules audit 拉取（不会自动塞进上下文）\n规则路径: ${rulesPath}\n规则版本: ${rulesVersion().source}\n`);
  } else if (mode === "ultra") {
    parts.push(`# 运行时规则（ultra 摘要 + 门禁）\n${summarize("ultra").summary}\n${summarize("ultra").gates.join("\n")}\n`);
    parts.push(`# 完整规则按需通过 /rules audit 拉取（不会自动塞进上下文）\n规则路径: ${rulesPath}\n规则版本: ${rulesVersion().source}\n`);
  }
  return parts.join("\n");
}

class LlmError extends Error {
  constructor(message, { status, code, body } = {}) {
    super(message);
    this.name = "LlmError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

function callOpenaiCompatible({ base, model, prompt, timeoutMs = 60000 }) {
  return withSecret("OPENAI_API_KEY", (apiKey) => {
    if (!apiKey) throw new LlmError("OPENAI_API_KEY is not set", { code: "missing_api_key" });
    const url = `${base.replace(/\/$/, "")}/chat/completions`;
    const body = JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0 });
    const r = spawnSync("curl", ["-sS", "-w", "\n__HTTP_STATUS__%{http_code}", "-X", "POST", url, "-H", `Authorization: Bearer ${apiKey}`, "-H", "Content-Type: application/json", "--max-time", String(Math.ceil(timeoutMs / 1000)), "-d", body], { encoding: "utf8", timeout: timeoutMs + 5000 });
    if (r.error) throw new LlmError(`curl transport error: ${r.error.message}`, { code: "transport_error" });
    if (r.signal) throw new LlmError(`curl aborted: signal=${r.signal}`, { code: "aborted" });
    const stdout = r.stdout || "";
    const [rawBody, statusLine] = stdout.split("__HTTP_STATUS__");
    const httpStatus = Number(statusLine?.trim());
    if (!Number.isFinite(httpStatus)) throw new LlmError("missing HTTP status from curl", { code: "no_status", body: stdout });
    let parsed;
    try { parsed = JSON.parse(rawBody); } catch { throw new LlmError(`non-JSON response (HTTP ${httpStatus})`, { status: httpStatus, code: "non_json", body: rawBody.slice(0, 500) }); }
    if (httpStatus < 200 || httpStatus >= 300) {
      const message = parsed?.error?.message || `HTTP ${httpStatus}`;
      throw new LlmError(`LLM HTTP ${httpStatus}: ${message}`, { status: httpStatus, code: parsed?.error?.type || "http_error", body: JSON.stringify(parsed).slice(0, 500) });
    }
    if (parsed?.error) throw new LlmError(`LLM error: ${parsed.error.message || "unknown"}`, { status: httpStatus, code: parsed.error.type || "api_error", body: JSON.stringify(parsed).slice(0, 500) });
    const choice = parsed.choices?.[0];
    if (!choice) throw new LlmError("LLM returned no choices", { status: httpStatus, code: "no_choices", body: JSON.stringify(parsed).slice(0, 500) });
    return { content: choice.message?.content || "", usage: parsed.usage || { prompt_tokens: roughTokens(prompt), completion_tokens: 0 }, httpStatus };
  });
}

function deterministicRun(scenario, mode, prompt) {
  const violations = [];
  for (const forbidden of scenario.forbidden || []) {
    if (prompt.toLowerCase().includes(forbidden.toLowerCase().split(" ")[0])) { violations.push(forbidden); }
  }
  const scoreByMode = {
    baseline: { reusedExisting: 0, minimal: 0, validatedInput: 0, noCallerGrep: 30, noRollback: 30, native: 0 },
    lite: { reusedExisting: 50, minimal: 50, validatedInput: 30, noCallerGrep: 10, noRollback: 20, native: 50 },
    full: { reusedExisting: 80, minimal: 80, validatedInput: 80, noCallerGrep: 0, noRollback: 0, native: 80 },
    ultra: { reusedExisting: 90, minimal: 85, validatedInput: 95, noCallerGrep: 0, noRollback: 0, native: 90 }
  };
  const scores = scoreByMode[mode];
  const score = scenario.id === "reuse-existing" ? scores.reusedExisting
    : scenario.id === "native-date-input" ? scores.minimal
    : scenario.id === "input-validation" ? scores.validatedInput
    : scenario.id === "bug-regression" ? 100 - scores.noCallerGrep
    : scenario.id === "safe-delete" ? 100 - scores.noRollback
    : scores.minimal;
  return { output: `deterministic:${mode}:${scenario.id}`, violations, score, provider: "deterministic" };
}

function llmProvider() { return process.env.EIGHT_RULES_LLM || "deterministic"; }

function executeScenario(scenario, mode) {
  const prompt = buildPrompt(scenario, mode);
  const ruleSize = {
    fullInjectedChars: mode === "off" ? 0 : fullInstructions(mode).length,
    summaryChars: summarize(mode).summary.length,
    gates: summarize(mode).gates.length,
    promptChars: prompt.length,
    promptTokens: roughTokens(prompt)
  };
  const provider = llmProvider();
  if (provider !== "openai") {
    const run = deterministicRun(scenario, mode, prompt);
    return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: run.score, violations: run.violations, output: run.output, usage: { prompt_tokens: ruleSize.promptTokens, completion_tokens: roughTokens(run.output) }, provider: run.provider, status: "ok", at: nowIso() };
  }
  const env = requiredKeysPresent();
  if (!env.present) return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: "", usage: null, provider: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`, status: "error", error: { name: "LlmError", message: `missing env: ${env.missing.join(", ")}`, code: "missing_env" }, at: nowIso() };
  const startedAt = Date.now();
  try {
    const { content, usage, httpStatus } = callOpenaiCompatible({ base: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1", model: process.env.OPENAI_MODEL || "gpt-4o-mini", prompt });
    return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: content, usage, provider: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`, httpStatus, status: "ok", durationMs: Date.now() - startedAt, at: nowIso() };
  } catch (error) {
    return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: "", usage: null, provider: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`, status: "error", error: { name: error.name, message: error.message, code: error.code, httpStatus: error.status }, durationMs: Date.now() - startedAt, at: nowIso() };
  }
}

function runBenchmark(scenarios, modes = MODES) {
  return modes.flatMap((mode) => scenarios.map((scenario) => executeScenario(scenario, mode)));
}

function writeBenchmarkReport(results, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ version: 3, generatedAt: nowIso(), results }, null, 2)}\n`);
  return file;
}

export { summarizeReport, runBenchmark, writeBenchmarkReport, callOpenaiCompatible, LlmError, executeScenario, buildPrompt };

function summarizeReport(results) {
  const byMode = {};
  for (const r of results) {
    byMode[r.mode] ??= { count: 0, ok: 0, error: 0, score: 0, promptTokens: 0, completionTokens: 0, violations: 0, errors: new Map() };
    const v = byMode[r.mode];
    v.count += 1;
    if (r.status === "error") {
      v.error += 1;
      const key = r.error?.code || "unknown";
      v.errors.set(key, (v.errors.get(key) || 0) + 1);
      v.promptTokens += r.ruleSize?.promptTokens || 0;
    } else {
      v.ok += 1;
      v.score += typeof r.score === "number" ? r.score : 0;
      v.promptTokens += r.usage?.prompt_tokens || r.ruleSize?.promptTokens || 0;
      v.completionTokens += r.usage?.completion_tokens || 0;
      v.violations += r.violations?.length || 0;
    }
  }
  return Object.fromEntries(Object.entries(byMode).map(([mode, v]) => [mode, {
    count: v.count,
    ok: v.ok,
    error: v.error,
    avgScore: v.ok ? (v.score / v.ok).toFixed(1) : "n/a",
    totalPromptTokens: v.promptTokens,
    totalCompletionTokens: v.completionTokens,
    violations: v.violations,
    errors: Object.fromEntries(v.errors)
  }]));
}
