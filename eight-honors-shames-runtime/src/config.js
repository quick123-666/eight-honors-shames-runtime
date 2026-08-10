import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MODE, normalizeMode } from "./rules.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(HERE, "..");
export const rulesPath = path.resolve(projectRoot, "../RULES.md");

export function readLatestRules(file = rulesPath) {
  try { return fs.readFileSync(file, "utf8"); } catch { return ""; }
}

export function rulesVersion(text = readLatestRules()) {
  const source = text.match(/来源:\s*`?([^\n`]+)`?/i)?.[1]?.trim();
  const count = (text.match(/^### 准则 \d+:/gm) || []).length;
  return { source: source || "unknown", principles: count, file: rulesPath };
}

export function extractPrinciples(text = readLatestRules()) {
  return [...text.matchAll(/^### 准则 (\d+):([^\n]+)$/gm)].map((match) => ({ number: Number(match[1]), title: match[2].trim() }));
}

export function getDefaultMode(env = process.env, home) {
  const fromEnv = normalizeMode(env.EIGHT_RULES_DEFAULT_MODE);
  if (fromEnv) return fromEnv;
  const file = configPath(env, home);
  try { return normalizeMode(JSON.parse(fs.readFileSync(file, "utf8")).defaultMode) || DEFAULT_MODE; } catch { return DEFAULT_MODE; }
}

export function configPath(env = process.env, home = process.env.USERPROFILE || process.env.HOME || process.cwd()) {
  return env.APPDATA ? path.join(env.APPDATA, "eight-honors-shames", "config.json") : path.join(home, ".config", "eight-honors-shames", "config.json");
}

export function writeDefaultMode(mode, env = process.env, home) {
  const normalized = normalizeMode(mode);
  if (!normalized || normalized === "off") return false;
  const file = configPath(env, home);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ defaultMode: normalized }, null, 2)}\n`);
  return normalized;
}
