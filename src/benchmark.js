import fs from "node:fs";
import path from "node:path";
import { fullInstructions, summarize, rulesVersion, rulesPath } from "../src/core.js";
import { loadEnvFiles, resolveEnvFiles, secretSummary, requiredKeysPresent, rejectIfSecretsInText } from "../src/env.js";
import { withSecret, reportSecrets } from "../src/env.js";

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
    // 用 node 原生 fetch（不用 curl）—— 避免 Windows Git Bash 管道把 UTF-8 中文转成 GBK 乱码
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body,
      signal: controller.signal
    }).then(async (resp) => {
      clearTimeout(timer);
      const httpStatus = resp.status;
      const raw = await resp.text();
      let parsed;
      try { parsed = JSON.parse(raw); } catch { throw new LlmError(`non-JSON response (HTTP ${httpStatus})`, { status: httpStatus, code: "non_json", body: raw.slice(0, 500) }); }
      if (httpStatus < 200 || httpStatus >= 300) {
        const message = parsed?.error?.message || `HTTP ${httpStatus}`;
        throw new LlmError(`LLM HTTP ${httpStatus}: ${message}`, { status: httpStatus, code: parsed?.error?.type || "http_error", body: JSON.stringify(parsed).slice(0, 500) });
      }
      if (parsed?.error) throw new LlmError(`LLM error: ${parsed.error.message || "unknown"}`, { status: httpStatus, code: parsed.error.type || "api_error", body: JSON.stringify(parsed).slice(0, 500) });
      const choice = parsed.choices?.[0];
      if (!choice) throw new LlmError("LLM returned no choices", { status: httpStatus, code: "no_choices", body: JSON.stringify(parsed).slice(0, 500) });
      return { content: choice.message?.content || "", usage: parsed.usage || { prompt_tokens: roughTokens(prompt), completion_tokens: 0 }, httpStatus };
    }).catch((err) => {
      clearTimeout(timer);
      if (err?.name === "AbortError") throw new LlmError(`request aborted after ${timeoutMs}ms`, { code: "timeout" });
      throw err instanceof LlmError ? err : new LlmError(`fetch transport error: ${err.message}`, { code: "transport_error" });
    });
  });
}

