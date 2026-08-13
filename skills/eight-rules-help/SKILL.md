---
name: eight-rules-help
description: >
  Quick-reference card for 八荣八耻 modes, skills, and commands. One-shot
  display, not a persistent mode. Trigger: "/rules help" / "/rules-help" /
  "rules help" / "八荣八耻 help" / "how do I use eight rules" /
  "what rules commands". 对标 Ponytail 的 `ponytail-help` 子档。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/AGENTS.md
license: MIT
---

# 八荣八耻 Help — Quick Reference

Display this reference card when invoked. **One-shot**, do NOT change mode,
write flag files, or persist anything.

## 4 强度档(主持续 skill)

| Level | Trigger | What changes |
|-------|---------|--------------|
| **off** | `/rules off` / `"停止八荣八耻"` / `"normal mode"` | 完全停用(罕见) |
| **Lite** | `/rules lite` | 写用户要的;一句话点名更严替代;**不主动重构** |
| **Full** | `/rules`(无参)| **默认**。28 条全执行;**不主动重写**;**不主动删** |
| **Ultra** | `/rules ultra` | 主动挑战需求;严苛 review;**敢删**;发前一句"Y 覆盖 X" |
| **review**(独立档) | `/rules-review` | 只跑 review 子 skill;持久模式不变 |

Level sticks until changed or session end。env 覆盖:
`EIGHT_RULES_DEFAULT_MODE=lite|full|ultra|off`(优先级最高)。

## 6 命令(子 skill 触发)

| Command | Skill | What it does |
|---------|-------|--------------|
| `/rules` 或 `/rules full` | `eight-rules`(主) | 切换档位 / 显示当前档 |
| `/rules-review` 或 `/rules review` | `eight-rules-review` | 审当前变更:复用/假设/安全/校验/过度工程 |
| `/rules-audit` 或 `/rules audit` | `eight-rules-audit` | 审整个仓库:违规清单 + 修复优先级 |
| `/rules-accept` 或 `/rules accept` | `eight-rules-acceptance` | 8 项验收:需求/代码/测试/构建/安全/文档/回滚/遗留 |
| `/rules-benchmark` 或 `/rules benchmark` | `eight-rules-benchmark` | 跑基准场景对比 lite/full/ultra 行为 |
| `/rules-help` 或 `/rules help` | `eight-rules-help` | **本卡** |
| `decision-annotation`(任意场景) | `decision-annotation` | 八荣八耻决策标注(`eight-rules:` 注释 + ceiling + upgrade) |

## 关闭方式

3 种等价方式(择一即可):
- `"/rules off"`(命令)
- `"停止八荣八耻"`(自然语言)
- `"normal mode"`(英文)

**resume**:`/rules`(无参)= 回到 full(默认)。

## 配置默认档

**环境变量**(最高优先):
```bash
# Windows
setx EIGHT_RULES_DEFAULT_MODE "lite"
# Linux/macOS
export EIGHT_RULES_DEFAULT_MODE=lite
```

**Config 文件**:
- macOS/Linux:`~/.config/eight-rules/config.json`
- Windows:`%APPDATA%\eight-rules\config.json`

```json
{ "defaultMode": "lite" }
```

**Resolution 顺序**:env > config > `"full"`(默认)

## 关闭完整流程(默认不要)

设 `"off"` 在 config 里**只能停 auto-activation**,不会改变已激活的 session。
要在**已激活**的 session 停:必须用 `"/rules off"` 命令。

## 当前档查询

```
/rules status
```

输出:`current mode: full · persist path: ~/.config/eight-rules/state.json`

## More

- 完整 28 条:[RULES.md](../../RULES.md)
- 精简版 + 输出骨架:[AGENTS.md](../../AGENTS.md)
- 沉淀池:[RULES-TREE.md](../../RULES-TREE.md)
- 编码操作纪律(对标 Ponytail 主档):[RULES.md L711-L778](../../RULES.md)(`## 六、编码操作纪律`)
- 同位素参考:[docs/ponytail-tech-report.md](../../docs/ponytail-tech-report.md)

---

> **生成信息**:对标 Ponytail `ponytail-help` 子档。Ponytail `eight-rules-help` 双层架构见
> `skills/eight-rules/SKILL.md` 的"相关 skill"表。沉淀 RULE-EIGHT-RULES-SKILLS-001。