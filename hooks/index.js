// 八荣八耻生命周期钩子（独立层，供 pi-extension / 其他宿主复用）
// 对标 ponytail hooks/。职责：session_start 注入全文、before_agent_start 注入摘要+门禁、
// before_tool_call 可开关注入、subagent 嵌套默认 off。
import { lifecycleConfigSync, sessionStartInjection, agentStartInjection, toolCallInjection, subagentInheritanceMode } from "../src/lifecycle.js";
import { arbitrateMode, summarize, fullInstructions, getDefaultMode } from "../src/core.js";
import { loadState, saveState, resolveSessionMode } from "../src/acceptance.js";
import { loadEnvFiles, resolveEnvFiles, rejectIfSecretsInText } from "../src/env.js";
import { appendLog, appendLogFor, resolveMtMode, DEFAULT_MT_MODE } from "../src/runtime-log.js";
import { randomUUID } from "node:crypto";

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

// 方法树硬话术(每轮显式前缀,反漂移核心)
// v3.4.5 修正:内容从外部工具链 → RULES-TREE 7 段元工作流沉淀
// (commit bfad0bc 错绑已 revert d6283ea)
// 对标 eight-rules hint 模式 + skills/method-tree/SKILL.md "Persistence" 段
export function buildMethodTreeHint(currentMode) {
  if (currentMode === "off") {
    return "[方法树已停用 · off · 启动: /mr 或 重启会话]";
  }
  // 4 档(off/lite/full/ultra)显式 token
  // full 档:失守或新流程跑通时自问是否沉淀 7 段 RULE(到 RULES-TREE)
  // ultra 档:每任务完成都自问是否沉淀(哪怕流程很短)
  // lite 档:明显失守或新流程跑通才沉淀
  const activeLabel = currentMode === "ultra"
    ? "每任务完成必自问是否沉淀 7 段 RULE"
    : "失守或新流程跑通时自问是否沉淀 7 段 RULE 到 RULES-TREE";
  return (
    `[方法树已激活 · ${currentMode} · ${activeLabel} · NO DRIFT. ` +
    `Off only: "停止方法树" / "no mr" / "/mr off". ` +
    `换档: /mr lite|full|ultra|off]`
  );
}

