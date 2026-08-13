// tests for src/runtime-log.js — B1+B2+B3 v3.4.5 + 方法树 v3.4.6 同架构复用
// 跑法: node --test tests/runtime-log.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  appendLog, appendLogFor, tailLog, tailLogFor,
  readStatus, logFile, logFileFor, runtimeDir,
  resolveMtMode, DEFAULT_MT_MODE
} from "../src/runtime-log.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-runtime-test-root");

test.beforeEach(() => {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});

test.after(() => {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});

test("runtimeDir / logFile 解析路径正确", () => {
  assert.equal(runtimeDir(TMP_ROOT), path.join(TMP_ROOT, ".runtime"));
  assert.equal(logFile(TMP_ROOT), path.join(TMP_ROOT, ".runtime", "eight-rules.log"));
});

test("appendLog 自动创建 .runtime/ 目录 + 写 JSONL 行", () => {
  appendLog({ event: "test_a", n: 1 }, TMP_ROOT);
  appendLog({ event: "test_b", n: 2 }, TMP_ROOT);
  const file = logFile(TMP_ROOT);
  assert.ok(fs.existsSync(path.dirname(file)), "应自动创建 .runtime 目录");
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n").filter(Boolean);
  assert.equal(lines.length, 2, "应有 2 行 JSONL");
  const parsed = lines.map((l) => JSON.parse(l));
  assert.equal(parsed[0].event, "test_a");
  assert.equal(parsed[1].event, "test_b");
  assert.match(parsed[0].ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  // v3.4.6:每行应带 subsystem discriminator(默认 eight-rules)
  assert.equal(parsed[0].subsystem, "eight-rules");
});

test("tailLog 返回最后 N 条(missing 文件 → 空数组)", () => {
  const empty = tailLog(5, TMP_ROOT);
  assert.deepEqual(empty, [], "空状态文件应返回 []");
  appendLog({ event: "a" }, TMP_ROOT);
  appendLog({ event: "b" }, TMP_ROOT);
  appendLog({ event: "c" }, TMP_ROOT);
  const last2 = tailLog(2, TMP_ROOT);
  assert.equal(last2.length, 2);
  assert.equal(last2[0].event, "b");
  assert.equal(last2[1].event, "c");
});

test("tailLog 跳过损坏行(corrupt JSONL 不抛)", () => {
  fs.mkdirSync(runtimeDir(TMP_ROOT), { recursive: true });
  fs.writeFileSync(logFile(TMP_ROOT),
    JSON.stringify({ ts: "2026-01-01T00:00:00Z", event: "good" }) + "\n" +
    "{this is not valid json\n" +
    JSON.stringify({ ts: "2026-01-01T00:00:01Z", event: "good2" }) + "\n");
  const out = tailLog(10, TMP_ROOT);
  assert.equal(out.length, 2);
  assert.equal(out[0].event, "good");
  assert.equal(out[1].event, "good2");
});

// ===== v3.4.6:方法树 同架构复用 =====

test("appendLogFor 写入独立的方法树 log 文件", () => {
  appendLogFor("method-tree", { event: "mt_instance_started" }, TMP_ROOT);
  appendLogFor("method-tree", { event: "mt_heartbeat", n: 1 }, TMP_ROOT);
  appendLog({ event: "ignore_me" }, TMP_ROOT); // 八荣八耻 log,不应混入

  const mtFile = logFileFor("method-tree", TMP_ROOT);
  const erFile = logFile(TMP_ROOT);
  assert.ok(fs.existsSync(mtFile), "应创建 method-tree.log");
  assert.ok(fs.existsSync(erFile), "也应保留 八荣八耻 log");

  const mtLines = fs.readFileSync(mtFile, "utf8").split("\n").filter(Boolean);
  assert.equal(mtLines.length, 2);
  const mtParsed = mtLines.map((l) => JSON.parse(l));
  assert.equal(mtParsed[0].subsystem, "method-tree");
  assert.equal(mtParsed[0].event, "mt_instance_started");
  assert.equal(mtParsed[1].event, "mt_heartbeat");

  // 八荣八耻 log 不应包含 mt_ 事件
  const erLines = fs.readFileSync(erFile, "utf8").split("\n").filter(Boolean);
  assert.equal(erLines.length, 1);
  assert.equal(JSON.parse(erLines[0]).event, "ignore_me");
});

test("tailLogFor 只读方法树 log,不影响八荣八耻 log", () => {
  appendLog({ event: "er_a" }, TMP_ROOT);
  appendLogFor("method-tree", { event: "mt_a" }, TMP_ROOT);
  appendLog({ event: "er_b" }, TMP_ROOT);
  appendLogFor("method-tree", { event: "mt_b" }, TMP_ROOT);

  const erTail = tailLogFor("eight-rules", 10, TMP_ROOT);
  const mtTail = tailLogFor("method-tree", 10, TMP_ROOT);
  assert.equal(erTail.length, 2);
  assert.equal(erTail.every(e => e.subsystem === "eight-rules"), true);
  assert.equal(mtTail.length, 2);
  assert.equal(mtTail.every(e => e.subsystem === "method-tree"), true);
});

test("readStatus 同时透出八荣八耻 + 方法树字段", () => {
  // 模拟一个完整的双子系统 state 文件
  const stateFile = path.join(TMP_ROOT, ".eight-rules", "session-state.json");
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const fakeState = {
    // 八荣八耻
    instanceId: "11111111-2222-3333-4444-555555555555",
    startedAt: "2026-08-13T00:00:00.000Z",
    lastHeartbeat: "2026-08-13T00:01:00.000Z",
    heartbeats: 7,
    toolCalls: 42,
    failedToolCalls: 1,
    rulesInjected: { at: "2026-08-13T00:00:30.000Z", fullSize: 4096, source: "config" },
    // 方法树(平行)
    mtInstanceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    mtStartedAt: "2026-08-13T00:00:00.000Z",
    mtLastHeartbeat: "2026-08-13T00:01:00.000Z",
    mtHeartbeats: 5,
    mtMode: "full"
  };
  fs.writeFileSync(stateFile, JSON.stringify(fakeState));
  // 各自 log 一条
  appendLog({ event: "heartbeat", instanceId: fakeState.instanceId, mode: "full", n: 7 }, TMP_ROOT);
  appendLogFor("method-tree", { event: "mt_heartbeat", instanceId: fakeState.mtInstanceId, mode: "full", n: 5 }, TMP_ROOT);

  const s = readStatus(TMP_ROOT);
  // 八荣八耻
  assert.equal(s.instanceId, fakeState.instanceId);
  assert.equal(s.heartbeats, 7);
  assert.equal(s.toolCalls, 42);
  assert.equal(s.rulesInjectedSource, "config");
  assert.equal(s.rulesInjectedSize, 4096);
  assert.equal(s.recentLog.length, 1);
  // 方法树
  assert.equal(s.mtInstanceId, fakeState.mtInstanceId);
  assert.equal(s.mtHeartbeats, 5);
  assert.equal(s.mtMode, "full");
  assert.equal(s.recentMtLog.length, 1);
  assert.equal(s.recentMtLog[0].event, "mt_heartbeat");
});

test("readStatus 在 state 文件缺失时两套字段都返回骨架(null/0/[])", () => {
  const s = readStatus(TMP_ROOT);
  assert.equal(s.instanceId, null);
  assert.equal(s.mtInstanceId, null);
  assert.equal(s.startedAt, null);
  assert.equal(s.mtStartedAt, null);
  assert.equal(s.heartbeats, 0);
  assert.equal(s.mtHeartbeats, 0);
  assert.equal(s.mtMode, "full", "默认 mt 档应为 full");
  assert.deepEqual(s.recentLog, []);
  assert.deepEqual(s.recentMtLog, []);
});

// ===== v3.4.6 mode 持久化 =====

test("DEFAULT_MT_MODE 常量为 'full'", () => {
  assert.equal(DEFAULT_MT_MODE, "full");
});

test("resolveMtMode:env 值优先于 persisted 与默认", () => {
  assert.equal(resolveMtMode("lite", "full", "full"), "lite", "env=lite 赢");
  assert.equal(resolveMtMode("ultra", null, "full"), "ultra", "env=ultra,无 persisted → ultra");
  assert.equal(resolveMtMode("off", "lite", "full"), "off", "env 优先即使 persisted 不是 off");
});

test("resolveMtMode:env 缺失时 fallback 到 persisted", () => {
  assert.equal(resolveMtMode(null, "ultra", "full"), "ultra", "无 env → persisted=ultra");
  assert.equal(resolveMtMode("", "lite", "full"), "lite", "空字符串 env 也算缺失");
  assert.equal(resolveMtMode(undefined, "off", "full"), "off", "undefined env 也算缺失");
});

test("resolveMtMode:env+persisted 都缺失时 fallback 到默认 'full'", () => {
  assert.equal(resolveMtMode(null, null, "full"), "full");
  assert.equal(resolveMtMode(undefined, undefined, "full"), "full");
  assert.equal(resolveMtMode("", "", "full"), "full");
});

test("resolveMtMode 支持自定义 fallback(防御性)", () => {
  assert.equal(resolveMtMode(null, null, "ultra"), "ultra", "应回退到传入的默认值");
  assert.equal(resolveMtMode("lite", null, "ultra"), "lite", "env 始终优先");
});
