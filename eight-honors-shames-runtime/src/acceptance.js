import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { acceptanceSummary } from "./state.js";

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
