---
name: method-tree-show
description: >
  Read a full RULE from RULES-TREE.md by its id (RULE-XXX-NNN). Read-only
  operation. Trigger: "/mr-show" / "/mr show" / "method tree show" /
  "看 RULE" / "show rule" / "RULE 全文" / "show RULE-LOOP-001"。对标
  eight-rules-review 的"读不写"模式。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/RULES-TREE.md
license: MIT
---

# Method Tree Show — Read Full RULE

读 RULES-TREE.md 里某条 RULE 的完整内容。
封装 `sed -n '/RULE-XXX-NNN/,/^### /p' RULES-TREE.md`。
**One-shot**,只读不写。

> **何时用 show?**
> - 复用前必读全文(防凭印象)
> - 反向追溯某条 RULE 是怎么写的
> - 检查某条 RULE 是否还在(v3.x 升级时)

## Process

1. **解析 RULE id**:用户说"看 RULE-LOOP-001"或"看 LOOP-001"
2. **运行命令**:
   - 单条 RULE:`sed -n '/^### RULE-LOOP-001/,/^### /p' RULES-TREE.md | head -n -1`(去掉下一个 RULE 头)
   - 全部 LOOP 系列:`sed -n '/^### RULE-LOOP-/,/^### /p' RULES-TREE.md`
3. **格式化输出**给用户
4. **建议下一步**:
   - 复用 → 引用此 RULE id
   - 修改 → 不要直接改 RULE,要新写 1 条(沉淀新经验)
   - 找同主题 → `mr-pattern "<主题>"`
   - 引用次数 → `mr-feedback <RULE-id>`

## 标准输出格式

```
mr show RULE-LOOP-001  ─────────────────────

  ### RULE-LOOP-001(2026-08-13 v3.3.1 沉淀 — 三套终止信号死循环修复)
  - **触发场景**: AI 在反思自检 / 输出结尾反复切换格式;...
  - **根因(本会话踩坑)**: ...
  - **优先级硬规定**: ...
  - **执行铁律**: 1. 末行必是优先级 1 三选一; 2. 优先级 2 的 [COVER-ALL] 8 行插在...
  - **关联 RULE**: ...
  - **下次如何避免**: ...
  - **本会话 2026-08-13 v3.3.1 落地清单**: ...

  提示:复用前必读全文;修改不直接改,要新写 1 条
```

## Tags(共享字典)

- `read:` 只读 — **Replacement**:`mr-write`(确认无重复才写)
- `show:` 展示 — **Replacement**:`mr-pattern`(找同主题时)
- `detail:` 全文 — **Replacement**:`/mr-feedback`(看引用次数时)

## 永不精简的边界

1. **复用前必 read-full**(不是"看摘要就复用")
2. **不直接改已有 RULE**(是"新写 1 条沉淀新经验"——沉淀动作的可追溯性)
3. **show 时输出完整 7 段**(不是"只展示触发场景就够")

## Boundaries

- ✅ 管:read RULE 全文 + 格式化 + 下一步建议
- ❌ 不管:写/改 RULE(那是 `method-tree-write`)
- ❌ 不管:引用次数统计(那是 `method-tree-feedback`)

## 必背三句话

1. **"复用前必 read-full"** — 不是"看摘要就够"
2. **"不直接改已有 RULE"** — 不是"在原 RULE 上补丁"
3. **"看完必想下一步"** — 不是"看完就走"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 写新 RULE:[method-tree-write/SKILL.md](../method-tree-write/SKILL.md)
- 找同主题:[method-tree-pattern/SKILL.md](../method-tree-pattern/SKILL.md)
- 跟踪引用:[method-tree-feedback/SKILL.md](../method-tree-feedback/SKILL.md)
- 沉淀池:[RULES-TREE.md](../../RULES-TREE.md)
