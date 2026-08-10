import fs from "node:fs";
import path from "node:path";

export function parseDotenv(text) {
  const out = {};
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[m[1]] = value;
  }
  return out;
}

export function loadDotenv(files = []) {
  const merged = {};
  for (const file of files) {
    try {
      const data = parseDotenv(fs.readFileSync(file, "utf8"));
      for (const [key, value] of Object.entries(data)) if (!(key in merged)) merged[key] = value;
    } catch {}
  }
  return merged;
}

export function applyDotenv(files = []) {
  const data = loadDotenv(files);
  for (const [key, value] of Object.entries(data)) if (process.env[key] === undefined) process.env[key] = value;
  return data;
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
