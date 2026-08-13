---
name: method-tree-run
description: >
  Run a task end-to-end through the lsx-mp-rust pipeline: open ticket →
  JSON plan → parallel execution → deliverable → method tree → wiki.
  Wraps `mr.exe run "<任务>"`. One-shot per invocation, may persist a method
  tree. Trigger: "/mr-run" / "/mr run" / "method tree run" / "用方法树跑" /
  "开单跑" / "lsx run" / "mr run"。对标 eight-rules 的「主持续档触发任务」模式。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/methods/TREE-INDEX.md
license: MIT
---

# Method Tree Run — End-to-End Task Pipeline

跑任务(开单→JSON plan→并行执行→交付→方法树→wiki)。
封装 `mr.exe run "<任务>"`。**One-shot per invocation**,可能产生方法树。

> **何时用 run 而不是 pick?**
> - 任务明确,直接开干 → **run**(完整管线)
> - 拿不准用什么 skill → 先 **pick** 预览
> - 复盘 / 反馈上次 → **feedback**

## Process(2 轮编排)

### Pre 轮:开单 + JSON 计划
1. **校验工具链**:`mr version` → 不通过则报错不跑
2. **校验项目根**:`--project-root` 或默认 cwd
3. **RAG 检索**:从 RULES-TREE / 历史方法树 / MEMORY.md 召回相关上下文
4. **生成 JSON plan**:skill picks + steps + 交付物清单
5. **创建 ticket**:`_tickets/T-<id>.json` 落地

### Run 轮:并行执行
1. **加载 plan**:从 ticket 读 JSON
2. **并行执行 steps**:每个 step 调对应 skill / 命令
3. **收集交付物**:聚合到 `deliverable/` 目录
4. **生成方法树**:`methods/trees/T-<id>.md` 落地(7 段:trigger / 形式化 / Pre-Run / 关系 / 反模式 / 实战 / 自检)
5. **更新 TREE-INDEX.md**:自动重建
6. **更新 skill_picks.jsonl**:记录选用日志

### Post 轮:沉淀(由 method-tree-wiki 接管)
- **不是 run 的职责**:wiki / 反馈 / scoreboard 由对应子 skill 接管
- run 完成后必跑:`mr wiki` + `mr feedback good|bad` + 必要时 `mr tree star`

## 标准输出格式

```
mr run "<任务>"  ─────────────────────

  ✓ Ticket: T-20260813200606-000
  ✓ Plan: 7 steps / 5 skills
  ✓ Method Tree: methods/trees/T-20260813200606-000.md
  ✓ Index updated: methods/TREE-INDEX.md

  下一步:
    1. /mr-wiki  (沉淀到 wiki)
    2. /mr-feedback good T-... <理由>  (反馈)
    3. /mr-show T-...  (查看方法树)
```

## Tags(共享字典)

- `run:` 完整管线 — **Replacement**:`mr pick`(轻量预览时)
- `tree:` 必建方法树 — **Replacement**:`mr memo`(只备忘不建树)
- `wiki+:` run 完必跑 wiki — **Replacement**:`/mr-wiki` 单独触发

## 永不精简的边界(本 skill 专项)

1. **方法树 steps 不能 0**(失败也要有失败树)
2. **方法树 skills 不能 0**(选不到 skill 也要记录"为什么选不到")
3. **`--dry-run` 预览后再真跑**(防误触发)
4. **执行结果必须有交付物路径**,不留"应该完成了"
5. **失败立即关单 + 写失败方法树**,不"重试一下"

## Boundaries

- ✅ 管:开单 / 编排 / 执行 / 关单 / 方法树生成
- ❌ 不管:wiki 沉淀(`method-tree-wiki`)
- ❌ 不管:反馈评分(`method-tree-feedback`)
- ❌ 不管:具体 skill 怎么用(那是各 skill 的事)

## 必背三句话

1. **"任务明确 → run;拿不准 → pick 先"** — 不是"先 run 跑跑看"
2. **"run 完必跑 wiki + feedback"** — 不是"run 完就完事"
3. **"失败也要有失败树"** — 不是"失败不写方法树,丢脸"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 沉淀:[method-tree-wiki/SKILL.md](../method-tree-wiki/SKILL.md)
- 反馈:[method-tree-feedback/SKILL.md](../method-tree-feedback/SKILL.md)
- 工具文档:[METHOD-TREE.md](~/.pi/agent/projects/lsx-mp-rust/methods/METHOD-TREE.md)
