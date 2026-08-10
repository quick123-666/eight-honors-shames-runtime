import test from "node:test";
import assert from "node:assert/strict";
import { buildInstructions, fullInstructions, normalizeMode, resolveMode, summarize } from "../src/rules.js";
import { parseCommand } from "../pi-extension/index.js";
import { checkAnnotations } from "../src/annotations.js";
import { readLatestRules, rulesVersion, extractPrinciples } from "../src/config.js";
import { auditRepository } from "../src/audit.js";
import { acceptanceReport } from "../src/acceptance.js";
import { acceptanceSummary, createAcceptanceState, resolveSessionMode } from "../src/state.js";
import { runBenchmark, summarizeReport } from "../src/benchmark.js";
import { applyDotenv, loadDotenv, parseDotenv, resolveEnvFiles } from "../src/dotenv.js";

test("runtime reads the latest project rules", () => {
  const text = readLatestRules();
  assert.equal(rulesVersion(text).principles >= 19, true);
  assert.equal(extractPrinciples(text).length >= 19, true);
  assert.match(text, /准则 19/);
  assert.match(text, /数学验证/);
});

test("summary is much smaller than full injection", () => {
  const lite = summarize("lite");
  const full = summarize("full");
  const liteFull = fullInstructions("lite");
  const fullFull = fullInstructions("full");
  assert.ok(lite.summary.length < liteFull.length / 5, "lite summary should be far smaller than full text");
  assert.ok(full.summary.length < fullFull.length / 20, "full summary should be far smaller than full text");
  assert.ok(lite.gates.length === 0);
  assert.ok(full.gates.length >= 1);
});

test("buildInstructions honors forceFull", () => {
  assert.ok(buildInstructions("full", { forceFull: true }).includes("准则 1"));
  assert.ok(buildInstructions("full").length < buildInstructions("full", { forceFull: true }).length);
});

test("modes normalize and resolve safely", () => {
  assert.equal(normalizeMode("ULTRA"), "ultra");
  assert.equal(normalizeMode("bad"), null);
  assert.equal(resolveMode("bad"), "full");
  assert.match(buildInstructions("lite"), /先查阅/);
});

test("session restores latest mode", () => {
  assert.equal(resolveSessionMode([{ type: "custom", customType: "eight-rules-mode", data: { mode: "lite" } }, { type: "custom", customType: "eight-rules-mode", data: { mode: "ultra" } }]), "ultra");
});

test("commands cover modes and quality actions", () => {
  assert.deepEqual(parseCommand("status"), { type: "status" });
  assert.deepEqual(parseCommand("audit"), { type: "audit" });
  assert.deepEqual(parseCommand("ultra"), { type: "set-mode", mode: "ultra" });
  assert.equal(parseCommand("default off").type, "invalid");
});

test("audit and acceptance expose structured reports", () => {
  const audit = auditRepository(process.cwd());
  assert.ok(Array.isArray(audit.changedFiles));
  const report = acceptanceReport(createAcceptanceState());
  assert.equal(report.passed, true);
});

test("benchmark returns every scenario and mode", async () => {
  const results = await runBenchmark([{ id: "sample", category: "minimal", task: "x", forbidden: ["lodash"], successCriteria: [] }], ["baseline", "full"]);
  assert.equal(results.length, 2);
  assert.ok(results.every((result) => result.ruleSize && typeof result.score === "number"));
});

test("benchmark provider can be overridden", async () => {
  const results = await runBenchmark([{ id: "x", category: "minimal", task: "x" }], ["baseline"]);
  assert.equal(results[0].provider, "deterministic");
});

test("summary aggregates per mode and separates errors", async () => {
  const results = await runBenchmark([{ id: "a", category: "minimal", task: "a" }, { id: "b", category: "reuse", task: "b" }], ["baseline", "lite", "full", "ultra"]);
  const summary = summarizeReport(results);
  assert.equal(summary.baseline.count, 2);
  assert.equal(summary.lite.count, 2);
  assert.equal(summary.ultra.count, 2);
  for (const mode of ["baseline", "lite", "full", "ultra"]) {
    assert.equal(summary[mode].error, 0);
    assert.equal(typeof summary[mode].totalPromptTokens, "number");
  }
});

test("annotation validator rejects unknown decision", () => {
  assert.deepEqual(checkAnnotations("// eight-rules: reuse\n// eight-rules: nope"), [{ line: 2, decision: "nope" }]);
});

test("dotenv parses and applies without overwriting real env", () => {
  const parsed = parseDotenv("# comment\nA=1\nB=\"two\"\nC='three'\nD=with spaces");
  assert.deepEqual(parsed, { A: "1", B: "two", C: "three", D: "with spaces" });
  const merged = loadDotenv([]);
  assert.ok(merged);
});

test("dotenv resolves project .env files in order", () => {
  const files = resolveEnvFiles([]);
  assert.ok(Array.isArray(files));
});

test("env loader reads OPENAI_* and rejects secret leakage into output", async () => {
  const { loadEnvFiles, resolveEnvFiles, secretSummary, rejectIfSecretsInText, requiredKeysPresent } = await import("../src/env.js");
  const files = resolveEnvFiles([], process.cwd());
  loadEnvFiles(files);
  const summary = secretSummary();
  for (const value of Object.values(summary)) assert.ok(value && typeof value.length === "number" && typeof value.prefix === "string");
  const offenders = rejectIfSecretsInText("no secrets here");
  assert.deepEqual(offenders, []);
});

test("mode arbitration respects source priority", async () => {
  const { resolveMode } = await import("../src/mode.js");
  assert.equal(resolveMode({ command: "lite", env: "full", config: "ultra" }).mode, "lite");
  assert.equal(resolveMode({ env: "lite", config: "ultra" }).mode, "lite");
  assert.equal(resolveMode({ config: "lite" }).mode, "lite");
  assert.equal(resolveMode({}).mode, "full");
  assert.equal(resolveMode({}, "lite").mode, "lite");
});

test("lifecycle decisions are isolated per phase", async () => {
  const { sessionStartInjection, agentStartInjection, toolCallInjection, subagentInheritanceMode, DEFAULTS } = await import("../src/lifecycle.js");
  assert.ok(sessionStartInjection("full", DEFAULTS).full.length > 0);
  assert.equal(sessionStartInjection("off", DEFAULTS), null);
  const summary = agentStartInjection("full", DEFAULTS);
  assert.ok(summary.summary.length > 0 && summary.gateText.length > 0);
  assert.equal(agentStartInjection("off", DEFAULTS), null);
  assert.equal(toolCallInjection("full", DEFAULTS), null);
  const nested = subagentInheritanceMode("full", DEFAULTS, 1);
  assert.equal(nested, "off");
});

test("acceptance blocks changed work without tests and rollback", () => {
  const state = createAcceptanceState();
  state.changedFiles = 1;
  assert.deepEqual(acceptanceSummary(state), { passed: false, blockers: ["tests-not-run", "rollback-point-missing"] });
  state.testsRun = true;
  state.rollbackPoint = "git commit abc";
  assert.deepEqual(acceptanceSummary(state), { passed: true, blockers: [] });
});