export function createHooks({ getEntries, getSystemPrompt, notify }) {
  let mode = getDefaultMode();
  let state = loadState();
  // v3.4.5 B1:首次启动给实例打 stamped,持久到 state 文件 + 写一条 instance_started
  if (!state.instanceId) {
    state.instanceId = randomUUID();
    state.startedAt = new Date().toISOString();
    state.heartbeats = 0;
    saveState(state);
    appendLog({ event: "instance_started", instanceId: state.instanceId, mode });
  }
  // v3.4.6:B1 同架构平行复用 — 方法树 daemon 首次启动 stamp
  const mtModeInitial = resolveMtMode(process.env.METHOD_TREE_DEFAULT_MODE, state.mtMode);
  if (!state.mtInstanceId && mtModeInitial !== "off") {
    state.mtInstanceId = randomUUID();
    state.mtStartedAt = new Date().toISOString();
    state.mtHeartbeats = 0;
    state.mtMode = mtModeInitial;
    saveState(state);
    appendLogFor("method-tree", { event: "mt_instance_started", instanceId: state.mtInstanceId, mode: mtModeInitial });
  } else {
    // v3.4.6 mode 持久化:env > 持久 > 默认
    const desired = resolveMtMode(process.env.METHOD_TREE_DEFAULT_MODE, state.mtMode);
    if (desired !== state.mtMode) {
      const from = state.mtMode || null;
      state.mtMode = desired;
      saveState(state);
      if (from && from !== desired) {
        appendLogFor("method-tree", { event: "mt_mode_changed", from, to: desired });
      }
    }
  }
  // v3.4.6 helper:每次调用前 refresh state.mtMode(env override 即时生效 + 持久化)
  const syncMtMode = () => {
    const desired = resolveMtMode(process.env.METHOD_TREE_DEFAULT_MODE, state.mtMode);
    if (desired !== state.mtMode) {
      const from = state.mtMode || null;
      state.mtMode = desired;
      saveState(state);
      if (from && from !== desired) {
        appendLogFor("method-tree", { event: "mt_mode_changed", from, to: desired });
      }
    }
    return state.mtMode;
  };

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
      const mtModeSession = syncMtMode();
      const lifecycle = lifecycleConfigSync();
      const full = sessionStartInjection(mode, lifecycle);
      if (full) {
        const offenders = rejectIfSecretsInText(full.full);
        if (offenders.length) return notify?.(ctx, `session_start 注入拦截含敏感变量: ${offenders.join(", ")}`, "warning");
        state.rulesInjected = { at: new Date().toISOString(), fullSize: full.full.length, source: arbitration.source };
        saveState(state);
        const base = getSystemPrompt ? getSystemPrompt(ctx) : "";
        const eightRulesHint = buildEightRulesHint(mode);
        // 2026-08-13: 方法树 hint(RULES-TREE 7 段沉淀范式)与八荣八耻 hint 并列注入(v3.4.6 使用 syncMtMode 持久化值)
        const methodTreeHint = buildMethodTreeHint(syncMtMode());
        appendLog({ event: "session_start", instanceId: state.instanceId, mode, source: arbitration.source });
        // v3.4.6:方法树 session_start(仅在 mt 非 off 时落)
        if (mtModeSession !== "off") {
          appendLogFor("method-tree", { event: "mt_session_start", instanceId: state.mtInstanceId, mode: mtModeSession });
        }
        return { systemPrompt: `${base}\n\n${eightRulesHint}\n\n${methodTreeHint}\n\n${full.full}` };
      }
      saveState(state);
    },

    onBeforeAgentStart: async (event) => {
      // v3.4.5 B1:每轮刷心跳(写盘 + 计数 + 落 log)
      state.lastHeartbeat = new Date().toISOString();
      state.heartbeats = (state.heartbeats || 0) + 1;
      saveState(state);
      appendLog({ event: "heartbeat", instanceId: state.instanceId, mode, n: state.heartbeats });
      // v3.4.6:方法树心跳(同架构平行刷新;gated by 持久化 mode != off)
      const mtMode = syncMtMode();
      if (mtMode !== "off") {
        state.mtLastHeartbeat = new Date().toISOString();
        state.mtHeartbeats = (state.mtHeartbeats || 0) + 1;
        state.mtMode = mtMode;
        saveState(state);
        appendLogFor("method-tree", { event: "mt_heartbeat", instanceId: state.mtInstanceId, mode: mtMode, n: state.mtHeartbeats });
      }
      const lifecycle = lifecycleConfigSync();
      const inj = agentStartInjection(mode, lifecycle);
      if (!inj) return;
      const eightRulesHint = buildEightRulesHint(mode); // ← Phase 4 加:每轮硬话术
      // 2026-08-13: 方法树 hint(RULES-TREE 7 段沉淀范式)与八荣八耻 hint 并列注入(v3.4.6 使用 syncMtMode 持久化值)
      const methodTreeHint = buildMethodTreeHint(syncMtMode());
      const composed = `${eightRulesHint}\n\n${methodTreeHint}\n\n${inj.summary}${inj.gateText}\n\n${inj.hint}`;
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

    onSessionEnd: async () => {
      appendLog({ event: "session_end", instanceId: state.instanceId, mode, heartbeats: state.heartbeats || 0 });
      const mtModeEnd = syncMtMode();
      if (mtModeEnd !== "off") {
        appendLogFor("method-tree", { event: "mt_session_end", instanceId: state.mtInstanceId, mode: mtModeEnd, heartbeats: state.mtHeartbeats || 0 });
      }
      saveState(state);
    },

    subagentMode: (depth = 0) => subagentInheritanceMode(mode, lifecycleConfigSync(), depth),

    fullRules: () => fullInstructions(mode),
    summaryOf: (m = mode) => summarize(m)
  };
}
