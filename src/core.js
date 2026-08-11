import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ============ 常量 ============
export const MODES = Object.freeze(["lite", "full", "ultra", "off"]);
export const DEFAULT_MODE = "full";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(HERE, "..");
export const rulesPath = path.resolve(projectRoot, "RULES.md");

// ============ 规则读取（原 config.js）============
export function readLatestRules(file = rulesPath) {
  try { return fs.readFileSync(file, "utf8"); } catch { return ""; }
}

export function rulesVersion(text = readLatestRules()) {
  const source = text.match(/来源:\s*`?([^\n`]+)`?/i)?.[1]?.trim();
  const count = (text.match(/^#{3,4} 准则 \d+:/gm) || []).length;
  return { source: source || "unknown", principles: count, file: rulesPath };
}

export function extractPrinciples(text = readLatestRules()) {
  return [...text.matchAll(/^#{3,4} 准则 (\d+):([^\n]+)$/gm)].map((match) => ({ number: Number(match[1]), title: match[2].trim() }));
}

// ============ 模式基础（原 rules.js）============
export function normalizeMode(value) {
  const mode = String(value ?? "").trim().toLowerCase();
  return MODES.includes(mode) ? mode : null;
}

export function resolveMode(value, fallback = DEFAULT_MODE) {
  return normalizeMode(value) ?? normalizeMode(fallback) ?? DEFAULT_MODE;
}

// ============ 模式配置（原 config.js getDefaultMode/writeDefaultMode）============
export function configPath(env = process.env, home = process.env.USERPROFILE || process.env.HOME || process.cwd()) {
  return env.APPDATA ? path.join(env.APPDATA, "eight-honors-shames", "config.json") : path.join(home, ".config", "eight-honors-shames", "config.json");
}

export function getDefaultMode(env = process.env, home) {
  const fromEnv = normalizeMode(env.EIGHT_RULES_DEFAULT_MODE);
  if (fromEnv) return fromEnv;
  const file = configPath(env, home);
  try { return normalizeMode(JSON.parse(fs.readFileSync(file, "utf8")).defaultMode) || DEFAULT_MODE; } catch { return DEFAULT_MODE; }
}

export function writeDefaultMode(mode, env = process.env, home) {
  const normalized = normalizeMode(mode);
  if (!normalized || normalized === "off") return false;
  const file = configPath(env, home);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ defaultMode: normalized }, null, 2)}\n`);
  return normalized;
}

// ============ 模式仲裁（原 mode.js）============
const SOURCES = ["command", "env", "config", "session", "default"];

function readRuntimeConfig(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

export function arbitrateMode({ command, env, config, session } = {}, fallback = DEFAULT_MODE) {
  for (const source of SOURCES) {
    const value = { command, env, config, session }[source];
    const mode = normalizeMode(typeof value === "string" ? value : value?.mode);
    if (mode) return { mode, source };
  }
  return { mode: fallback, source: "default" };
}

export function loadModeConfig(root = process.cwd()) {
  const file = path.join(root, "config", "runtime.json");
  return readRuntimeConfig(file);
}

export function describeMode(arbitration) {
  return `mode=${arbitration.mode} from=${arbitration.source}`;
}

// ============ 规则摘要与完整注入（原 rules.js 后半）============
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
