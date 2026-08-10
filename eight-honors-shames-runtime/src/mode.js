import fs from "node:fs";
import path from "node:path";
import { DEFAULT_MODE, normalizeMode } from "./rules.js";

const SOURCES = ["command", "env", "config", "session", "default"];

function readRuntimeConfig(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

export function resolveMode({ command, env, config, session } = {}, fallback = DEFAULT_MODE) {
  for (const source of SOURCES) {
    const value = { command, env, config, session }[source];
    const mode = normalizeMode(typeof value === "string" ? value : value?.mode);
    if (mode) return { mode, source };
  }
  return { mode: fallback, source: "default" };
}

export function loadModeConfig(root = process.cwd()) {
  const file = path.join(root, "config", "runtime.json");
  return readRuntimeConfig(file);
}

export function describeMode(arbitration) {
  return `mode=${arbitration.mode} from=${arbitration.source}`;
}
