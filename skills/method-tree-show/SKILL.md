---
name: method-tree-show
description: >
  Show / read / search / star method trees via `mr.exe tree <subcommand>`.
  Read-only operations. One-shot. Trigger: "/mr-show" / "/mr tree show" /
  "/mr tree list" / "方法树列表" / "看方法树" / "show method tree" /
  "find similar method tree" / "复用方法树"。对标 eight-rules-review 的"读不写"模式。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/methods/TREE-INDEX.md
license: MIT
---

# Method Tree Show — Read / Search / Star

看 / 读 / 搜 / star 方法树——全部只读或加 anchor 标记,不修改。
封装 `mr.exe tree list|show|read-full|search|star|unstar`。**One-shot**。

## 5 子命令

| 子命令 | 用途 | 何时用 |
|---|---|---|
| `mr tree list` | 列所有方法树(从 TREE-INDEX.md) | 查"项目里跑过哪些任务" |
| `mr tree show <T-id>` | 看某棵方法树摘要 | 快速了解步骤 + skills |
| `mr tree read-full <T-id>` | 读方法树全文 | 复用前必读全文(防凭印象) |
| `mr tree search <关键词>` | 搜方法树 | 找"上次类似任务怎么做的" |
| `mr tree star <T-id>` | 标 ANCHOR(防消失) | 重要方法树必 star |
| `mr tree unstar <T-id>` | 取消 ANCHOR | 误标时撤回 |

## Process

1. **校验工具链**:`mr version` → 不通过则报错
2. **解析子命令**:用户说"看方法树 X" → `show`;说"全文" → `read-full`;说"找类似" → `search`
3. **运行 + 解析输出**:表格化展示给用户
4. **建议下一步**:
   - list → "想看哪个? 给 T-id"
   - show → "想复用? 给 task 跑 `mr run`"
   - read-full → "复用前先 `mr run` 新单,引用此树"
   - search → "想复用? 给 T-id 读全文"
   - star → "已 star,定期 `mr scoreboard` 复查"

## 标准输出格式

```
mr tree list  ─────────────────────

  8 method trees:
    [T-20260810114840-000] 用一句话介绍 lsx-mp-rust 是什么 | 2026-08-10T11:48 | steps=8 skills=10
    [T-20260810165905-000] 查找资本论                       | 2026-08-10T16:59 | steps=9 skills=10
    ...
    [T-20260811214210-000] 推送 v3.2.1 到 GitHub             | 2026-08-11T21:42 | steps=8 skills=10  ⭐ANCHOR

  提示:star 后的方法树不会被自动归档(防消失)
```

## Tags(共享字典)

- `read:` 只读 — **Replacement**:`mr run`(真写时)
- `star:` 标 ANCHOR — **Replacement**:`mr tree unstar`(撤回时)
- `find:` 搜同类 — **Replacement**:`mr run`(真做时)

## 永不精简的边界

1. **复用前必 `read-full`**(不是"看 show 摘要就复用"——漏细节)
2. **重要方法树必 star**(不是"忘了就忘了")
3. **搜不到不要立刻 `mr run`**(先 `kg_rag_rust find` 找同主题——RAG 第一原则)

## Boundaries

- ✅ 管:list / show / read-full / search / star / unstar
- ❌ 不管:建方法树(`method-tree-run`)
- ❌ 不管:删方法树(只允许 `mr tree unstar` + git 历史,不真删)

## 必背三句话

1. **"复用前必 read-full"** — 不是"show 摘要就够"
2. **"重要方法树必 star"** — 不是"star 麻烦,以后再说"
3. **"搜不到先 RAG,再 run"** — 不是"搜不到就凭印象 run"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 跑任务:[method-tree-run/SKILL.md](../method-tree-run/SKILL.md)
- 工具文档:[METHOD-TREE.md](~/.pi/agent/projects/lsx-mp-rust/methods/METHOD-TREE.md)
