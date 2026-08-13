#!/usr/bin/env node
// 扫描 .env 中所有 API key 类变量,对每个跑 8 家端点探测,输出 status 表
// 沉淀:RULE-IX-SENSITIVE-DATA-001 v3.4.11
// 跑法:node scripts/probe-env-apis.js 或 npm run probe:env
// 特性:
//  - 不 echo 任何 key 字面值,只写 prefix+suffix
//  - 输出 .env.STATUS.json(无 secret)+ .env 状态注释(可选)
//  - 与 docs/minimax-api-usage.md 的 8 家探测脚本同步
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// 8 家端点(MiniMax/OpenAI/Anthropic/Mistral/Groq/OpenRouter/xAI/Zhipu)
const PROVIDERS = [
  { name: "MiniMax",     url: "https://api.minimaxi.com/v1/models" },
  { name: "OpenAI",      url: "https://api.openai.com/v1/models" },
  { name: "Anthropic",   url: "https://api.anthropic.com/v1/models" },
  { name: "Mistral",     url: "https://api.mistral.ai/v1/models" },
  { name: "Groq",        url: "https://api.groq.com/openai/v1/models" },
  { name: "OpenRouter",  url: "https://openrouter.ai/api/v1/models" },
  { name: "xAI",         url: "https://api.x.ai/v1/models" },
  { name: "Zhipu",       url: "https://open.bigmodel.cn/api/paas/v4/models" }
];

// 匹配 API key 类变量(下划线 + KEY/TOKEN/SECRET 后缀)
const KEY_RE = /^(?<name>[A-Z][A-Z0-9_]*_(?:API_KEY|TOKEN|SECRET|ACCESS_KEY|PRIVATE_KEY|CLIENT_SECRET))=(?<value>.+)$/;

function parseEnv(text) {
  const keys = [];
  for (const line of text.split("\n")) {
    const m = line.match(KEY_RE);
    if (m && !m.groups.value.startsWith("#")) {
      keys.push({ name: m.groups.name, value: m.groups.value.trim() });
    }
  }
  return keys;
}

function maskValue(v) {
  if (v.length <= 12) return `${v.slice(0, 3)}...${v.slice(-3)}`;
  return `${v.slice(0, 7)}...${v.slice(-6)}`;
}

// 用 curl 探测,绝不直接 echo 完整 KEY
function probe(name, provider, keyValue) {
  const result = spawnSync("curl", [
    "-s", "-o", "/dev/null", "-w", "%{http_code}",
    "--max-time", "8",
    "-H", `Authorization: Bearer ${keyValue}`,
    "-H", "Content-Type: application/json",
    provider.url
  ], { encoding: "utf8" });
  return { name, provider: provider.name, code: result.stdout || "000", url: provider.url };
}

function pickProvider(probes) {
  // 优先 HTTP 200
  return probes.find((p) => p.code === "200");
}

function main() {
  const cwd = process.cwd();
  const envPath = path.join(cwd, ".env");
  if (!fs.existsSync(envPath)) {
    console.error(`✖ 未找到 .env(预期: ${envPath})`);
    process.exit(1);
  }
  const envText = fs.readFileSync(envPath, "utf8");
  const keys = parseEnv(envText);

  if (keys.length === 0) {
    console.log("(no KEY/TOKEN/SECRET variables in .env)");
    return;
  }

  console.log(`[probe] scanning ${keys.length} key(s) in .env ...\n`);
  const summary = [];
  for (const k of keys) {
    const probes = PROVIDERS.map((p) => probe(k.name, p, k.value));
    const live = pickProvider(probes);
    const status = live ? `✅ ${live.provider}` : "❌ no provider recognized";
    console.log(`[probe] ${k.name} = ${maskValue(k.value)}`);
    for (const p of probes) {
      console.log(`  ${p.code} ${p.provider.padEnd(12)} ${p.url}`);
    }
    console.log(`  → ${status}\n`);
    summary.push({
      name: k.name,
      masked: maskValue(k.value),
      status,
      verified_provider: live?.provider || null,
      verified_endpoint: live?.url || null,
      probe_codes: Object.fromEntries(probes.map((p) => [p.name, p.code]))
    });
  }

  // 写 .env.STATUS.json(只写元数据,不写 secret)
  const statusJson = {
    version: "1.0",
    schema: "env-api-status",
    last_check: new Date().toISOString(),
    keys: summary.map((s) => ({
      name: s.name,
      value_masked: s.masked,
      status: s.status,
      verified_provider: s.verified_provider,
      verified_endpoint: s.verified_endpoint,
      probe_codes: s.probe_codes
    }))
  };
  fs.writeFileSync(path.join(cwd, ".env.STATUS.json"), JSON.stringify(statusJson, null, 2));
  console.log(`[probe] updated .env.STATUS.json`);
}

main();
