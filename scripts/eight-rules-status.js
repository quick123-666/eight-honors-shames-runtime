#!/usr/bin/env node
// 八荣八耻 + 方法树 status CLI(B3 v3.4.5-6)
// 一屏展示:两套 daemon 状态(并行)+ 每套最近 5 条 log
// 跑法:node scripts/eight-rules-status.js
// 状态来源:.eight-rules/session-state.json(B1)+ .runtime/{eight-rules,method-tree}.log(B2)
// 沉淀:RULE-EIGHT-RULES-DAEMON-001 + RULE-METHOD-TREE-DAEMON-001
import { readStatus } from "../src/runtime-log.js";

const s = readStatus();

const fmt = (t) => t ? new Date(t).toISOString().replace("T", " ").slice(0, 19) + "Z" : "(none)";
const ageSec = (t) => {
  if (!t) return null;
  const ms = Date.now() - new Date(t).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.round(ms / 1000));
};
const humanAge = (sec) => {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86400)}d`;
};
const shortId = (id) => id ? id.slice(0, 8) + "…" : "(no instance)";
const isLive = (t, ttlMs = 10 * 60 * 1000) => t && (Date.now() - new Date(t).getTime() < ttlMs);

const renderSubsystem = (title, icon, s, recentLog, opts = {}) => {
  const live = isLive(opts.lastHeartbeat || null);
  const mtOff = opts.mode === "off";
  const lines = [
    "├─────────────────────────────────────────────────────────────",
    `│ ${icon} ${title} daemon`,
    "├─────────────────────────────────────────────────────────────",
    `│ Running   : ${mtOff ? "⏸  off" : (live ? "✅ yes" : "❌ no")} (heartbeat ≤ 10 min = live)${opts.mode ? ` · mode=${opts.mode}` : ""}`,
    `│ Instance  : ${shortId(opts.instanceId)}`,
    `│ Started   : ${fmt(opts.startedAt)}  (${humanAge(ageSec(opts.startedAt))} ago)`,
    `│ Heartbeat : ${fmt(opts.lastHeartbeat)}  (${humanAge(ageSec(opts.lastHeartbeat))} ago, count=${opts.heartbeats || 0})`
  ];
  if (opts.extra) lines.push(...opts.extra);
  lines.push("├─────────────────────────────────────────────────────────────");
  lines.push(`│ Recent log (last 5, ${opts.logFile}):`);
  if (!recentLog.length) {
    lines.push("│   (no log entries yet — 启动会话即会出现)");
  } else {
    for (const e of recentLog) {
      const modeTag = e.mode ? `mode=${e.mode}` : "";
      const nTag = Number.isFinite(e.n) ? `n=${e.n}` : "";
      const tags = [modeTag, nTag].filter(Boolean).join(" ");
      lines.push(`│   ${fmt(e.ts)}  ${(e.event || "?").padEnd(18)}  ${tags}`);
    }
  }
  return lines;
};

const lines = [
  "┌─────────────────────────────────────────────────────────────",
  "│ runtime status  (v3.4.6 · RULE-EIGHT-RULES-DAEMON-001 + RULE-METHOD-TREE-DAEMON-001)",
  "├─────────────────────────────────────────────────────────────",
  `│ Toolcalls : ${s.toolCalls} total, ${s.failedToolCalls} failed`
];

// 八荣八耻 section
lines.push(...renderSubsystem("八荣八耻", "📜", s, s.recentLog, {
  instanceId: s.instanceId,
  startedAt: s.startedAt,
  lastHeartbeat: s.lastHeartbeat,
  heartbeats: s.heartbeats,
  mode: s.rulesInjectedSource,
  logFile: ".runtime/eight-rules.log",
  extra: [
    `│ Injected  : ${fmt(s.rulesInjectedAt)}  (${s.rulesInjectedSize} bytes)`
  ]
}));

// 方法树 section
lines.push(...renderSubsystem("方法树", "🌳", s, s.recentMtLog, {
  instanceId: s.mtInstanceId,
  startedAt: s.mtStartedAt,
  lastHeartbeat: s.mtLastHeartbeat,
  heartbeats: s.mtHeartbeats,
  mode: s.mtMode,
  logFile: ".runtime/method-tree.log"
}));

lines.push("└─────────────────────────────────────────────────────────────");

console.log(lines.join("\n"));
