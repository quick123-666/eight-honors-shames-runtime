---
name: method-tree
description: >
  方法树主持续 skill — ACTIVE EVERY RESPONSE. lsx-mp-rust 工具链封装 + 反漂移硬话术。
  Default mode **full**。Trigger: "方法树"、"method tree"、"method-tree"、
  "lsx"、"mr run"、"mr tree"、"开方法树" 或会话启动自动激活。切换档位:
  `/mr lite|full|ultra|off`。停止: "停止方法树" / "no mr" / "/mr off"。
  本 skill 是双层架构的**主持续档**;one-shot 子档见
  method-tree-pick / -run / -show / -wiki / -feedback / -help。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/methods/TREE-INDEX.md
license: MIT
---

# Method Tree (方法树) — Main Persistent Mode

## Persistence

**ACTIVE EVERY RESPONSE. NO DRIFT.** Still active if unsure. Off only:
`"停止方法树"` / `"no mr"` / `"/mr off"`。Default: **full**。

切换档位(`/mr lite|full|ultra|off`),persists 到 session 结束;
写入 `~/.config/method-tree/state.json`(Windows: `%APPDATA%\method-tree\state.json`)
+ 状态条显示当前档。

> **反漂移硬话术**:任何轮次,若用户说"做任务"或会话进入任务态,先**自问**:
> "这个任务是否适合开方法树?" → 适合就 `mr run`,不要等用户提醒。
> 不要因为"任务看起来很简单"就跳过方法树。

## 方法树 7 命令精简版

> 完整版见 [`方法树 help`](./method-tree-help/SKILL.md)。
> **不**写散文解释;**不**列长例;**只**保留可执行判定。

| 命令 | 用途 | 何时用 |
|---|---|---|
| `mr run "<任务>"` | 开单→编排→执行→关单 | 任何新任务(全/超档默认) |
| `mr pick "<任务>"` | 预览 skill 推荐(确定性,不跑编排) | 拿不准用哪个 skill 时 |
| `mr tree list` | 列所有方法树 | 查历史 |
| `mr tree show <T-id>` | 看方法树摘要 | 查某棵详情 |
| `mr tree read-full <T-id>` | 读方法树全文 | 复用前必读 |
| `mr tree search <关键词>` | 在方法树里搜 | 找同类 |
| `mr tree star <T-id>` | 标 ANCHOR(防止方法树消失) | 重要方法树必 star |
| `mr wiki` | 把方法树沉淀到 wiki | 任务闭环后必跑 |
| `mr feedback good\|bad <T-id> <理由>` | 反馈 | 跑完方法树必填 |
| `mr scoreboard` | 看选用+反馈统计 | 周报/月报 |
| `mr rules` | 查 RULES-TREE.md | 找相关准则 |
| `mr memo` | 写工作记忆(MEMORY.md) | 跨 session 备忘 |

## 4 强度档

| Level | 行为 | 触发 |
|---|---|---|
| **off** | 完全停用方法树(罕见,默认不要) | `/mr off` / `"停止方法树"` / `"no mr"` |
| **lite** | 用户明确说"开方法树"才用;**标准 reduce**:不主动建 | `/mr lite` |
| **full** | **默认**。新任务时主动自问"是否开方法树" → 适合就 `mr run`;**不**主动 star 必 star 档 | `/mr`(无参) |
| **ultra** | **强制**每个新任务都 `mr run`;主动 star 重要方法树;主动 `mr memo` | `/mr ultra` |

切换持久到 session 结束。env 覆盖:`METHOD_TREE_DEFAULT_MODE=lite|full|ultra|off`。

## 当 NOT to be lazy(永不精简的边界)

方法树系统**永不砍**:

1. **方法树自动沉淀**(`mr run` 完成后必须 `mr wiki` 沉淀)
2. **关单完整性**(方法树 steps/skills 不能 0,失败也要有失败树)
3. **回滚可执行性**(`mr run --dry-run` 预览后再真跑)
4. **跨会话记忆**(`mr memo` 必填,防止"上次的方法树忘了")
5. **用户显式要求的方法树任务**(用户说"用方法树"就必用,不劝降)
6. **ANCHO 保护**(star 后的方法树不删,即使 90 天未用)

