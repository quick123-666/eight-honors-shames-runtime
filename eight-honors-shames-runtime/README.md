<p align="center">
  <h1 align="center">八荣八耻 Runtime</h1>
  <p align="center"><em>把项目级 AI 协作纪律变成可注入、可查询、可审计、可基准测试的运行时。</em></p>
  <p align="center">
    <strong>规则注入省 97% · 真实工具环境可测 · 20 条准则单一来源</strong><br>
    <sub>注入成本为本机脚本实测（RULES.md 20 条，12,639 字符）；工具环境为真实 MiniMax-M3 agentic 循环结果</sub>
  </p>
</p>

---

## 这是什么

八荣八耻 Runtime 把 [`RULES.md`](../RULES.md)（项目 AI 协作纪律，20 条准则）升级为可运行的 Pi 扩展：

```text
规则 → 单一来源 RULES.md
   ↓ 注入分层
session_start: 全文一次 + 每轮摘要 + 门禁
   ↓ 工具
/ rules 命令 · MCP 工具 · 审计 · 验收 · benchmark
```

**不复制规则正文**：任何宿主都从 `RULES.md` 读取，杜绝漂移。

---

## 真实数据

### 注入成本（本机脚本实测）

RULES.md 全文：12,639 字符。旧设计每轮注入全文 vs 新设计（session 一次 + 每轮摘要）：

| 模式 | 每轮注入 | 12 次注入累计 | 节省 | 100 轮累计 | 节省 |
|---|---:|---:|---:|---:|---:|
| lite | 188 B | 8,148 tok | **82.1%** | 9,376 tok | **97.5%** |
| full | 252 B | 8,340 tok | **81.7%** | 11,277 tok | **97.0%** |
| ultra | 293 B | 8,463 tok | **81.4%** | 12,494 tok | **96.7%** |
| off | 0 | 0 | 100% | 0 | 100% |

### 工具环境真实结果（MiniMax-M3 agentic 循环）

场景 `reuse-existing`（加 /api/users 过滤，禁止重复实现）：

```text
步骤: 探索(list_files) → 理解(read_file ×5) → 现状(npm test 失败, 定位 bug)
      → 修改(write_file app.js) → 复测(All 3 tests pass)
diff: 1 file changed, 3 insertions(+), 4 deletions(-)
依赖: 0 新增（复用现有 filterActive.js）
token: input 168 / output 76（缓存 2747）
耗时: 33s
```

模型自主：探索 → 定位根因（normalize 先于 filter 导致 active 丢失）→ 复用现有函数 → 最小改动 → 测试通过。**这是工具环境版 benchmark 的核心能力：模型有 read/edit/git 时能真实执行八荣八耻（先查、复用、验证）。**

### 对照：off vs full（fake-express-app，有工具的真实 Pi 环境）

| 指标 | off | full |
|---|---:|---:|
| 改动行 | 18 | 43 |
| 集成测试 | 1 | 3 |
| 覆盖分支 | active=true | true/false/未传 |
| 边界防御 | 无 | parseActive |

> 八荣八耻 ≠ 少写代码。full 模式多写是因为**完整版要求**（准则 12/13）：补边界、补测试、防非法输入。

---

## 安装

### Pi

```bash
# 项目内启用扩展
pi install ./eight-honors-shames-runtime
```

或手动：把 `pi-extension/` 加入 Pi 扩展配置，`skills/` 加入技能目录。

### MCP 宿主

```bash
cd mcp && npm install
npx eight-honors-shames-mcp   # stdio, 只读
```

暴露工具：`rules_summary` / `rules_full` / `rules_status`。

### 其他宿主

见 [`docs/portability.md`](docs/portability.md)（8 宿主适配表：Claude Code / Codex / OpenCode / Gemini / OpenClaw / Cursor 等）。

---

## 命令

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

## 开发

```bash
npm test                 # 单元测试（20 个）
npm run check            # 测试 + 规则校验 + 注释校验
npm run benchmark        # deterministic benchmark（无 LLM，管线自检）
npm run accept           # 质量门禁

# 真实工具环境 benchmark（需 MiniMax 凭据，自动读 ~/.pi/agent/auth.json）
SCENARIO=reuse-existing MODE=lite node scripts/run-toolenv-smoke.js
```

### 凭据

benchmark 自动从 `~/.pi/agent/auth.json` 读取 MiniMax key（`minimax-cn`），**不落盘、不进对话**。也可用环境变量：

```bash
export MINIMAX_API_KEY=... MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic MINIMAX_MODEL=MiniMax-M3
```

---

## 架构

```text
src/core.js        规则读取 + 模式仲裁 + 注入构建（合并自 rules/config/mode）
src/env.js         凭据代理 + dotenv（合并自 env/dotenv/secrets）
src/acceptance.js  验收状态 + 报告（合并自 state/acceptance）
src/lifecycle.js   注入分层（session 全文 / 每轮摘要 / 门禁）
src/audit.js       git diff 审计
src/benchmark.js   评分 + 双通道 LLM 调用（fetch）
src/toolenv.js     agentic 工具循环（read/list/write/run_command）
src/annotations.js eight-rules: 注释校验
hooks/index.js     多宿主生命周期钩子
mcp/server.js      MCP 只读工具
commands/          /rules 命令定义
skills/            5 个技能（review/audit/acceptance/benchmark/annotation）
```

---

## 项目约束（硬性）

```text
1. 不推送任何远程仓库（仅本地）
2. 禁止精简系统（模块/能力保持完整）
3. 规则单一来源 = ../RULES.md，任何适配不内嵌副本
4. 凭据只走环境变量/平台凭据库
```

---

## 文档

- [审计报告（2026-08-10）](docs/audit-2026-08-10.md)：量化声明核验 + 编造清单
- [注入分层设计](docs/injection.md)
- [基准方法](docs/benchmark-methodology.md)
- [决策注释规范](docs/annotation-spec.md)
- [多平台适配](docs/portability.md)
- [质量门禁](docs/quality-gates.md)
- [规则同步](docs/rule-sync.md)

---

*MIT · 八荣八耻 Runtime v0.2.1 · 规则来源: ../RULES.md (20 条准则)*
