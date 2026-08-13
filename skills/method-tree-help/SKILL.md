---
name: method-tree-help
description: >
  Quick-reference card for 方法树 modes, skills, and commands. One-shot
  display, not a persistent mode. Trigger: "/mr help" / "/mr-help" /
  "method tree help" / "方法树 help" / "how do I use method tree" /
  "what mr commands"。对标 eight-rules 的 `eight-rules-help` 子档。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/methods/TREE-INDEX.md
license: MIT
---

# 方法树 Help — Quick Reference

Display this reference card when invoked. **One-shot**, do NOT change mode,
write flag files, or persist anything.

## 4 强度档(主持续 skill)

| Level | Trigger | What changes |
|-------|---------|--------------|
| **off** | `/mr off` / `"停止方法树"` / `"no mr"` | 完全停用(罕见) |
| **Lite** | `/mr lite` | 用户明确说才用;**不主动建方法树** |
| **Full** | `/mr`(无参) | **默认**。新任务主动自问"是否开方法树" → 适合就 `mr run` |
| **Ultra** | `/mr ultra` | **强制**每个新任务都 `mr run`;主动 star 重要方法树;主动 `mr memo` |

Level sticks until changed or session end。env 覆盖:
`METHOD_TREE_DEFAULT_MODE=lite|full|ultra|off`(优先级最高)。

## 6 命令(子 skill 触发)

| Command | Skill | What it does |
|---------|-------|--------------|
| `/mr-pick` 或 `/mr pick` | `method-tree-pick` | 预览 skill 推荐(确定性,不跑编排) |
| `/mr-run` 或 `/mr run` | `method-tree-run` | 跑任务(开单→JSON plan→并行执行→交付→方法树) |
| `/mr-show` 或 `/mr tree show` | `method-tree-show` | 看方法树(list/show/read-full/search/star) |
| `/mr-wiki` 或 `/mr wiki` | `method-tree-wiki` | 把方法树沉淀到 wiki |
| `/mr-feedback` 或 `/mr feedback` | `method-tree-feedback` | good/bad 反馈 + scoreboard |
| `/mr-help` 或 `/mr help` | `method-tree-help` | **本卡** |

> 短触发:`/mr` = `/mr status` = 显示当前档。

## mr.exe 完整子命令(11 个)

| 子命令 | 用途 | 示例 |
|---|---|---|
| `run "<任务>"` | 跑任务(完整管线) | `mr run "推送 v3.4.3"` |
| `pick "<任务>"` | 预览 skill 推荐 | `mr pick "查找资本论"` |
| `tree list` | 列方法树 | `mr tree list` |
| `tree show <T-id>` | 看摘要 | `mr tree show T-20260811214210-000` |
| `tree read-full <T-id>` | 读全文 | `mr tree read-full T-20260811214210-000` |
| `tree search <关键词>` | 搜方法树 | `mr tree search "deploy"` |
| `tree star <T-id>` | 标 ANCHOR(防消失) | `mr tree star T-20260811214210-000` |
| `tree unstar <T-id>` | 取消 ANCHOR | `mr tree unstar T-20260811214210-000` |
| `wiki` | 沉淀方法树到 wiki | `mr wiki` |
| `feedback <good\|bad> <T-id> <理由>` | 反馈 | `mr feedback good T-xxx "实用"` |
| `scoreboard` | 统计(选用+反馈) | `mr scoreboard` |
| `rules` | 查 RULES-TREE.md | `mr rules "loop"` |
| `memo <add\|append>` | 写工作记忆 | `mr memo add "今天发现 X bug"` |
| `version` | 版本+LLM 状态 | `mr version` |

## 关闭方式

3 种等价方式(择一即可):
- `"/mr off"`(命令)
- `"停止方法树"`(自然语言)
- `"no mr"`(英文)

**resume**:`/mr`(无参)= 回到 full(默认)。

## 配置默认档

**环境变量**(最高优先):
```bash
# Windows
setx METHOD_TREE_DEFAULT_MODE "lite"
# Linux/macOS
export METHOD_TREE_DEFAULT_MODE=lite
```

**Config 文件**:
- macOS/Linux:`~/.config/method-tree/config.json`
- Windows:`%APPDATA%\method-tree\config.json`

```json
{ "defaultMode": "full" }
```

**Resolution 顺序**:env > config > `"full"`(默认)

## 关闭完整流程(默认不要)

设 `"off"` 在 config 里**只能停 auto-activation**,不会改变已激活的 session。
要在**已激活**的 session 停:必须用 `"/mr off"` 命令。

## 当前档查询

```
/mr status
```

输出:`current mode: full · persist path: ~/.config/method-tree/state.json`

## 与八荣八耻联动

| 维度 | 八荣八耻 | 方法树 |
|---|---|---|
| 管 | AI 协作纪律(28 条) | 工作流产物沉淀(mr 工具链) |
| 档联动 | 默认 full(28 条全执行) | 默认 full(主动自问开方法树) |
| 关闭 | `/rules off` / `"停止八荣八耻"` | `/mr off` / `"停止方法树"` |
| 互引 | 准则 28 把方法树列为必沉淀 | 主档 Boundaries 段注明"不管纪律" |

**不联动**:各自独立档位。改方法树档不影响八荣八耻档(反之亦然)。

## More

- 完整工具链文档:[METHOD-TREE.md](~/.pi/agent/projects/lsx-mp-rust/methods/METHOD-TREE.md)
- 本项目方法树索引:[TREE-INDEX.md](../../methods/TREE-INDEX.md)
- 沉淀的 RULE:[RULES-TREE.md](../../RULES-TREE.md) `RULE-METHOD-TREE-SKILLS-001`
- 八荣八耻主档:[eight-rules/SKILL.md](../eight-rules/SKILL.md)

---

> **生成信息**:对标 eight-rules `eight-rules-help` 子档。双层架构见
> `skills/method-tree/SKILL.md` 的"相关 skill"表。沉淀 RULE-METHOD-TREE-SKILLS-001。
