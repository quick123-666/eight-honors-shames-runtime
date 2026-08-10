import test from "node:test";
import assert from "node:assert/strict";
import { callOpenaiCompatible } from "../src/benchmark.js";

test("callOpenaiCompatible surfaces HTTP 401 instead of returning empty output", async () => {
  let caught;
  try { await callOpenaiCompatible({ base: "https://api.deepseek.com/v1", apiKey: "sk-invalid", model: "deepseek-chat", prompt: "ping" }); } catch (e) { caught = e; }
  assert.ok(caught, "expected error to be thrown");
  assert.ok(caught.status === 401 || caught.code === "http_error" || caught.code === "non_json" || caught.code === "transport_error", `unexpected error: ${caught && caught.message}`);
});
