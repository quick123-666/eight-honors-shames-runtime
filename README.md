<div align="center">

[English](./README_EN.md) | **简体中文**

# 🎌 八荣八耻 · AI 编程核心价值观

### 把 AI 协作纪律工程化：单一来源 · 可注入 · 可审计 · 可基准测试 · 可验收

**21 条准则 · 跨项目核心价值观 · 规则注入省 81%+ token · 8+ AI 工具即装即用**

[![Version](https://img.shields.io/badge/version-v1.1.0-blue)](./package.json)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-27%20passed-brightgreen)](./tests)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)](./package.json)
[![AI Tools](https://img.shields.io/badge/AI_Tools-8+-purple)](#安装各-ai-工具配置哪个-md)

<br/>

**问 Cursor 怎么写代码，它跳过测试直接交？**
**让 Claude Code 改文件，它不查现有实现就硬编新接口？**
**Copilot 生成代码，遇到边界情况直接 panic？**

通用大模型没有内置你的协作纪律。八荣八耻把 **21 条工程级 AI 协作准则**工程化成一份可运行的运行时——任何 AI 工具装上后，都会像遵守团队规范的工程师一样工作：先查、对齐、复用、验证、备份、完整交付。

**一份单一来源，自动适配 8+ AI 工具。** 不同软件需要配置的规则文件不一样，本项目一条命令生成全部。

<br/>

[🚀 快速开始](#-快速开始) · [🔧 安装(各 AI 工具配置哪个 md?)](#-安装各-ai-工具配置哪个-md) · [✅ 验证是否生效](#-验证是否生效) · [📖 命令](#-命令) · [📊 实测数据](#-实测数据) · [🏗️ 架构](#️-架构)

</div>

---

## ⚡ 快速开始（30 秒）

```bash
git clone https://github.com/quick123-666/eight-honors-shames-runtime.git
cd eight-honors-shames-runtime
npm install
npm run adapters      # 生成 8+ 工具适配文件 → adapters/
npm test              # 27 个测试,验证安装配置正确
```

---

## 🔧 安装(各 AI 工具配置哪个 md?)

> **不同 AI 软件读取的规则文件不一样**：有的认 `AGENTS.md`，有的认 `CLAUDE.md`，有的认 `.cursorrules`…本项目从**单一来源**(`RULES.md` + `AGENTS.md`)自动生成各工具的适配文件，只含 21 条精简命令式、指向完整版——**零漂移**。

### 1. 生成适配文件

```bash
npm run adapters     # 生成到 adapters/ 目录(可重复运行,自动同步)
```

### 2. 各工具配置表

| 工具 | 要配置的文件 | 放置位置 | 说明 |
|---|---|---|---|
| **Pi** | `AGENTS.md` + `pi-extension/` | 项目根 / `~/.pi/agent` | 仓库自带,`pi install .` 一键启用 |
| **Claude Code** | `CLAUDE.md` | 项目根目录 | 会话自动加载 |
| **Google Gemini CLI** | `GEMINI.md` | 项目根或 `~/.gemini/GEMINI.md`(全局) | 读取任一路径 |
| **GitHub Copilot** | `.github/copilot-instructions.md` | 项目根 `.github/` | 仓库内始终生效 |
| **Cursor** | `.cursorrules`(或 `.cursor/rules/*.mdc`) | 项目根目录 | 始终生效 |
| **Windsurf** | `.windsurfrules` | 项目根目录 | 始终生效 |
| **Cline / Roo Code** | `custom-instructions.md` | 设置 → Custom Instructions | 按工作区或全局 |
| **Codex / OpenCode / 通用** | `AGENTS.md` | 项目根目录 | 遵循 [AGENTS.md](https://agents.md) 标准 |

```bash
# 示例:为 Claude Code 和 Cursor 安装
cp adapters/CLAUDE.md ../你的项目/CLAUDE.md
cp adapters/.cursorrules ../你的项目/.cursorrules
# 完整 21 条版放在你项目的 RULES.md(可选,适配文件会自动指向它)
cp RULES.md ../你的项目/RULES.md
```

> 💡 适配文件只含 21 条精简命令式 + 指向 `RULES.md`。把 `RULES.md` 一起放进项目即可获得完整版(耻/荣/逻辑/判断标准)。

### 3. 接入 Pi(完整运行时,推荐)

```bash
pi install .          # 启用扩展 + 5 技能
# 或手动:pi-extension/ 加入扩展配置,skills/ 加入技能目录
```

### 4. 接入 MCP 宿主

```bash
cd mcp && npm install
npx eight-honors-shames-mcp   # stdio, 只读
```

暴露工具：`rules_summary` / `rules_full` / `rules_status`。

---

## ✅ 验证是否生效

装完后向你的 AI 工具提问：

> **"八荣八耻有哪些准则？"**

- ✅ 生效：能说出 21 条核心（先查、对齐、复用、验证、完整版、协助到底…）
- ❌ 未生效：回答泛泛（"这是道德规范…"）→ 检查文件位置是否匹配上表

---

## 📖 命令

| 命令 | 作用 |
|---|---|
| `/rules status` | 当前模式 + 默认 + 规则版本 + 工具统计 |
| `/rules lite\|full\|ultra\|off` | 设置规则强度 |
| `/rules default <mode>` | 设置默认模式 |
| `/rules audit` | 审计当前 diff（变更文件/删除风险）|
| `/rules accept` | 验收门禁（测试/回滚点检查）|
| `/rules benchmark` | 跑 benchmark |
| `/rules help` | 命令帮助 |

模式语义：

```text
lite  核心摘要（查/对齐/复用/验证）
full  摘要 + 3 条门禁（默认）
ultra 摘要 + 4 条门禁（含测试/构建/回滚演练）
off   关闭注入，保留安全底线
```

---

## 📊 实测数据

### 注入成本（本机脚本实测）

RULES.md 21 条全文 13,196 字符。旧设计每轮注入全文 vs 新设计（session 一次 + 每轮摘要）：

| 模式 | 每轮注入 | 12 次注入累计 | 节省 | 100 轮累计 | 节省 |
|---|---:|---:|---:|---:|---:|
| lite | ~223 B | ~8.6K tok | **81.9%** | — | **~97%** |
| full | ~273 B | ~8.7K tok | **81.6%** | — | **~97%** |
| ultra | ~314 B | ~8.9K tok | **81.4%** | — | **~97%** |

### 完整版 vs 精简版（真实对照实验）

| 指标 | off | full |
|---|---:|---:|
| 改动行 | 18 | 43 |
| 集成测试 | 1 | 3 |
| 覆盖分支 | active=true | true/false/未传 |
| 边界防御 | 无 | parseActive |

> 八荣八耻 ≠ 少写代码。full 模式多写是因为**完整版要求**（准则 12/13）：补边界、补测试、防非法输入。

---

## 🏗️ 架构

```text
规则 → 单一来源 RULES.md（21 条）
   ↓ 注入分层
session_start 全文一次 + 每轮摘要 + 门禁
   ↓ 工具
/rules 命令 · MCP 工具 · 审计 · 验收 · benchmark
   ↓ 适配生成
npm run adapters → adapters/（8+ AI 工具的规则文件）
```

```
├── src/                 # 核心：注入/模式仲裁/审计/验收/benchmark/toolenv
├── scripts/             # CLI 脚本（check/adapters/benchmark/accept/smoke）
├── tests/               # 27 个测试（含适配文件安装配置测试）
├── adapters/            # 生成产物：8+ 工具的规则文件（勿手改）
├── mcp/                 # MCP server（stdio, 只读 3 工具）
├── hooks/               # 生命周期钩子（Claude Code 等）
├── commands/            # /rules 命令定义（5 个）
├── skills/              # 5 个 agent 技能
├── pi-extension/        # Pi 扩展桥接
├── benchmarks/          # benchmark 场景与报告
└── config/  docs/  annotations/
```

---

## 🛠️ 开发

```bash
npm test                 # 27 个测试（单元 + 适配文件安装配置测试）
npm run check            # 生成适配 + 测试 + 规则校验 + 注释校验
npm run adapters         # 重新生成 adapters/（改 RULES/AGENTS 后必跑）
npm run benchmark        # 确定性 benchmark（无 LLM,管线自检）
npm run accept           # 验收门禁
```

### 凭据（真实工具环境 benchmark）

```bash
export MINIMAX_API_KEY=... MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic MINIMAX_MODEL=MiniMax-M3
SCENARIO=reuse-existing MODE=lite node scripts/run-toolenv-smoke.js
```

> 兼容任意 OpenAI 兼容端点：`EIGHT_RULES_LLM=openai` + `OPENAI_BASE_URL` / `OPENAI_API_KEY`。

---

## 项目约束（硬性）

```text
1. 禁止精简系统：21 条完整版不缩水
2. 规则单一来源 = RULES.md：任何适配不得内嵌完整正文
3. 凭据只走环境变量/平台凭据库，不落 .env 明文
4. 删除必须可恢复；大改前建立快照
```

---

## 文档

| 文档 | 内容 |
|---|---|
| [`docs/portability.md`](docs/portability.md) | 8 宿主适配表（Pi/MCP/Claude Code/Codex/OpenCode/Gemini/OpenClaw/指令型）|
| [`docs/benchmark-methodology.md`](docs/benchmark-methodology.md) | benchmark 方法学 |
| [`docs/injection.md`](docs/injection.md) | 注入分层设计 |
| [`docs/lifecycle.md`](docs/lifecycle.md) | 生命周期钩子 |
| [`docs/rule-sync.md`](docs/rule-sync.md) | 单一来源同步机制 |
| [`docs/audit-2026-08-10.md`](docs/audit-2026-08-10.md) | 解释审计报告（AI 幻觉自查）|
| [`docs/THINKING_FORMAT.md`](docs/THINKING_FORMAT.md) | **v1.0.1+** Thinking 阶段标格式规约(让协作纪律可见可审计) |

---

## License

MIT © 2026 eight-honors-shames contributors