function callAnthropicCompatible({ base, model, prompt, timeoutMs = 60000 }) {
  return withSecret("MINIMAX_API_KEY", (apiKey) => {
    if (!apiKey) throw new LlmError("MINIMAX_API_KEY is not set", { code: "missing_api_key" });
    const url = `${base.replace(/\/$/, "")}/v1/messages`;
    const body = JSON.stringify({ model, max_tokens: 2048, messages: [{ role: "user", content: prompt }] });
    // 用 node 原生 fetch（不用 curl）—— 避免 Windows Git Bash 管道把 UTF-8 中文转成 GBK 乱码
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body,
      signal: controller.signal
    }).then(async (resp) => {
      clearTimeout(timer);
      const httpStatus = resp.status;
      const raw = await resp.text();
      let parsed;
      try { parsed = JSON.parse(raw); } catch { throw new LlmError(`non-JSON response (HTTP ${httpStatus})`, { status: httpStatus, code: "non_json", body: raw.slice(0, 500) }); }
      if (httpStatus < 200 || httpStatus >= 300) {
        const message = parsed?.error?.message || `HTTP ${httpStatus}`;
        throw new LlmError(`LLM HTTP ${httpStatus}: ${message}`, { status: httpStatus, code: parsed?.error?.type || "http_error", body: JSON.stringify(parsed).slice(0, 500) });
      }
      if (parsed?.error) throw new LlmError(`LLM error: ${parsed.error.message || "unknown"}`, { status: httpStatus, code: parsed.error.type || "api_error", body: JSON.stringify(parsed).slice(0, 500) });
      const content = parsed.content?.[0]?.text || "";
      if (!content) throw new LlmError("LLM returned no content", { status: httpStatus, code: "no_content", body: JSON.stringify(parsed).slice(0, 500) });
      return { content, usage: parsed.usage || { prompt_tokens: roughTokens(prompt), completion_tokens: 0 }, httpStatus };
    }).catch((err) => {
      clearTimeout(timer);
      if (err?.name === "AbortError") throw new LlmError(`request aborted after ${timeoutMs}ms`, { code: "timeout" });
      throw err instanceof LlmError ? err : new LlmError(`fetch transport error: ${err.message}`, { code: "transport_error" });
    });
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

function llmProvider() { if (process.env.NODE_ENV === "test" || process.env.npm_lifecycle_event === "test") return "deterministic"; return process.env.EIGHT_RULES_LLM || "deterministic"; }

// 允许从 Pi 的 auth.json 读取 MiniMax key，避免把 key 写进 .env / 对话
function loadMinimaxKeyFromPi() {
  if (process.env.MINIMAX_API_KEY) return process.env.MINIMAX_API_KEY;
  try {
    const home = process.env.USERPROFILE || process.env.HOME;
    const auth = JSON.parse(fs.readFileSync(`${home}/.pi/agent/auth.json`, "utf8"));
    const key = auth["minimax-cn"]?.key || auth.minimax;
    if (key && typeof key === "string") return key;
  } catch {}
  return null;
}

async function executeScenario(scenario, mode) {
  const prompt = buildPrompt(scenario, mode);
  const ruleSize = {
    fullInjectedChars: mode === "off" ? 0 : fullInstructions(mode).length,
    summaryChars: summarize(mode).summary.length,
    gates: summarize(mode).gates.length,
    promptChars: prompt.length,
    promptTokens: roughTokens(prompt)
  };
  const provider = llmProvider();
  if (provider === "minimax") {
    const apiKey = loadMinimaxKeyFromPi();
    if (!apiKey) return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: "", usage: null, provider: "minimax:MiniMax-M3", status: "error", error: { name: "LlmError", message: "no MiniMax key available (env MINIMAX_API_KEY or ~/.pi/agent/auth.json)", code: "missing_key" }, at: nowIso() };
    process.env.MINIMAX_API_KEY = apiKey; // 供 withSecret 使用，仅进程内存
    const startedAt = Date.now();
    try {
      const { content, usage, httpStatus } = await callAnthropicCompatible({ base: process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com/anthropic", model: process.env.MINIMAX_MODEL || "MiniMax-M3", prompt });
      const judged = scoreRealOutput(scenario, content);
      return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: judged.score, hit: judged.hit, violated: judged.violated, violations: judged.violated, output: content, usage, provider: `minimax:${process.env.MINIMAX_MODEL || "MiniMax-M3"}`, httpStatus, status: "ok", durationMs: Date.now() - startedAt, at: nowIso() };
    } catch (error) {
      return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: "", usage: null, provider: `minimax:${process.env.MINIMAX_MODEL || "MiniMax-M3"}`, status: "error", error: { name: error.name, message: error.message, code: error.code, httpStatus: error.status }, durationMs: Date.now() - startedAt, at: nowIso() };
    }
  }
  if (provider === "openai") {
    const env = requiredKeysPresent();
    if (!env.present) return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: "", usage: null, provider: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`, status: "error", error: { name: "LlmError", message: `missing env: ${env.missing.join(", ")}`, code: "missing_env" }, at: nowIso() };
    const startedAt = Date.now();
    try {
      const { content, usage, httpStatus } = await callOpenaiCompatible({ base: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1", model: process.env.OPENAI_MODEL || "gpt-4o-mini", prompt });
      return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: content, usage, provider: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`, httpStatus, status: "ok", durationMs: Date.now() - startedAt, at: nowIso() };
    } catch (error) {
      return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: "", usage: null, provider: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`, status: "error", error: { name: error.name, message: error.message, code: error.code, httpStatus: error.status }, durationMs: Date.now() - startedAt, at: nowIso() };
    }
  }
  const run = deterministicRun(scenario, mode, prompt);
  return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: run.score, violations: run.violations, output: run.output, usage: { prompt_tokens: ruleSize.promptTokens, completion_tokens: roughTokens(run.output) }, provider: run.provider, status: "ok", at: nowIso() };
}

// 从描述句中提取核心关键词：取最长 token（具体文件名/依赖名/API 名通常最长）
function extractKeyword(phrase) {
  const cleaned = String(phrase)
    .replace(/^(禁|禁止|不要|避免|不应|不该|别|只|不|没|没有|新引入|新建|忽略|安装|写|打印|返回|直接|不进行|不加|不记录|不写|使用|引用|有|添加|列出|定位|给出|确保|通过)[:：]?/g, "")
    .replace(/^[：:]+/, "")
    .trim();
  const tokens = cleaned.split(/[\s,，。;；:：()（）]+/).filter(Boolean);
  if (!tokens.length) return cleaned;
  // 按长度降序取最长 token；若最长 token 太短(<2)，退回原短语
  const longest = tokens.reduce((a, b) => (b.length > a.length ? b : a), "");
  return longest.length >= 2 ? longest : cleaned;
}

function isNegatedAround(text, index, length) {
  // 看关键词前 12 个字符内是否有否定词
  const before = text.slice(Math.max(0, index - 14), index);
  return NEGATION_PREFIXES.some((w) => before.toLowerCase().includes(w.toLowerCase()));
}

const NEGATION_PREFIXES = ["不要", "禁止", "避免", "不应", "不该", "不能", "不可", "勿", "别", "禁", "不会", "don't", "dont", "should not", "shouldn't", "never", "not", "no "];

function findKeyword(text, kw) {
  const idx = text.indexOf(kw.toLowerCase());
  return idx === -1 ? null : idx;
}

function scoreRealOutput(scenario, output) {
  // 客观评分：成功标准关键词命中 + 禁止项“实际使用”（非声明）检测
  if (!output) return { score: 0, hit: [], violated: [], completed: false };
  const text = output.toLowerCase();
  const hasCodeBlock = /```/.test(output);

  // 成功标准：提取核心关键词匹配
  const hit = (scenario.successCriteria || []).filter((c) => {
    const kw = extractKeyword(c);
    return kw && findKeyword(text, kw) !== null;
  });

  // 禁止项：核心词出现且不是“声明不要做”
  const violated = (scenario.forbidden || []).filter((f) => {
    const kw = extractKeyword(f);
    if (!kw) return false;
    const idx = findKeyword(text, kw);
    if (idx === null) return false;
    return !isNegatedAround(text, idx, kw.length); // 前面有“不要/避免”= 声明，不算违规
  });

  const total = (scenario.successCriteria || []).length;
  const base = total ? (hit.length / total) * 70 : 50;
  const completion = hasCodeBlock ? 15 : 0; // 有代码块=给了实现，加分
  const penalty = violated.length * 20;
  return { score: Math.max(0, Math.round(base + completion - penalty)), hit, violated, completed: hasCodeBlock };
}

async function runBenchmark(scenarios, modes = MODES) {
  const results = [];
  for (const mode of modes) {
    for (const scenario of scenarios) {
      results.push(await executeScenario(scenario, mode));
    }
  }
  return results;
}

function writeBenchmarkReport(results, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ version: 3, generatedAt: nowIso(), results }, null, 2)}\n`);
  return file;
}

export { summarizeReport, runBenchmark, writeBenchmarkReport, callOpenaiCompatible, callAnthropicCompatible, LlmError, executeScenario, buildPrompt, scoreRealOutput };

function usageTokens(usage) {
  if (!usage) return { prompt: 0, completion: 0 };
  return {
    prompt: usage.prompt_tokens ?? usage.input_tokens ?? 0,
    completion: usage.completion_tokens ?? usage.output_tokens ?? 0
  };
}

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
      const { prompt, completion } = usageTokens(r.usage);
      v.promptTokens += prompt || r.ruleSize?.promptTokens || 0;
      v.completionTokens += completion;
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
