import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runToolEnvTask, collectToolEnvMetrics } from "../src/toolenv.js";

// 冒烟: 单场景单模式跑一遍工具环境
async function main() {
  const home = process.env.USERPROFILE || process.env.HOME;
  const auth = JSON.parse(fs.readFileSync(path.join(home, ".pi", "agent", "auth.json"), "utf8"));
  process.env.MINIMAX_API_KEY = auth["minimax-cn"]?.key;
  process.env.MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com/anthropic";
  process.env.MINIMAX_MODEL = process.env.MINIMAX_MODEL || "MiniMax-M3";

  const scenarios = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../benchmarks/scenarios/scenarios.json"), "utf8"));
  const scenario = scenarios.find((s) => s.id === process.env.SCENARIO || "reuse-existing");
  const mode = process.env.MODE || "lite";
  const template = path.resolve(import.meta.dirname, "../benchmarks/real/fake-express-app");
  const workRoot = path.resolve(import.meta.dirname, "../benchmarks/real/scratch/work");

  console.log(`[tool-env] 场景: ${scenario.id} | 模式: ${mode} | 模型: MiniMax-M3`);
  console.log(`模板: ${template}`);
  console.log(`工作区: ${workRoot}`);

  // 从模板复制初始项目（含 git 历史 baseline）
  const prepare = (work) => {
    fs.rmSync(work, { recursive: true, force: true });
    fs.cpSync(template, work, { recursive: true, filter: (src) => !src.includes("node_modules") && !src.includes(path.sep + ".git") && !src.endsWith(".git") });
    spawnSync("git", ["init", "-q"], { cwd: work });
    spawnSync("git", ["-c", "user.email=bench@local", "-c", "user.name=bench", "add", "-A"], { cwd: work });
    spawnSync("git", ["-c", "user.email=bench@local", "-c", "user.name=bench", "commit", "-q", "-m", "baseline"], { cwd: work });
    // 预装依赖，避免任务卡在 npm install（express 是测试必需）
    console.log("  预装依赖...");
    const inst = spawnSync("npm.cmd", ["install", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: work, encoding: "utf8", timeout: 120000, shell: true });
    if (inst.status !== 0 && inst.status !== null) console.warn("  npm install 警告:", (inst.stderr || "").slice(0, 300));
    // 安装后再 commit 一次（node_modules 不入 git，但锁文件保留）
    spawnSync("git", ["-c", "user.email=bench@local", "-c", "user.name=bench", "add", "-A"], { cwd: work });
    spawnSync("git", ["-c", "user.email=bench@local", "-c", "user.name=bench", "commit", "-q", "-m", "deps"], { cwd: work });
  };
  prepare(workRoot);

  // 任务描述（含禁止项和成功标准）
  const task = `${scenario.task}\n\n成功标准:\n${(scenario.successCriteria || []).map((c) => `- ${c}`).join("\n")}\n\n禁止:\n${(scenario.forbidden || []).map((c) => `- ${c}`).join("\n")}`;

  const start = Date.now();
  const result = await runToolEnvTask({
    base: process.env.MINIMAX_BASE_URL,
    model: process.env.MINIMAX_MODEL,
    task,
    root: workRoot,
    maxSteps: Number(process.env.MAX_STEPS || 12),
    prepare,
    onStep: (step, name, input, exec) => {
      console.log(`  [step ${step}] ${name} ${JSON.stringify(input)} → ${exec.ok ? "ok" : "FAIL"}`);
    }
  });
  const durationMs = Date.now() - start;
  const metrics = collectToolEnvMetrics(workRoot);

  const report = {
    scenario: scenario.id,
    mode,
    durationMs,
    stepCount: result.steps.length,
    usage: result.usage,
    lastText: result.lastText.slice(0, 500),
    metrics
  };
  console.log("\n=== 结果 ===");
  console.log(JSON.stringify(report, null, 2));
  const outDir = path.resolve(import.meta.dirname, "../benchmarks/reports");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `toolenv-${scenario.id}-${mode}.json`), JSON.stringify(report, null, 2));
  console.log(`\n报告: benchmarks/reports/toolenv-${scenario.id}-${mode}.json`);
}

main().catch((e) => { console.error("tool-env 冒烟失败:", e.message); process.exit(1); });
