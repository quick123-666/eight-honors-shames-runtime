// 八荣八耻/方法树 runtime 状态指示器(B1+B2+B3 v3.4.5-6)
// v3.4.5: 八荣八耻 daemon 三件套(state + JSONL log + status CLI)
// v3.4.6: 方法树 daemon 三件套复用(同架构、平行子系统、文件按 subsystem 隔离)
// 沉淀:RULE-EIGHT-RULES-DAEMON-001 + RULE-METHOD-TREE-DAEMON-001
// 设计:不引入守护进程,只把"hint 注入"这个事实落盘成可审计的痕迹
//      state 字段 → 心跳/启动时间;log JSONL → 事件流;status CLI → 用户面
import fs from "node:fs";
import path from "node:path";
import { loadState } from "./acceptance.js";

const RUNTIME_DIR = ".runtime";

// 子系统注册表:扩展点。key = subsystem id,value = log 文件名(同目录 .runtime/)
const SUBSYSTEMS = Object.freeze({
  "eight-rules": "eight-rules.log",
  "method-tree": "method-tree.log"
});

// 方法树 mode 优先级:env > state 持久值 > 默认 full
// 对标 eight-rules 的 arbitrateMode(env, config, session, fallback) — 但方法树目前无 config/session 源,只需 env + 持久 + 默认
export const DEFAULT_MT_MODE = "full";
export function resolveMtMode(envValue, persisted, defaultMode = DEFAULT_MT_MODE) {
  return envValue || persisted || defaultMode;
}

// 磁盘路径解析
export function runtimeDir(root = process.cwd()) {
  return path.join(root, RUNTIME_DIR);
}
export function logFile(root = process.cwd()) {
  return path.join(runtimeDir(root), SUBSYSTEMS["eight-rules"]);
}
export function logFileFor(subsystem, root = process.cwd()) {
  const name = SUBSYSTEMS[subsystem] || `${subsystem}.log`;
  return path.join(runtimeDir(root), name);
}

// 旧 API 兼容(八荣八耻默认)
export function appendLog(event = {}, root = process.cwd()) {
  return _appendLog("eight-rules", event, root);
}

// 新 API:为任意子系统写一行 JSONL
export function appendLogFor(subsystem, event = {}, root = process.cwd()) {
  return _appendLog(subsystem, event, root);
}
function _appendLog(subsystem, event, root) {
  const file = logFileFor(subsystem, root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const payload = { ts: new Date().toISOString(), subsystem, ...event };
  const line = JSON.stringify(payload) + "\n";
  fs.appendFileSync(file, line);
  return payload;
}

// 倒序取最近 N 条(missing/空文件 → [])
export function tailLog(n = 5, root = process.cwd()) {
  return tailLogFor("eight-rules", n, root);
}
export function tailLogFor(subsystem, n = 5, root = process.cwd()) {
  try {
    const lines = fs.readFileSync(logFileFor(subsystem, root), "utf8").split("\n").filter(Boolean);
    return lines.slice(-Math.max(0, n | 0)).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

// 读两个子系统的状态结构(给 status CLI 渲染)
// 复用 acceptance.js#loadState — state 文件契约统一
export function readStatus(root = process.cwd()) {
  const state = loadState(root);
  return {
    // ===== 八荣八耻 daemon(B1)=====
    instanceId: state.instanceId || null,
    startedAt: state.startedAt || null,
    lastHeartbeat: state.lastHeartbeat || null,
    heartbeats: Number.isFinite(state.heartbeats) ? state.heartbeats : 0,
    rulesInjectedSource: state.rulesInjected?.source || "unknown",
    rulesInjectedAt: state.rulesInjected?.at || null,
    rulesInjectedSize: Number.isFinite(state.rulesInjected?.fullSize) ? state.rulesInjected.fullSize : 0,
    toolCalls: state.toolCalls || 0,
    failedToolCalls: state.failedToolCalls || 0,
    recentLog: tailLogFor("eight-rules", 5, root),
    // ===== 方法树 daemon(B1 同架构复用)=====
    mtInstanceId: state.mtInstanceId || null,
    mtStartedAt: state.mtStartedAt || null,
    mtLastHeartbeat: state.mtLastHeartbeat || null,
    mtHeartbeats: Number.isFinite(state.mtHeartbeats) ? state.mtHeartbeats : 0,
    mtMode: state.mtMode || "full",
    recentMtLog: tailLogFor("method-tree", 5, root)
  };
}
