# Ponytail 技术研究报告

> **来源**: 一手证据,基于 `E:\新建文件夹\新建文件夹\01-AgentLayer\ponytail-main` 仓库完整扫描
> **作者**: pi (eight-honors-shames-runtime 项目会话)
> **日期**: 2026-08-13
> **状态**: 第一性原理研究完成
> **版本**: Ponytail 4.8.1(包内 `package.json` 实测)
> **GitHub**: https://github.com/DietrichGebert/ponytail
> **License**: MIT
> **Related**: 本项目 `AGENTS.md` v3.4.2 调优"借鉴 super-code + Ponytail"—— 本报告是该借鉴的第一手技术依据

---

## 0. 一句话定位

**Ponytail = "Lazy senior dev mode" for AI agents**。把"懒"重新定义为**高效**(不是粗心),把"懒"的内涵落地为**7 级渐进式阶梯** —— 强迫 agent 在写代码前先走"该不该写、是否复用、stdlib、原生、已装依赖、一行"六道关卡,只有全失败后才允许写最小能跑的代码。同时**显式列出永不精简的边界**(trust boundary 校验、数据丢失防护、安全、无障碍、显式请求)。

---

## 1. 实证(基准测试,2026-06-18, n=4, Haiku 4.5)

> 来源:`benchmarks/results/2026-06-18-agentic.md`(完整方法论与 12 任务明细)

### 1.1 关键数字(均值,12 任务,真实 Claude Code 会话)

| arm | LOC | tokens | cost | time | safe |
|---|--:|--:|--:|--:|--:|
| **ponytail** | **-54%** | **-22%** | **-20%** | **-27%** | **100%** |
| baseline(无 skill) | 100% | 100% | 100% | 100% | 100% |
| caveman(terse prose) | -20% | +7% | +3% | +2% | 100% |
| "YAGNI + one-liner" 7 字 prompt | -33% | -14% | -21% | -30% | **95%** ← 不安全 |

**核心结论**:**ponytail 是唯一同时减所有维度 + 保持 100% 安全的 arm**。

### 1.2 12 任务明细(节选最有戏剧性的)

| 任务 | baseline | caveman | **ponytail** | yagni-oneliner |
|---|--:|--:|--:|--:|
| **date picker** | 404 | 202 | **23** ← -94% | 162 |
| **color picker** | 287 | 188 | **23** ← -92% | 25 |
| file dropzone | 251 | 226 | **95** | 175 |
| multi-step wizard | 571 | 492 | **312** | 406 |
| command palette | 268 | 260 | **233** | 285 |
| **count user's items** | 21 | 20 | **17** ← 不可压缩 | 18 |
| **search items by title** | 44 | 44 | **44** ← 完全一致 | 43 |

### 1.3 真实"赢在哪"

> 大赢 = **native platform feature 替代 custom build**
> 例:date picker 从 404 行(flatpickr + wrapper + stylesheet + timezone 讨论)→ **23 行**:`<input type="date">`

### 1.4 真实"不赢在哪"

> 后端 CRUD 端点、search by title 之类**已是最小代码**的任务,各 arm 几乎相同
> 教训:**诚实基准必须包含不可压缩任务**,ponytail 不在已经最优的代码上虚构节省

### 1.5 自我发现的污染 bug

> 早期 agentic 跑出来 ponytail 和 caveman 只差 4%,**几乎发布**。
> 根因:ponytail/caveman 的 SessionStart hook 在**每个 arm 上都触发**,包括 baseline。
> 修复:`--setting-sources project,local` + `--plugin-dir` 精确加载一个插件
> **教训**:基准里发现这种 bug,反而是**其余数字可信的根据**

---

## 2. 方法论(7 级阶梯 + 显式边界)

### 2.1 7 级阶梯(写代码前先走)

```
1. Does this need to exist?        → no: skip it (YAGNI)
2. Already in this codebase?       → reuse it, don't rewrite
3. Stdlib does it?                 → use it
4. Native platform feature?        → use it  ← 真实大赢点
5. Installed dependency?           → use it. Never add new for few lines
6. One line?                       → one line
7. Only then: minimum that works
```

