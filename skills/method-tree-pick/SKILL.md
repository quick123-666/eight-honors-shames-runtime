---
name: method-tree-pick
description: >
  Preview skill recommendations for a given task — deterministic, no orchestration.
  Wraps `mr.exe pick "<任务>"`. One-shot, does NOT create a method tree.
  Trigger: "/mr-pick" / "/mr pick" / "method tree pick" / "method tree preview" /
  "推荐 skill" / "用什么 skill" / "pick skills for"。对标 eight-rules-help 的速查模式。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/methods/TREE-INDEX.md
license: MIT
---

# Method Tree Pick — Skill Recommendation Preview

预览某任务的 skill 推荐——确定性,无编排,不建方法树。
封装 `mr.exe pick "<任务>"`。**One-shot**,不持久化任何东西。

> **何时用 pick 而不是 run?**
> - 拿不准用哪个 skill,想先看推荐 → **pick**(轻,只读)
> - 任务来了,直接开干 → **run**(重,开单+编排+执行+方法树)
> - 复盘上次方法树用对了 skill 没 → **feedback**(反向)

## Process

1. **校验工具链**:`mr version` → 不通过则报错不跑
2. **运行预览**:`mr pick "<任务>"` → 拿到 ranked list
3. **解析输出**:
   - 分数 > 0.5 的 skill → "强烈推荐,优先用"
   - 分数 0.2-0.5 的 → "可能用,看场景"
   - 分数 < 0.2 的 → "可忽略"
4. **返回推荐表**给用户,等用户点头再 `mr run`

## 标准输出格式

```
mr pick "<任务>"  ─────────────────────

  强烈推荐(分>0.5):
    ⭐ codegraph-explore       0.87   适合"理解项目结构"
    ⭐ systematic-debugging    0.72   适合"已遇到 bug"

  可能用(0.2-0.5):
    △ bash-defensive-patterns  0.31   视脚本复杂度

  忽略(<0.2):
    × elevenlabs-voice        0.03   与任务无关

  提示:用户点头后跑 `mr run "<任务>"` 开单+编排
```

## Tags(共享字典,与 method-tree-* 同源)

- `pick:` 预览推荐 — **Replacement**:`mr run`(真跑时)
- `dry:` 只读,不写入任何文件 — **Replacement**:`mr run`(真写时)
- `noop:` 不产生方法树 — **Replacement**:`mr run`(建方法树时)

## Boundaries

- ✅ 管:从 skill 库选合适的子集
- ✅ 管:把 mr pick 输出解析成可读格式
- ❌ 不管:是否真要跑(用户决定)
- ❌ 不管:编排多步(那是 `method-tree-run`)
- ❌ 不管:沉淀到 wiki(那是 `method-tree-wiki`)

## 必背三句话

1. **"pick = 拿不准时用"** — 不是"每次任务前都 pick"(浪费 token)
2. **"pick 不开方法树"** — 不是"pick 也算开方法树"
3. **"pick 后看推荐,等用户点头"** — 不是"pick 后直接 run"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 真跑:[method-tree-run/SKILL.md](../method-tree-run/SKILL.md)
- 工具文档:[METHOD-TREE.md](~/.pi/agent/projects/lsx-mp-rust/methods/METHOD-TREE.md)
