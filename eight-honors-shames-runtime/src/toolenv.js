import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { withSecret } from "./env.js";

// ============ 工具定义（Anthropic tool use 格式）============
export const TOOLS = [
  {
    name: "read_file",
    description: "读取文件内容。path 相对于项目根。",
    input_schema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
  },
  {
    name: "list_files",
    description: "列出目录下的文件（相对路径）。",
    input_schema: { type: "object", properties: { dir: { type: "string" }, depth: { type: "number", description: "递归深度, 默认1" } }, required: ["dir"] }
  },
  {
    name: "write_file",
    description: "写入文件内容（覆盖）。path 相对于项目根。",
    input_schema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] }
  },
  {
    name: "run_command",
    description: "在项目根运行 shell 命令（如 git status, git diff, npm test）。",
    input_schema: { type: "object", properties: { command: { type: "string" } }, required: ["command"] }
  }
];

// ============ 工具执行器 ============
export function executeTool(name, input, root) {
  try {
    switch (name) {
      case "read_file": {
        const file = path.join(root, String(input.path || ""));
        if (!fs.existsSync(file)) return { ok: false, error: `文件不存在: ${input.path}` };
        const content = fs.readFileSync(file, "utf8");
        return { ok: true, content: content.slice(0, 20000), truncated: content.length > 20000 };
      }
      case "list_files": {
        const dir = path.join(root, String(input.dir || "."));
        if (!fs.existsSync(dir)) return { ok: false, error: `目录不存在: ${input.dir}` };
        const depth = Math.min(Number(input.depth) || 1, 3);
        const walk = (d, level) => {
          if (level > depth) return [];
          const out = [];
          for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            if (entry.name === "node_modules" || entry.name === ".git") continue;
            const rel = path.relative(root, path.join(d, entry.name)).replace(/\\/g, "/");
            if (entry.isDirectory()) out.push(`${rel}/`, ...walk(path.join(d, entry.name), level + 1));
            else out.push(rel);
          }
          return out;
        };
        return { ok: true, files: walk(dir, 0) };
      }
      case "write_file": {
        const file = path.join(root, String(input.path || ""));
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, String(input.content || ""));
        return { ok: true, written: input.path };
      }
      case "run_command": {
        const cmd = String(input.command || "");
        let result;
        try {
          result = spawnSync(cmd, { cwd: root, encoding: "utf8", shell: true, timeout: 30000, maxBuffer: 2000000, windowsHide: true });
        } catch (e) {
          return { ok: false, error: `命令启动失败: ${e.message}` };
        }
        const stdout = (result.stdout || "").slice(0, 20000);
        const stderr = (result.stderr || "").slice(0, 5000);
        const exitCode = result.status ?? (result.error ? -1 : 0);
        if (result.error) return { ok: false, exitCode, stdout, stderr, error: `spawn error: ${result.error.message}` };
        return { ok: exitCode === 0, exitCode, stdout, stderr, truncated: (result.stdout || "").length > 20000 };
      }
      default:
        return { ok: false, error: `未知工具: ${name}` };
    }
  } catch (e) {
    return { ok: false, error: `工具执行异常: ${e.message}` };
  }
}

// ============ 单轮带工具调用 ============
async function callWithTools({ base, model, messages, maxTokens = 2048, timeoutMs = 90000 }) {
  const apiKey = process.env.MINIMAX_API_KEY;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(`${base.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: maxTokens, tools: TOOLS, messages }),
      signal: controller.signal
    });
    const data = await resp.json();
    if (resp.status !== 200) {
      const msg = data?.error?.message || `HTTP ${resp.status}`;
      throw new Error(`LLM HTTP ${resp.status}: ${msg}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ============ Agentic Loop ============
export async function runToolEnvTask({ base, model, task, root, maxSteps = 12, onStep, prepare }) {
  // prepare: 由调用方决定如何初始化 root（如复制模板+git init）
  if (prepare) {
    await prepare(root);
  } else {
    fs.rmSync(root, { recursive: true, force: true });
    fs.mkdirSync(root, { recursive: true });
  }

  const messages = [
    {
      role: "user",
      content: `你在一个真实的 Node.js 代码项目里完成任务。项目根目录: ${root}\n\n你可以使用工具: read_file, list_files, write_file, run_command。\n\n任务:\n${task}\n\n执行要求（重要）:\n1. 先用 read_file / list_files 探索代码，理解现状\n2. 用 write_file 修改代码完成任务（这是核心，必须实际写文件）\n3. 用 run_command 运行测试验证（如: node --test test/*.test.js 或 npm test）\n4. 测试通过后停止，用一句话总结你改了什么\n\n注意:\n- 不要只探索和跑测试，必须用 write_file 实际完成修改\n- 测试失败时，读取失败原因，修改代码，再测，直到通过\n- 如果遇到 npm/环境问题，用 run_command 排查（如 npm install）`
    }
  ];

  const steps = [];
  let lastText = "";
  let finalUsage = null;

  for (let step = 0; step < maxSteps; step += 1) {
    const data = await callWithTools({ base, model, messages });
    finalUsage = data.usage;
    const content = data.content || [];
    const textBlocks = content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
    const toolUses = content.filter((c) => c.type === "tool_use");

    // 记录文本
    if (textBlocks) {
      lastText = textBlocks;
      steps.push({ step, kind: "text", text: textBlocks.slice(0, 500) });
    }

    // 没有工具调用 → 结束
    if (!toolUses.length || data.stop_reason !== "tool_use") {
      break;
    }

    // 执行工具
    const results = [];
    for (const tu of toolUses) {
      const exec = executeTool(tu.name, tu.input, root);
      results.push({ tu, exec });
      steps.push({ step, kind: "tool", name: tu.name, input: tu.input, ok: exec.ok });
      onStep?.(step, tu.name, tu.input, exec);
    }

    // 拼回 tool_result
    const toolResultBlocks = results.map(({ tu, exec }) => ({
      type: "tool_result",
      tool_use_id: tu.id,
      content: exec.ok ? (exec.content ?? exec.stdout ?? JSON.stringify(exec).slice(0, 5000)) : `ERROR: ${exec.error}`
    }));
    messages.push(
      { role: "assistant", content: content.map((c) => (c.type === "tool_use" ? c : { type: "text", text: c.text })) },
      { role: "user", content: toolResultBlocks }
    );
  }

  return { steps, lastText, usage: finalUsage };
}

// ============ 采集 git diff / 测试 ============
export function collectToolEnvMetrics(root) {
  const gitDiff = spawnSync("git", ["-C", root, "diff", "--stat"], { encoding: "utf8" });
  const gitStatus = spawnSync("git", ["-C", root, "status", "--short"], { encoding: "utf8" });
  const changedFiles = (gitStatus.stdout || "").split(/\r?\n/).filter(Boolean).length;
  const deps = (() => {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
      return { dependencies: Object.keys(pkg.dependencies || {}), devDependencies: Object.keys(pkg.devDependencies || {}) };
    } catch { return { dependencies: [], devDependencies: [] }; }
  })();
  return { diffStat: gitDiff.stdout.trim(), changedFiles, deps };
}
