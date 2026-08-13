---
name: method-tree-wiki
description: >
  Persist method trees into the project wiki (llmwiki/). Wraps `mr.exe wiki`.
  Run after every `method-tree-run` (准则 28 跨会话沉淀 + 八荣八耻要求)。
  One-shot. Trigger: "/mr-wiki" / "/mr wiki" / "沉淀方法树" / "方法树到 wiki" /
  "method tree to wiki" / "wiki method tree"。对标 eight-rules-acceptance 的
  "文档同步" 验收项。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/methods/TREE-INDEX.md
license: MIT
---

# Method Tree Wiki — Persist to llmwiki/

把方法树沉淀到项目 wiki(`llmwiki/`),实现跨 session 可召回。
封装 `mr.exe wiki`。**One-shot**。

> **为什么要沉淀 wiki?**
> - **准则 28 跨会话沉淀**:"方法树必须落盘 RULES-TREE.md / AGENTS.md / wiki"
> - **方法树本身是临时产物**(`methods/trees/T-*.md`):90 天未用可能被归档
> - **wiki 是固化层**:跨 session、跨项目都能召回
> - **RAG 第一原则**:`kg_rag_rust find` 召回的就是 wiki 里的内容

## Process

1. **校验工具链**:`mr version`
2. **扫描本轮新增方法树**:`methods/trees/` 中 step 数 > 0 且未在 wiki 的
3. **生成 wiki 入口**:
   - 索引页:`llmwiki/topics/method-tree-index.md`(自动重建,仿 TREE-INDEX.md)
   - 单树页:`llmwiki/topics/method-tree/<T-id>.md`(frontmatter + body)
4. **互引**:wiki 页 → RULES-TREE 相关 RULE;RULES-TREE → wiki 沉淀池
5. **更新 llmwiki/INDEX.md**

## 标准输出格式

```
mr wiki  ─────────────────────

  扫描到 1 棵新方法树: T-20260813200606-000
  ✓ wiki 索引: llmwiki/topics/method-tree-index.md
  ✓ 单树页: llmwiki/topics/method-tree/T-20260813200606-000.md
  ✓ llmwiki/INDEX.md 更新

  沉淀统计:
    本轮新增 1 棵
    llmwiki/ 总方法树 wiki 数: 9 (含本次 1 棵)
```

## Tags(共享字典)

- `wiki:` 沉淀到 wiki — **Replacement**:`mr run`(新建时)
- `persist:` 跨 session 持久化 — **Replacement**:`mr memo`(短时备忘时)
- `index+:` 更新索引 — **Replacement**:`/mr-show`(只看不写时)

## 永不精简的边界

1. **run 完必跑 wiki**(不是"run 完就完事")
2. **方法树必带 frontmatter**(title / T-id / task / date / 关键 skill / 难度)
3. **wiki 页必互引 RULES-TREE**(不孤立沉淀)
4. **失败方法树也要 wiki**(失败经验价值最大)

## Boundaries

- ✅ 管:`llmwiki/topics/method-tree/` 沉淀 + 索引 + 互引
- ❌ 不管:`methods/trees/` 本身(那是 `method-tree-show` 的领域)
- ❌ 不管:RULES-TREE.md(那是八荣八耻的沉淀)

## 必背三句话

1. **"run 完必 wiki"** — 不是"run 完就睡"
2. **"失败树也要 wiki"** — 不是"失败丢脸,别留"
3. **"wiki 必互引 RULES-TREE"** — 不是"扔进 wiki 就完事"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 跑任务:[method-tree-run/SKILL.md](../method-tree-run/SKILL.md)
- 反馈闭环:[method-tree-feedback/SKILL.md](../method-tree-feedback/SKILL.md)
- 工具文档:[METHOD-TREE.md](~/.pi/agent/projects/lsx-mp-rust/methods/METHOD-TREE.md)
