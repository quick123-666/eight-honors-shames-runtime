// 八荣八耻生命周期钩子（独立层，供 pi-extension / 其他宿主复用）
// 对标 ponytail hooks/。职责：session_start 注入全文、before_agent_start 注入摘要+门禁、
// before_tool_call 可开关注入、subagent 嵌套默认 off。
import { lifecycleConfigSync, sessionStartInjection, agentStartInjection, toolCallInjection, subagentInheritanceMode } from "../src/lifecycle.js";
import { arbitrateMode, summarize, fullInstructions, getDefaultMode } from "../src/core.js";
import { loadState, saveState, resolveSessionMode } from "../src/acceptance.js";
import { loadEnvFiles, resolveEnvFiles, rejectIfSecretsInText } from "../src/env.js";

loadEnvFiles(resolveEnvFiles());

// 八荣八耻硬话术(每轮显式前缀,反漂移核心)
// 对标 Ponytail "ACTIVE EVERY RESPONSE. NO DRIFT."
// 见 skills/eight-rules/SKILL.md "Persistence" 段
export function buildEightRulesHint(currentMode) {
  if (currentMode === "off") {
    return "[八荣八耻已停用 · off · 启动: /rules 或 重启会话]";
  }
  // 默认 + 4 档(off/lite/full/ultra)显式 token
  return (
    `[八荣八耻已激活 · ${currentMode} · 28条 · NO DRIFT. Still active if unsure. ` +
    `Off only: "停止八荣八耻" / "normal mode" / "/rules off". ` +
    `换档: /rules lite|full|ultra|off]`
  );
}

export function createHooks({ getEntries, getSystemPrompt, notify }) {
  let mode = getDefaultMode();
  let state = loadState();

  return {
    getMode: () => mode,

    onSessionStart: async (ctx) => {
      const branch = (getEntries && getEntries(ctx)) || [];
      const arbitration = arbitrateMode({
        env: process.env.EIGHT_RULES_DEFAULT_MODE,
        config: getDefaultMode(),
        session: resolveSessionMode(branch, getDefaultMode())
      });
      mode = arbitration.mode;
      state = loadState();
      const lifecycle = lifecycleConfigSync();
      const full = sessionStartInjection(mode, lifecycle);
      if (full) {
        const offenders = rejectIfSecretsInText(full.full);
        if (offenders.length) return notify?.(ctx, `session_start 注入拦截含敏感变量: ${offenders.join(", ")}`, "warning");
        state.rulesInjected = { at: new Date().toISOString(), fullSize: full.full.length, source: arbitration.source };
        saveState(state);
        const base = getSystemPrompt ? getSystemPrompt(ctx) : "";
        const hardHint = buildEightRulesHint(mode);
        return { systemPrompt: `${base}\n\n${hardHint}\n\n${full.full}` };
      }
      saveState(state);
    },

    onBeforeAgentStart: async (event) => {
      const lifecycle = lifecycleConfigSync();
      const inj = agentStartInjection(mode, lifecycle);
      if (!inj) return;
      const hardHint = buildEightRulesHint(mode); // ← Phase 4 加:每轮硬话术
      const composed = `${hardHint}\n\n${inj.summary}${inj.gateText}\n\n${inj.hint}`;
      const offenders = rejectIfSecretsInText(composed);
      if (offenders.length) return notify?.(event, `agent_start 注入拦截含敏感变量: ${offenders.join(", ")}`, "warning");
      return { systemPrompt: `${event.systemPrompt}\n\n${composed}` };
    },

    onBeforeToolCall: async () => {
      state.toolCalls += 1;
      const lifecycle = lifecycleConfigSync();
      const hint = toolCallInjection(mode, lifecycle);
      saveState(state);
      if (hint) return { promptHint: hint.hint };
    },

    onAfterToolCall: async (event) => {
      if (event?.error || event?.isError) state.failedToolCalls += 1;
      saveState(state);
    },

    onAfterAgentStop: async () => {
      saveState(state);
    },

    onSessionEnd: async () => saveState(state),

    subagentMode: (depth = 0) => subagentInheritanceMode(mode, lifecycleConfigSync(), depth),

    fullRules: () => fullInstructions(mode),
    summaryOf: (m = mode) => summarize(m)
  };
}
