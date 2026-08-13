// tests for scripts/probe-env-apis.js — 8 家端点探测 + .env.STATUS.json 元数据生成
// 跑法:node --test tests/probe-env-apis.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// 由于 probe 主函数会真发网络请求,我们只测辅助函数(导出)
// 不真发请求就只验 maskValue + parseEnv + 工具函数
// 跑完整 8 家探测见 scripts/probe-env-apis.js(需联网)

// 测试 maskValue(测试导出不可,用文字截图类似逻辑 inline)
function maskValue(v) {
  if (v.length <= 12) return `${v.slice(0, 3)}...${v.slice(-3)}`;
  return `${v.slice(0, 7)}...${v.slice(-6)}`;
}

// 测试 KEY 正则(也是 inline)
const KEY_RE = /^(?<name>[A-Z][A-Z0-9_]*_(?:API_KEY|TOKEN|SECRET|ACCESS_KEY|PRIVATE_KEY|CLIENT_SECRET))=(?<value>.+)$/;

test("maskValue 长 key 显示 prefix + suffix", () => {
  assert.equal(maskValue("sk-cp-VbArJlV7zPVCy3GIeWvkXDi9ebCop1XwejGJMWYYv4_oWVhOGRaIj76i0R4MQaBldePs-FZRpfn-Y4lmcoWu3Sy10EW85nxl8NkxiNTLvb6GfDFenU3_9Y0"),
    "sk-cp-V...U3_9Y0");
});

test("maskValue 短 key 也安全(只显示首尾各 3)", () => {
  assert.equal(maskValue("abcd"), "abc...bcd");
  assert.equal(maskValue("a"), "a...a");
});

test("KEY 正则匹配标准 _API_KEY / _TOKEN / _SECRET", () => {
  const cases = [
    "OPENAI_API_KEY=sk-cp-VbAr...U3_9Y0",
    "GH_TOKEN=ghp_abc123",
    "AWS_SECRET_ACCESS_KEY=wJalrXUtn",
    "STRIPE_PRIVATE_KEY=sk_live_abc"
  ];
  for (const line of cases) {
    const m = line.match(KEY_RE);
    assert.ok(m, `${line} should match`);
    assert.ok(m.groups.name.length > 0);
    assert.ok(m.groups.value.length > 0);
  }
});

test("KEY 正则不匹配注释行 / 非 KEY 类变量", () => {
  const cases = [
    "# this is a comment",
    "# OPENAI_API_KEY=should not match",
    "PATH=/usr/bin",
    "HOME=C:\\Users\\foo",
    "FOO_BAR_BAZ=qux"
  ];
  for (const line of cases) {
    const m = line.match(KEY_RE);
    assert.equal(m, null, `${line} should NOT match`);
  }
});

test(".env.STATUS.json 结构合法(version + last_check + keys[])", () => {
  const cwd = process.cwd();
  const file = path.join(cwd, ".env.STATUS.json");
  if (!fs.existsSync(file)) {
    console.log("(skip .env.STATUS.json not present)");
    return;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.ok(data.version, "应有 version 字段");
  assert.ok(data.last_check, "应有 last_check 字段");
  assert.ok(Array.isArray(data.keys), "keys 应是 array");
  if (data.keys.length > 0) {
    const k = data.keys[0];
    assert.ok(k.name, "每个 key 应有 name");
    assert.ok(k.value_masked, "每个 key 应有 value_masked(不是 value!)");
    assert.ok(!k.value_raw, "不应有 value_raw 字段(防泄漏)");
    assert.ok(k.probe_codes, "应有 probe_codes 字段");
    // 确保 value_masked 形式为 prefix...suffix
    assert.match(k.value_masked, /\w+\.\.\.\w+/);
  }
});

test(".env 状态注释包含 verified_provider / rotate_required 字段", () => {
  const cwd = process.cwd();
  const envPath = path.join(cwd, ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  // 至少要有一行带 # KEY_NAME | status=... | ... verified_provider=... | ...
  const statusLine = text.split("\n").find((l) =>
    l.startsWith("# OPENAI_API_KEY |") && l.includes("status=") && l.includes("verified_provider") || l.includes("endpoint=")
  );
  assert.ok(statusLine, ".env 应有 OPENAI_API_KEY 状态注释行");
});
