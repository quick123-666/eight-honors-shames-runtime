import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// ============ 状态（原 state.js）============
export const DEFAULT_STATE = Object.freeze({
  changedFiles: 0,
  testsRun: false,
  buildRun: false,
  risks: [],
  rollbackPoint: null,
  toolCalls: 0,
  failedToolCalls: 0,
  skills: []
});

export function resolveSessionMode(entries, fallback = "full") {
  if (!Array.isArray(entries)) return fallback;
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i];
    if (entry?.type !== "custom" || entry?.customType !== "eight-rules-mode") continue;
    if (["lite", "full", "ultra", "off"].includes(entry?.data?.mode)) return entry.data.mode;
  }
  return fallback;
}

export function createAcceptanceState(initial = {}) {
  return { ...DEFAULT_STATE, ...initial, risks: [...(initial.risks || [])], skills: [...(initial.skills || [])] };
}

export function acceptanceSummary(state) {
  const blockers = [];
  if (state.changedFiles > 0 && !state.testsRun) blockers.push("tests-not-run");
  if (state.changedFiles > 0 && !state.rollbackPoint) blockers.push("rollback-point-missing");
  return { passed: blockers.length === 0, blockers };
}

export function stateFile(root) {
  return path.join(root, ".eight-rules", "session-state.json");
}

export function saveState(state, root = process.cwd()) {
  const file = stateFile(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
  return file;
}

export function loadState(root = process.cwd()) {
  try { return createAcceptanceState(JSON.parse(fs.readFileSync(stateFile(root), "utf8"))); } catch { return createAcceptanceState(); }
}

// ============ 验收（原 acceptance.js）============
export function runCommand(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  return { command: [command, ...args].join(" "), status: result.status ?? 1, stdout: result.stdout || "", stderr: result.stderr || "" };
}

export function findPackageScripts(cwd = process.cwd()) {
  try { return JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8")).scripts || {}; } catch { return {}; }
}

export function acceptanceReport(state, cwd = process.cwd()) {
  const result = acceptanceSummary(state);
  return { ...result, cwd, checkedAt: new Date().toISOString(), packageScripts: findPackageScripts(cwd) };
}
