import fs from "node:fs";
import path from "node:path";

const SECRET_KEYS = new Set([
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "AWS_SECRET_ACCESS_KEY",
  "GITHUB_TOKEN",
  "HF_TOKEN"
]);

const REQUIRED_KEYS = ["OPENAI_BASE_URL", "OPENAI_MODEL", "EIGHT_RULES_LLM"];

function safePrefix(value) {
  if (!value) return null;
  if (value.length <= 8) return "***";
  return `${value.slice(0, 3)}...${value.slice(-4)}`;
}

function readEnvFile(file) {
  const out = {};
  for (const raw of String(fs.readFileSync(file, "utf8")).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[m[1]] = value;
  }
  return out;
}

export function loadEnvFiles(files = []) {
  const merged = {};
  for (const file of files) {
    try { for (const [k, v] of Object.entries(readEnvFile(file))) if (!(k in merged)) merged[k] = v; } catch {}
  }
  for (const [k, v] of Object.entries(merged)) if (process.env[k] === undefined) process.env[k] = v;
  return merged;
}

export function resolveEnvFiles(explicit = [], start = process.cwd()) {
  const out = [...explicit];
  let current = path.resolve(start);
  for (let i = 0; i < 6; i += 1) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate) && !out.includes(candidate)) out.push(candidate);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return out;
}

export function summarizeSecret(value) {
  if (value === undefined || value === null) return null;
  return { length: String(value).length, prefix: safePrefix(value) };
}

export function secretSummary() {
  const summary = {};
  for (const key of SECRET_KEYS) if (process.env[key]) summary[key] = summarizeSecret(process.env[key]);
  return summary;
}

export function requiredKeysPresent(extra = []) {
  const missing = [...REQUIRED_KEYS, ...extra].filter((key) => !process.env[key]);
  return { missing, present: missing.length === 0 };
}

export function rejectIfSecretsInText(text) {
  const offenders = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (!SECRET_KEYS.has(key)) continue;
    if (value && String(text).includes(value)) offenders.push(key);
  }
  return offenders;
}