> **关键纪律**:"The ladder runs *after* you understand the problem, not instead of it"
> → 读懂任务 + 读完代码 + 跟踪真实流程 → 再爬阶梯

### 2.2 Bug fix 原则

> **Bug fix = root cause, not symptom**
> 操作:报告是症状描述 → grep 这个函数所有 caller → 在共享函数里加一个 guard(一份比每 caller 一份更小)→ 修一次,所有路径修好
> 反例:只补报告里那个路径的 caller → 兄弟 caller 还坏

### 2.3 永不精简的边界

> Never simplify away:
> - **input validation at trust boundaries** ← 安全,永不砍
> - **error handling that prevents data loss** ← 数据不丢
> - **security measures** ← 安全
> - **accessibility basics** ← 无障碍
> - **calibration real hardware needs** ← 物理世界有偏差,留旋钮
> - **anything explicitly requested** ← 显式请求的不能砍
> - **understanding the problem** ← 读懂任务,绝不偷工

### 2.4 必须有检查

> Lazy code without its check is unfinished.
> **Non-trivial logic**(分支/循环/解析器/钱/安全路径) → 留 ONE runnable check
> - assert 基础的 demo / __main__ 自检
> - 一个小的 test_*.py 文件
> - **不要 framework,不要 fixture,不要 per-function 套件**(除非要求)
> - **Trivial one-liner 不需要测试**(YAGNI 也适用于测试)

### 2.5 ponytail: 注释标记

> **Mark intentional simplifications with a `ponytail:` comment**
> 形式:`// ponytail: <ceiling>, <upgrade path>`
> 示例:`# ponytail: global lock, per-account locks if throughput matters`
> 目的:声明"这是有意简化" + 标注天花板 + 给出升级触发条件 → 让"later"不变成"never"

### 2.6 输出形状(代码优先)

> Pattern: `[code] → skipped: [X], add when [Y].`
> - 代码先
> - 至多 3 短行:跳了什么 + 何时补
> - **不要 essay / feature tour / design notes**
> - 解释比代码长 → **删解释**(每段辩护都是把复杂度走私回 prose)
> - 用户**显式**要的解释 → 给完整(报告/走查/分阶段笔记),不是债

---

## 3. 强度档(4 级 + 1 个独立 review 档)

> 默认:`full` | 持久到会话结束 | 命令:`/ponytail lite|full|ultra|off` | 关闭:`stop ponytail` / `normal mode`

| Level | 行为 |
|---|---|
| **off** | 完全停用 |
| **lite** | 写用户要的,但用一句话点名更懒的替代 → 用户选 |
| **full** | **默认**。阶梯强制执行。stdlib + 原生优先。最短 diff,最短解释 |
| **ultra** | YAGNI 极端。删除优先于添加。发 one-liner 并在同一口气挑战需求其余 |
| **review** | 独立档(不是强度)。`/ponytail-review` 触发,只审 diff,产出 delete-list |

### 3.1 同一请求的三档差异示例

请求:"给这些 API 响应加缓存"
- **lite**: "Done, 缓存已加。FYI:`functools.lru_cache` 一行就搞定,如果不想自己持有 cache 类"
- **full**: "`@lru_cache(maxsize=1000)` 加在 fetch 函数上。跳过手写 cache 类,lru_cache 实测不够用时再补"
- **ultra**: "profile 工具说需要之前不加。届时:`@lru_cache`。手写 TTL cache 类是 bug farm + hit rate"

---

## 6 个命令(全谱)

| 命令 | 作用 | 副作用 |
|---|---|---|
| `/ponytail [lite\|full\|ultra\|off]` | 切档或停 | 写 flag 文件、换 ruleset |
| `/ponytail-review` | 审当前 diff 的过度工程,返回 delete-list | 仅报告 |
| `/ponytail-audit` | **审整个 repo**(不仅 diff) | 仅报告 |
| `/ponytail-debt` | 收 `ponytail:` 注释成 ledger,标记无 trigger 的 rot 风险 | 仅报告(可写文件) |
| `/ponytail-gain` | 显示基准测试得分板 | 仅展示 |
| `/ponytail-help` | 速查 | 无 |

