import fs from "node:fs";
import { summarize, fullInstructions } from "./rules.js";

const DEFAULTS = Object.freeze({
  sessionStartFull: true,
  agentStartSummary: true,
  toolCallInject: false,
  subagentInherit: false,
  nestedOff: true
});

export function loadLifecycleConfig(root = process.cwd()) {
  try {
    const file = `${root}/config/runtime.json`;
    return { ...DEFAULTS, ...(JSON.parse(fs.readFileSync(file, "utf8")).lifecycle || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function lifecycleConfigSync(root = process.cwd()) {
  try {
    const data = JSON.parse(fs.readFileSync(`${root}/config/runtime.json`, "utf8"));
    return { ...DEFAULTS, ...(data.lifecycle || {}) };
  } catch { return { ...DEFAULTS }; }
}

export function sessionStartInjection(mode, config = DEFAULTS) {
  if (!config.sessionStartFull) return null;
  if (mode === "off") return null;
  return { full: fullInstructions(mode) };
}

export function agentStartInjection(mode, config = DEFAULTS) {
  if (!config.agentStartSummary) return null;
  if (mode === "off") return null;
  const { summary, gates, version } = summarize(mode);
  const gateText = gates.length ? `\n\n${gates.join("\n")}` : "";
  return { summary, gateText, version, hint: "如需完整规则正文，使用 /rules audit 主动拉取。" };
}

export function toolCallInjection(mode, config = DEFAULTS) {
  if (!config.toolCallInject) return null;
  if (mode === "off") return null;
  return { hint: "继续遵守上一条摘要与门禁" };
}

export function subagentInheritanceMode(currentMode, config = DEFAULTS, depth = 0) {
  if (config.nestedOff && depth > 0) return "off";
  if (config.subagentInherit) return currentMode;
  return "off";
}
