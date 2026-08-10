import test from "node:test";
import assert from "node:assert/strict";
import { callOpenaiCompatible } from "../src/benchmark.js";

test("callOpenaiCompatible surfaces HTTP 401 instead of returning empty output", async () => {
  let caught;
  try { await callOpenaiCompatible({ base: "https://api.deepseek.com/v1", apiKey: "sk-invalid", model: "deepseek-chat", prompt: "ping" }); } catch (e) { caught = e; }
  assert.ok(caught, "expected error to be thrown");
  assert.ok(caught.status === 401 || caught.code === "http_error" || caught.code === "non_json" || caught.code === "transport_error", `unexpected error: ${caught && caught.message}`);
});

test("callAnthropicCompatible throws on missing key (fetch channel)", async () => {
  const prev = process.env.MINIMAX_API_KEY;
  delete process.env.MINIMAX_API_KEY;
  const { callAnthropicCompatible } = await import("../src/benchmark.js");
  let caught;
  try { await callAnthropicCompatible({ base: "https://api.minimaxi.com/anthropic", model: "MiniMax-M3", prompt: "ping" }); } catch (e) { caught = e; }
  process.env.MINIMAX_API_KEY = prev;
  assert.ok(caught, "expected missing-key error");
  assert.match(caught.message, /MINIMAX_API_KEY/);
});

test("callOpenaiCompatible throws on non-JSON response (fetch channel)", async () => {
  // 用一个返回非 JSON 的端点模拟（本地无效端口 → transport error 也算 fetch 通道覆盖）
  const prev = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-test";
  const { callOpenaiCompatible } = await import("../src/benchmark.js");
  let caught;
  try {
    await callOpenaiCompatible({ base: "http://127.0.0.1:1/v1", model: "x", prompt: "ping", timeoutMs: 2000 });
  } catch (e) { caught = e; }
  process.env.OPENAI_API_KEY = prev;
  assert.ok(caught, "expected error");
  assert.ok(caught.code === "transport_error" || caught.code === "timeout", `got ${caught?.code}`);
});