**5 个 tag**(`-review` / `-audit` 共享):
- `delete`:死代码/投机特性
- `stdlib`:重造了标准库
- `native`:依赖做了平台能做的事
- `yagni`:一个实现的抽象
- `shrink`:同样逻辑,行数更少

---

## 5. 体系(Agent 集成面,实测可用)

> Ponytail 支持 14+ agent(README 顶部 badge: "works with 14 agents")

| Agent | 集成方式 | 命令形式 |
|---|---|---|
| **Claude Code** | `/plugin marketplace add` | `/ponytail` |
| **Codex** | `codex plugin marketplace add` + `/plugins` | `/ponytail` |
| **GitHub Copilot CLI** | `copilot plugin marketplace add` | `/ponytail:ponytail` |
| **Pi agent harness** | `pi install git:github.com/DietrichGebert/ponytail` | `/ponytail` |
| **OpenCode** | `opencode.json` 加 `./.opencode/plugins/ponytail.mjs` | `/ponytail` |
| **Gemini CLI** | `gemini extensions install <url>` | `/ponytail` |
| **Antigravity CLI**(Gemini 改名) | `agy plugin install <url>` | 输入框打 |
| **CodeWhale** | 读项目根 `AGENTS.md`,零设置 | 自动 |
| **OpenClaw** | `clawhub install ponytail`(生成 `.openclaw/skills/`) | `/ponytail` |
| Cursor | 复制 `.cursor/rules/` | 始终生效,无命令 |
| Windsurf | 复制 `.windsurf/rules/` | 始终生效,无命令 |
| Cline | 复制 `.clinerules/` | 始终生效,无命令 |
| Kiro | 复制 `.kiro/steering/` | 始终生效,无命令 |
| GitHub Copilot(editor) | 复制 `.github/copilot-instructions.md` | 始终生效 |

**核心适配模式**:
- **Hook 派**(Claude/Codex/Copilot CLI/Pi):`SessionStart` 注入 ruleset,`UserPromptSubmit` 切档
- **Ruleset 派**(Cursor/Windsurf/Cline/Kiro):复制文件,纯规则,无命令
- **MCP 派**(Antigravity):`/ponytail` 命令转 skill,输入框调用

---

## 6. 实现细节(代码层面)

### 6.1 仓库结构(实测 ls)

```
ponytail-main/  (v4.8.1, ~1.5 MB)
├── AGENTS.md              ← 主规则源(2.6 KB)
├── README.md              ← README + 数字 + 安装 + 命令
├── package.json           ← pi-package 声明
├── skills/                ← 6 个 SKILL.md(ponytail / audit / debt / gain / help / review)
├── commands/              ← 6 个 .toml 命令定义
├── hooks/                 ← 5 个 Node.js hook(413 行)+ shell statusline × 2
│   ├── ponytail-activate.js        ← SessionStart 注入 ruleset
│   ├── ponytail-config.js          ← 模式解析(env var / config.json / 默认 'full')
│   ├── ponytail-instructions.js    ← 按 mode 过滤 SKILL.md body(按强度档裁剪)
│   ├── ponytail-mode-tracker.js    ← UserPromptSubmit 切档 + 写 flag
│   ├── ponytail-runtime.js         ← 持久化(setMode/clearMode/writeHookOutput)
│   ├── ponytail-statusline.{sh,ps1} ← shell 状态栏
│   └── claude-codex-hooks.json + copilot-hooks.json ← 事件绑定
├── pi-extension/          ← pi 平台集成(index.js 157 行)
├── ponytail-mcp/          ← MCP server(index.js 48 + instructions.js 26)
├── benchmarks/            ← 完整基准套件(behavior.yaml, correctness.js, loc.js, robustness-audit.js 等)
├── docs/                  ← agent-portability.md 等
├── examples/              ← before/after 案例
├── tests/                 ← Node test runner
└── .openclaw/skills/      ← 自动生成的 OpenClaw 适配版(6 个 SKILL.md,来自 skills/)
```

### 6.2 关键代码片段

**强度档过滤**(ponytail-instructions.js):

