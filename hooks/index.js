// 八荣八耻生命周期钩子（独立层，供 pi-extension / 其他宿主复用）
// 对标 ponytail hooks/。职责：session_start 注入全文、before_agent_start 注入摘要+门禁、
// before_tool_call 可开关注入、subagent 嵌套默认 off。
import { lifecycleConfigSync, sessionStartInjection, agentStartInjection, toolCallInjection, subagentInheritanceMode } from "../src/lifecycle.js";
import { arbitrateMode, summarize, fullInstructions, getDefaultMode } from "../src/core.js";
import { loadState, saveState, resolveSessionMode } from "../src/acceptance.js";
import { loadEnvFiles, resolveEnvFiles, rejectIfSecretsInText } from "../src/env.js";

loadEnvFiles(resolveEnvFiles());

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
        return { systemPrompt: `${base}\n\n${full.full}` };
      }
      saveState(state);
    },

    onBeforeAgentStart: async (event) => {
      const lifecycle = lifecycleConfigSync();
      const inj = agentStartInjection(mode, lifecycle);
      if (!inj) return;
      const composed = `${inj.summary}${inj.gateText}\n\n${inj.hint}`;
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
