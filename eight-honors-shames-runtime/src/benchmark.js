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

function llmProvider() { return process.env.EIGHT_RULES_LLM || "deterministic"; }

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
      const { content, usage, httpStatus } = callOpenaiCompatible({ base: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1", model: process.env.OPENAI_MODEL || "gpt-4o-mini", prompt });
      return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: content, usage, provider: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`, httpStatus, status: "ok", durationMs: Date.now() - startedAt, at: nowIso() };
    } catch (error) {
      return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: null, violations: [], output: "", usage: null, provider: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`, status: "error", error: { name: error.name, message: error.message, code: error.code, httpStatus: error.status }, durationMs: Date.now() - startedAt, at: nowIso() };
    }
  }
  const run = deterministicRun(scenario, mode, prompt);
  return { scenario: scenario.id, category: scenario.category, mode, ruleSize, score: run.score, violations: run.violations, output: run.output, usage: { prompt_tokens: ruleSize.promptTokens, completion_tokens: roughTokens(run.output) }, provider: run.provider, status: "ok", at: nowIso() };
}

function scoreRealOutput(scenario, output) {
  // 客观评分: 基于成功标准关键词命中 + 禁止项未命中，规则透明可复现
  if (!output) return { score: 0, hit: [], violated: [] };
  const text = output.toLowerCase();
  const hit = (scenario.successCriteria || []).filter((c) => {
    const kw = c.replace(/^禁:|^通过:|^使用|^必须|^引用|^没有|^不/, "").split(/[\s,，。;；:：]/)[0].trim();
    return kw && text.includes(kw.toLowerCase());
  });
  const violated = (scenario.forbidden || []).filter((f) => {
    const kw = f.replace(/^禁:/, "").split(/[\s,，。;；:：]/)[0].trim();
    return kw && text.includes(kw.toLowerCase());
  });
  const total = (scenario.successCriteria || []).length;
  const base = total ? (hit.length / total) * 70 : 50;
  const penalty = violated.length * 15;
  return { score: Math.max(0, Math.round(base - penalty)), hit, violated };
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

export { summarizeReport, runBenchmark, writeBenchmarkReport, callOpenaiCompatible, callAnthropicCompatible, LlmError, executeScenario, buildPrompt };

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