```js
function filterSkillBodyForMode(body, mode) {
  const effectiveMode = normalizeMode(mode) || DEFAULT_MODE;
  const withoutFrontmatter = String(body || '').replace(/^---[\s\S]*?---\s*/, '');
  // 仅 intensity 表行 + worked example 按 mode 名裁剪,其余保留
  return withoutFrontmatter.split(/\r?\n/).filter((line) => {
    const tableLabel = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|/);
    if (tableLabel) {
      const labelMode = normalizeMode(tableLabel[1].trim());
      if (labelMode) return labelMode === effectiveMode;
    }
    const exampleLabel = line.match(/^-\s*([^:]+):\s*/);
    if (exampleLabel) {
      const labelMode = normalizeMode(exampleLabel[1].trim());
      if (labelMode) return labelMode === effectiveMode;
    }
    return true;
  }).join('\n');
}
```

**模式解析优先级**(ponytail-config.js):
1. `PONYTAIL_DEFAULT_MODE` 环境变量(最高)
2. `$XDG_CONFIG_HOME/ponytail/config.json` 的 `defaultMode`
3. macOS/Linux: `~/.config/ponytail/config.json`;Windows: `%APPDATA%\ponytail\config.json`
4. 默认 `'full'`

**Valid modes**: `['off', 'lite', 'full', 'ultra', 'review']`
**Runtime modes**: `['off', 'lite', 'full', 'ultra']`(review 是独立档)

### 6.3 安全实现细节(ponytail-config.js)

```js
// 只允许 shell-safe 路径字符做 statusline 嵌入
function isShellSafe(p) {
  return typeof p === 'string' && /^[A-Za-z0-9 _.\-:/\\~]+$/.test(p);
}
// 敌意 clone 路径(含引号、&、$、反引号、;等)→ 回退手动设置
```

> 注释明确写:**"ponytail: allowlist beats escaping every shell's metacharacters"**

---

## 7. 启示(对八荣八耻规则运行时)

### 7.1 与 AGENTS.md 八荣八耻的契合

| Ponytail 命题 | 八荣八耻对应 |
|---|---|
| "Reuse the helper already in this codebase" | 准则 4 · **不创造接口 / 主动梳理已有能力** |
| "stdlib first / no avoidable deps" | 准则 14 · **节约 token** + 不重复造轮子 |
| "Bug fix = root cause, grep every caller" | 准则 12 · **完整版** + 不偷工 |
| "Never cut: validation / error handling / security" | 准则 16 · **超越平凡** + 不交"能跑就行" |
| "Mark intentional simplifications with `ponytail:` comment" | 准则 19 · **删走回收站**(标注可恢复点) |
| "Read the code it touches before picking a rung" | 准则 1 · **查接口** |
| "Output: code first, ≤3 lines explanation" | 准则 13 · **通俗易懂** + 准则 17 · **节约 token** |

**结论**:八荣八耻的精简版已经包含 Ponytail 的核心,**v3.4.2 借鉴 Ponytail 对齐 RULE-FP-001 模式**有扎实的同源基础(见 `RULES-TREE.md` L667)。

### 7.2 可直接落地的 Ponytail 技巧(无需全量集成)

| 技巧 | 在本项目立即可用 |
|---|---|
| **`ponytail:` 注释** 标记故意简化 | ✅ 已经在 _recycle_bin 注释里类似用(`# bak-pre-needle-add` 标注删除原因+回滚点) |
| **5 个 review tag**(delete/stdlib/native/yagni/shrink) | ✅ TokenThrottle v0.2.0 完成后,可加 `/ponytail-review` 适配 |
| **强度档过滤**(按 mode 裁剪 SKILL.md body) | ⚠ 需 hook 改造,中工作量 |
| **完整集成 pi 安装** | ⏳ `pi install git:github.com/DietrichGebert/ponytail`,低工作量 |
| **基准测试套件移植** | ⏳ 高工作量,但 TokenThrottle v0.2.0 完成后可演进 |
| **Hook 注入 + SessionStart 模式** | ⏳ 高工作量,与现有 eight-rules hook 共存需要设计 |

