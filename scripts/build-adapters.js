//! build-adapters — 从单一源(RULES.md + AGENTS.md)生成各 AI 工具的适配文件
//!
//! 不同 AI 软件需要的"规则 md"不一样:
//!   - Codex / OpenCode / 通用标准  → AGENTS.md
//!   - Claude Code                  → CLAUDE.md
//!   - Google Gemini CLI            → GEMINI.md
//!   - GitHub Copilot               → .github/copilot-instructions.md
//!   - Cursor                       → .cursorrules
//!   - Windsurf                     → .windsurfrules
//!   - Cline / Roo Code             → custom-instructions.md
//!   - QClaw / OpenClaw(skill)      → qclaw-eight-honors.SKILL.md
//!
//! 原则:每个适配文件只含 21 条精简命令式 + 指向 RULES.md,不复制完整正文
//! (单一来源,杜绝漂移)。用法:
//!   node scripts/build-adapters.js [--out <dir>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** 适配目标:文件名 → 工具名 */
export const ADAPTER_TARGETS = {
  "AGENTS.md": "Codex / OpenCode / 通用(AGENTS.md 标准)",
  "CLAUDE.md": "Claude Code",
  "GEMINI.md": "Google Gemini CLI",
  "copilot-instructions.md": "GitHub Copilot",
  ".cursorrules": "Cursor",
  ".windsurfrules": "Windsurf",
  "custom-instructions.md": "Cline / Roo Code",
  "qclaw-eight-honors.SKILL.md": "QClaw / OpenClaw (always-load skill)",
};

/** 从 AGENTS.md 提取 21 条精简命令式("> N. ..." 行),去掉 "> " 前缀 */
export function extractPrinciples(agentsPath) {
  const text = fs.readFileSync(agentsPath, "utf8");
  const lines = [...text.matchAll(/^> (\*?\*?\d+\*?\*?\. .+)$/gm)].map((m) => m[1].trim());
  if (lines.length < 21) {
    throw new Error(`AGENTS.md 精简清单不完整: 只提取到 ${lines.length} 条(期望 ≥21)`);
  }
  return lines.slice(0, 21);
}

/** 生成全部适配文件;返回写入的文件绝对路径列表 */
export function buildAdapters({ root, out }) {
  const agentsPath = path.join(root, "AGENTS.md");
  const rulesPath = path.join(root, "RULES.md");
  const rulesSize = fs.statSync(rulesPath).size;
  const principles = extractPrinciples(agentsPath);
  fs.mkdirSync(out, { recursive: true });

  const written = [];
  for (const [file, tool] of Object.entries(ADAPTER_TARGETS)) {
    const body = principles.map((p) => `> ${p}`).join("\n");
    const isQclaw = file === "qclaw-eight-honors.SKILL.md";
    const content = isQclaw
      ? buildQclawSkill({ principles, rulesSize, tool })
      : [
          `<!-- 本文件由 scripts/build-adapters.js 自动生成,请勿手改;改 AGENTS.md / RULES.md 后重跑。 -->`,
          `# 八荣八耻 AI 编程纪律 — ${tool}`,
          ``,
          `> 精简命令式 21 条(适用于 ${tool});完整版(含耻/荣/逻辑/判断标准)见仓库根 [RULES.md](./RULES.md)(${rulesSize} 字节,单一来源,杜绝漂移)。`,
          ``,
          body,
          ``,
        ].join("\n");
    const dest = path.join(out, file);
    fs.writeFileSync(dest, content);
    written.push(dest);
  }
  return written;
}

/**
 * 生成 QClaw / OpenClaw 的 always-load skill 模板(SKILL.md)。
 * 与其他适配器同源:21 条精简命令式 + RULES.md 指针,不复制完整正文。
 * 部署:拷贝为 ~/.qclaw/skills/qclaw-eight-honors/SKILL.md,并在
 * ~/.qclaw/openclaw.json 的 agents.list[].skills 注册 "qclaw-eight-honors"。
 */
export function buildQclawSkill({ principles, rulesSize, tool }) {
  const body = principles.map((p) => `> ${p}`).join("\n");
  return [
    `---`,
    `name: qclaw-eight-honors`,
    `description: |`,
    `  [八荣八耻 SYSTEM RULES - MANDATORY - ALWAYS LOAD - DO NOT SKIP]`,
    `  QClaw 基础工程纪律,每次会话强制加载,优先级高于普通 skill。`,
    `  含 21 条精简命令式 + 完整版 RULES.md 指针(单一来源,杜绝漂移)。`,
    `metadata:`,
    `  openclaw:`,
    `    emoji: "🏆"`,
    `    always: true`,
    `---`,
    ``,
    `<!-- 本文件由 scripts/build-adapters.js 自动生成,请勿手改;改 AGENTS.md / RULES.md 后重跑。 -->`,
    `# 八荣八耻 AI 编程纪律 — ${tool}`,
    ``,
    `## ⚠️ SYSTEM RULES — 强制执行,不可跳过`,
    ``,
    `- **强制加载**:每次会话自动加载(frontmatter 的 always 标记),不可卸载或禁用`,
    `- **最高优先级**:与其他 skill 冲突时,以本规则为准(八荣八耻为价值观级纪律)`,
    `- **无条件遵守**:所有任务都必须遵守,不可以任何理由跳过`,
    `- **违规即错误**:任何违反本规则的输出视为系统错误,必须立即纠正`,
    ``,
    `> 精简命令式 21 条(适用于 ${tool});完整版(含耻/荣/逻辑/判断标准)见仓库根 [RULES.md](./RULES.md)(${rulesSize} 字节,单一来源,杜绝漂移)。`,
    ``,
    body,
    ``,
    `## 输出骨架(简版)`,
    ``,
    `思考过程必须**对用户可见**:A 事实档 = 结论 + 证据;`,
    `B 分析档 = 三栏(已知/未知/假设)+ 每条假设标 80%/50%/30% 信心度 + 大白话结论;`,
    `C 决策档 = B 全部 + 2-3 方案 + 推荐 + 工作量 + 量化风险 + 边界三选(做/不做/待定)+ 备份与回滚命令 + 反思。`,
    ``,
    `## 防空转(简版)`,
    ``,
    `每轮结尾必须是三种终止标记之一:`,
    `[已完成 X · 等待 Y] / [需要您确认 Z] / [空转阻断 · 本轮无新动作];`,
    `禁止悬停;冲突时按 "3 对齐 > 5 候选 > 23 执行" 处理,5+3 合并。`,
    ``,
  ].join("\n");
}

// CLI 入口
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(HERE, "..");
  const argOut = process.argv.indexOf("--out");
  const out = argOut >= 0 ? path.resolve(process.argv[argOut + 1]) : path.join(root, "adapters");
  const written = buildAdapters({ root, out });
  console.log(`✅ 生成 ${written.length} 个适配文件 → ${out}`);
  for (const f of written) console.log(`  - ${path.relative(root, f)}`);
}
