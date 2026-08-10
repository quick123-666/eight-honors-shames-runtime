import { lifecycleConfigSync, sessionStartInjection, agentStartInjection, toolCallInjection, subagentInheritanceMode } from "../src/lifecycle.js";
import { createAcceptanceState, loadState, resolveSessionMode, saveState } from "../src/acceptance.js";
import { acceptanceReport } from "../src/acceptance.js";
import { auditRepository } from "../src/audit.js";
import { arbitrateMode } from "../src/core.js";
import { loadEnvFiles, resolveEnvFiles, rejectIfSecretsInText, withSecret } from "../src/env.js";
import { buildInstructions, fullInstructions, summarize, DEFAULT_MODE, normalizeMode, getDefaultMode, writeDefaultMode, rulesVersion, rulesPath } from "../src/core.js";

loadEnvFiles(resolveEnvFiles());

export { buildInstructions, fullInstructions, summarize, resolveSessionMode };

export function parseCommand(text, fallback = DEFAULT_MODE) {
  const parts = String(text || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!parts.length) return { type: "set-mode", mode: fallback };
  if (parts[0] === "status") return { type: "status" };
  if (parts[0] === "default") {
    const mode = normalizeMode(parts[1]);
    return mode && mode !== "off" ? { type: "set-default", mode } : { type: "invalid" };
  }
  if (["audit", "accept", "benchmark", "help"].includes(parts[0])) return { type: parts[0] };
  const mode = normalizeMode(parts[0]);
  return mode ? { type: "set-mode", mode } : { type: "invalid" };
}

function notify(ctx, text, level = "info") { ctx?.ui?.notify?.(text, level); }

function fullRulesBlock(currentMode) { return `\n\n[完整八荣八耻规则，按需拉取]\n${fullInstructions(currentMode)}\n`; }

export default function eightRulesExtension(pi) {
  let mode = getDefaultMode();
  let defaultMode = mode;
  let state = loadState();
  pi.registerCommand("rules", { description: "管理八荣八耻运行时", handler: async (args, ctx) => {
    const command = parseCommand(args, defaultMode);
    if (command.type === "status") return notify(ctx, `八荣八耻：当前 ${mode} • 默认 ${defaultMode} • 规则 ${rulesVersion().principles} 条 • 来源 ${rulesPath} • 工具 ${state.toolCalls} • 失败 ${state.failedToolCalls}`);
    if (command.type === "set-default") { writeDefaultMode(command.mode); defaultMode = getDefaultMode(); return notify(ctx, `默认模式已设为 ${defaultMode}`); }
    if (command.type === "set-mode") { mode = command.mode; pi.appendEntry("eight-rules-mode", { mode }); saveState(state); return notify(ctx, `当前模式已设为 ${mode}`); }
    if (command.type === "audit") { const report = auditRepository(); notify(ctx, `规则审计：变更 ${report.changedFiles.length} 个文件，警告 ${report.warnings.length} 条`, report.warnings.length ? "warning" : "info"); const block = fullRulesBlock(mode); const offenders = rejectIfSecretsInText(block); if (offenders.length) return notify(ctx, `审计输出含敏感变量 ${offenders.join(", ")}，已拦截写入`, "warning"); return { report, auditFollowUp: block }; }
    if (command.type === "accept") { const report = acceptanceReport(state); notify(ctx, report.passed ? "验收通过" : `验收阻塞：${report.blockers.join(", ")}`, report.passed ? "info" : "warning"); return report; }
    if (command.type === "benchmark") return pi.sendUserMessage("/skill:eight-rules-benchmark");
    if (command.type === "help") return notify(ctx, "/rules status|lite|full|ultra|off|default <mode>|audit|accept|benchmark");
    notify(ctx, "未知 /rules 命令", "warning");
  }});
  pi.on("session_start", async (_event, ctx) => {
    const branch = ctx?.sessionManager?.getBranch?.() || [];
    const arbitration = arbitrateMode({ env: process.env.EIGHT_RULES_DEFAULT_MODE, config: getDefaultMode(), session: resolveSessionMode(branch, getDefaultMode()) });
    mode = arbitration.mode;
    state = loadState();
    const lifecycle = lifecycleConfigSync();
    const full = sessionStartInjection(mode, lifecycle);
    if (full) {
      const offenders = rejectIfSecretsInText(full.full);
      if (offenders.length) return notify(ctx, `session_start 注入拦截含敏感变量: ${offenders.join(", ")}`, "warning");
      state.rulesInjected = { at: new Date().toISOString(), fullSize: full.full.length, source: arbitration.source };
      saveState(state);
      return { systemPrompt: `${ctx?.systemPrompt || ""}\n\n${full.full}` };
    }
    saveState(state);
  });
  pi.on("before_agent_start", async (event) => {
    const lifecycle = lifecycleConfigSync();
    const inj = agentStartInjection(mode, lifecycle);
    if (!inj) return;
    const composed = `${inj.summary}${inj.gateText}\n\n${inj.hint}`;
    const offenders = rejectIfSecretsInText(composed);
    if (offenders.length) return notify(ctx, `agent_start 注入拦截含敏感变量: ${offenders.join(", ")}`, "warning");
    return { systemPrompt: `${event.systemPrompt}\n\n${composed}` };
  });
  pi.on("before_tool_call", async () => {
    state.toolCalls += 1;
    const lifecycle = lifecycleConfigSync();
    const hint = toolCallInjection(mode, lifecycle);
    saveState(state);
    if (hint) return { promptHint: hint.hint };
  });
  pi.on("after_tool_call", async (event) => { if (event?.error || event?.isError) state.failedToolCalls += 1; saveState(state); });
  pi.on("after_agent_stop", async () => { state.changedFiles = auditRepository().changedFiles.length; saveState(state); });
  pi.on("session_end", async () => saveState(state));
}