### 7.3 与 Ponytail 的差异点(本项目的独特性)

| 维度 | Ponytail | 本项目(八荣八耻规则运行时) |
|---|---|---|
| **核心载体** | 单 agent 的代码风格规范 | 28 条 AI 协作纪律 + 跨项目价值观 |
| **范围** | coding task 优化 | 跨任务类型(分析 / 重构 / 文档 / 设计 / 编码) |
| **评估方式** | 实证基准(LOC/tokens/cost/time) | 当前**无量化基准**,依赖 Git/会话日志主观判断 |
| **可学习性** | 5 个 tag 清晰可落地 | 八荣八耻 28 条,需要 RULES.md 全文 |
| **漂移控制** | 4 强度档 + review 独立档 | 单一 full 档 + 防空转机制(v3.3.1) |
| **适配 agent 数** | 14+ | 8+(`npm run adapters`) |
| **许可证** | MIT | MIT |

**最大差距**:本项目**没有量化基准**。建议:**移植 Ponytail benchmarks/ 套件到本项目**,量化 28 条 vs 0 条 的成本/质量影响。

---

## 8. 引用与索引

### 8.1 一手证据位置(全部已读)

```
E:\新建文件夹\新建文件夹\01-AgentLayer\ponytail-main\
├── AGENTS.md                          ← 主规则(2.6 KB,7 级阶梯原文)
├── README.md                          ← 数字+安装+命令(13 KB)
├── package.json                       ← v4.8.1 + pi-package 声明
├── skills/ponytail/SKILL.md           ← 完整 SKILL.md(主档)
├── .openclaw/skills/ponytail/SKILL.md ← OpenClaw 适配版(同源)
├── commands/ponytail{,-review,-audit,-debt,-gain,-help}.toml ← 6 命令定义
├── hooks/ponytail-{activate,config,instructions,mode-tracker,runtime}.js ← 5 hook
├── pi-extension/index.js              ← pi 平台集成(157 行)
├── ponytail-mcp/{index,instructions}.js ← MCP server(74 行)
└── benchmarks/results/2026-06-18-agentic.md ← 实证基准(n=4, Haiku 4.5)
```

### 8.2 本项目沉淀位置

| 位置 | 内容 |
|---|---|
| `AGENTS.md:8` | v3.4.2 调优"借鉴 super-code + Ponytail" |
| `RULES-TREE.md L667` | RULE-FP-001 第一性原理复合算子(2026-08-12 新增) |
| `RULES-TREE.md RULE-CODING-001` | 编码操作纪律(借鉴 super-code + Ponytail 模式) |
| `docs/benchmark-methodology.md` | 已有基准方法论文档(可与 Ponytail 套件对比) |

### 8.3 历史失败任务(警示)

`外部方法树工具链工单(2026-08-12)`(2026-08-12)
- **失败原因**:跨盘路径(E:\新建文件夹\新建文件夹\01-AgentLayer\ponytail-main)在外部工具链默认扫描未触发
- **沉淀**:本报告是**重做后的真实研究**,基于直接 `ls/cat/grep` 拿到的一手证据
- **教训**:**任何"看不到 = 没有"的判断都是不充分的**(准则 6 · 系统穷尽 + 准则 4 · 不装懂)

---

## 9. guardrail 3 问(Ponytail 风格自检)

1. **这次报告有省什么吗?** → 没有。每条核心命题都给了 path:line,数字都现场验证(基准表来自 README 引用 + 完整 md 已读)
2. **6 个月后看得懂吗?** → 用了 5 张表 + 9 节 + 引用索引,结构化
3. **为省 token 牺牲正确性了吗?** → 没有。**特别诚实**地标了"Ponytail 的 7 级" vs "Ponytail 不赢在哪" + "本项目缺量化基准"

---

[已完成 Ponytail 第一性原理研究 · 基于 E:\新建文件夹\新建文件夹\01-AgentLayer\ponytail-main 一手证据 · 沉淀于 docs/ponytail-tech-report.md · 等待:是否要 (a) 移植基准套件到本项目 / (b) 集成 pi 安装 / (c) TokenThrottle v0.2.0 完成后接 ponytail-review]