> **反弹效应防护**:不要往这条清单里加具体漏洞形态(会反弹);
> 只列**类别**,不给具体实例。

## Boundaries

**Eight Rules 管的是"AI 协作纪律",Method Tree 管的是"工作流产物沉淀"**。本 skill:

- ✅ 管:`mr run` / `mr tree` / `mr wiki` / `mr feedback` / `mr memo` 的触发与沉淀
- ✅ 管:方法树的 4 强度档 / 反漂移话术 / Boundaries
- ❌ 不管:具体编码风格(那是 `## 六、编码操作纪律` + `eight-rules-review` 的事)
- ❌ 不管:具体技术栈选型(那是用户决策)
- ❌ 不管:AI 输出什么(那是八荣八耻的输出骨架)
- ❌ 不管:纪律层面(准则 1-28 是八荣八耻的,本 skill 仅"工具链使用"层面)

`"停止方法树"` / `"no mr"` / `"/mr off"` → revert。
Level persists until changed or session end。

## 相关 skill(双层架构子档)

| skill | 类型 | 触发 |
|---|---|---|
| `method-tree-pick` | 子 one-shot | 预览 skill 推荐(`/mr-pick` 或 `/mr pick`) |
| `method-tree-run` | 子 one-shot | 跑任务(`/mr-run` 或 `/mr run`) |
| `method-tree-show` | 子 one-shot | 看方法树(`/mr-show` 或 `/mr tree show`) |
| `method-tree-wiki` | 子 one-shot | 沉淀到 wiki(`/mr-wiki` 或 `/mr wiki`) |
| `method-tree-feedback` | 子 one-shot | 反馈闭环(`/mr-feedback` 或 `/mr feedback`) |
| `method-tree-help` | 子 one-shot | 速查(`/mr-help` 或 `/mr help`) |

## 与八荣八耻的关系

> **方法树系统不是八荣八耻里面**(2026-08-13 用户反问后澄清)
> 但八荣八耻**主动要求**调用方法树(准则 6/10/24/28 共 7 处):
> - 准则 6·系统穷尽 → "沉淀侦察方法树"
> - 准则 10·不重复犯错 → "方法树复用:同类问题先查 RULES-TREE / codegraph_explore"
> - 准则 24·联系全文 → "不读完工单 / 方法树 / wiki 就开始工作"
> - 准则 28·跨会话沉淀 → "方法树必须落盘 RULES-TREE.md / AGENTS.md / wiki"
>
> **层级关系**(lsx-mp-rust METHOD-TREE.md 自述):
> RULES-TREE(宪法) > METHOD-TREE(体系说明书) > 方法树(具体产物)
>
> **联动**:八荣八耻主档**默认**是 full(全执行),方法树主档**默认**是 full(主动自问开方法树)。
> 两套档**不联动**——纪律管"怎么用工具",工具管"工具做了什么"。

## 必背三句话

1. **"任务进入 → 自问是否开方法树"** — 不是"任务做完再补方法树"
2. **"方法树必须沉淀到 wiki"** — 不是"方法树留在 methods/trees/ 就行"
3. **"同类问题先查 RULES-TREE + codegraph_explore"** — 不是"凭印象直接答"

---

> **生成信息**:本 skill 由 `skills/method-tree/SKILL.md` 创建于 2026-08-13,
> 对标 `eight-rules/SKILL.md` 双层架构,沉淀为 `RULE-METHOD-TREE-SKILLS-001`。
> 工具链:`mr.exe`(lsx-mp-rust v0.14.0,pi-deepseek 后端)。
> 完整方法树体系见 [METHOD-TREE.md](~/.pi/agent/projects/lsx-mp-rust/methods/METHOD-TREE.md) +
> 本项目 [TREE-INDEX.md](../../methods/TREE-INDEX.md)。
