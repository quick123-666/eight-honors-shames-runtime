import { readLatestRules, rulesVersion } from "./config.js";

export const MODES = Object.freeze(["lite", "full", "ultra", "off"]);
export const DEFAULT_MODE = "full";

export function normalizeMode(value) {
  const mode = String(value ?? "").trim().toLowerCase();
  return MODES.includes(mode) ? mode : null;
}

export function resolveMode(value, fallback = DEFAULT_MODE) {
  return normalizeMode(value) ?? normalizeMode(fallback) ?? DEFAULT_MODE;
}

const LITE = [
  "先查阅再调用接口，不凭猜测编造 API。",
  "先对齐需求，主动列出假设和边界。",
  "优先复用现有能力，避免重复造轮子。",
  "修改后必须验证，安全、错误处理和数据保护不可删。"
];

const GATES = {
  lite: [],
  full: [
    "门禁：执行前必须查阅已有代码；执行后必须验证。",
    "门禁：不得跳过校验、错误处理或回滚点。",
    "门禁：交付前必须运行 /rules accept。"
  ],
  ultra: [
    "门禁：执行前必须查阅已有代码；执行后必须验证。",
    "门禁：不得跳过校验、错误处理或回滚点。",
    "门禁：交付前必须运行 /rules accept，并执行测试、构建和回滚演练。",
    "门禁：发现未知项或风险时必须主动列假设，不得硬编。"
  ],
  off: []
};

export function summarize(mode = DEFAULT_MODE) {
  const resolved = resolveMode(mode);
  const version = rulesVersion();
  if (resolved === "off") return { mode: "off", summary: "八荣八耻运行时已关闭。", gates: [], version };
  if (resolved === "lite") return { mode: "lite", summary: [`当前八荣八耻模式：lite`, `规则来源：${version.file}（${version.principles} 条准则）`, "执行顺序：先查、对齐、复用、验证、贴规范，再修改。", ...LITE].join("\n"), gates: GATES.lite, version };
  return { mode: resolved, summary: [`当前八荣八耻模式：${resolved}`, `规则来源：${version.file}（${version.principles} 条准则，来源 ${version.source}）`, "按需使用 /rules audit 拉取完整规则，不要假定 Agent 已记住全文。"].join("\n"), gates: GATES[resolved], version };
}

export function fullInstructions(mode = DEFAULT_MODE) {
  const resolved = resolveMode(mode);
  if (resolved === "off") return "八荣八耻运行时已关闭。";
  const latest = readLatestRules();
  if (!latest) throw new Error("RULES.md 不可读；禁止硬编旧版全文。");
  return latest;
}

export function buildInstructions(mode = DEFAULT_MODE, options = {}) {
  const { forceFull = false } = options;
  if (forceFull) return fullInstructions(mode);
  return summarize(mode).summary;
}
