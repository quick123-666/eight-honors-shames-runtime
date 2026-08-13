---
name: method-tree-feedback
description: >
  Close the loop on method tree usefulness — record good/bad feedback,
  view scoreboard (选用 + 反馈统计). Wraps `mr.exe feedback` and
  `mr.exe scoreboard`. One-shot. Trigger: "/mr-feedback" / "/mr feedback" /
  "method tree feedback" / "scoreboard" / "记反馈" / "查统计" / "周报"。
  对标 eight-rules-benchmark 的 scoreboard 风格。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/methods/TREE-INDEX.md
license: MIT
---

# Method Tree Feedback — Close the Loop

闭环方法树有效性——记 good/bad 反馈,查选用 + 反馈统计。
封装 `mr.exe feedback <good|bad> <T-id> <理由>` + `mr.exe scoreboard`。**One-shot**。

> **为什么需要反馈?**
> - **同方法树复用价值评估**:good = 值得复用;bad = 别再跑同样流程
> - **skill 选用质量评估**:scoreboard 显示"哪些 skill 选对了/选错了"
> - **跨 session 经验沉淀**:对标 RAG 第一原则(向量图谱召回 quality score)

## 2 子命令

| 子命令 | 用途 | 何时用 |
|---|---|---|
| `mr feedback good\|bad <T-id> <理由>` | 单条反馈 | 跑完方法树必填 |
| `mr scoreboard` | 统计(选用 + 反馈汇总) | 周报 / 月报 / 复盘 |

## Process

### 反馈子命令
1. **校验工具链**:`mr version`
2. **校验 T-id 存在**:`mr tree show <T-id>` 必能查到
3. **记录理由**:必填(空理由 = 缺反馈维度)
4. **写 `methods/skill_feedback.jsonl`**

### 统计子命令
1. **跑 `mr scoreboard`**
2. **格式化输出**为可读表格
3. **给改进建议**:
   - bad 率 > 30% → "考虑重写该流程"
   - good 率高但 score<0.3 → "skill 选对了但执行差"
   - 持续 high-score → "可作 ANCHOR,star 起来"

## 标准输出格式

### 反馈
```
mr feedback good T-20260811214210-000 "推送 v3.2.1 流程完整,8 步直接可用"

  ✓ 记录:methods/skill_feedback.jsonl (+1)
  ✓ 当前 good/bad 比:7/1 (87.5% good)
```

### 统计(scoreboard)
```
mr scoreboard  ─────────────────────

  总方法树: 8 棵 (含 ANCHOR 1 棵)
  总反馈: 8 条 (good 7 / bad 1, 87.5% good)
  Top 选用 skill (近 30 天):
    ⭐ codegraph_explore     8/8  (100%)
    ⭐ read                  8/8  (100%)
    ⭐ git_*                 6/8  (75%)
  Top bad 触发:
    × 编造 logic              1/1  (100% bad)

  建议:
    - codegraph_explore + read 选得很准(可固化进 RULES-TREE)
    - 编造 logic 是高风险(应强化准则 7 数学验证)
```

## Tags(共享字典)

- `good:` 跑得对 — **Replacement**:`mr tree star`(固化下来)
- `bad:` 跑得差 — **Replacement**:`/mr-audit`(深入查)
- `scoreboard:` 统计 — **Replacement**:`/mr-feedback` 单条(精细化)

## 永不精简的边界

1. **跑完方法树必填反馈**(不是"忘了就忘了")
2. **反馈必带理由**(空理由 = 无意义)
3. **bad 反馈必查根因**(不是"打个 bad 就过")
4. **scoreboard 必看趋势**(不是"只看绝对值")

## Boundaries

- ✅ 管:good/bad 反馈 + scoreboard + 改进建议
- ❌ 不管:具体方法树内容(那是 `method-tree-show`)
- ❌ 不管:沉淀 wiki(那是 `method-tree-wiki`)

## 必背三句话

1. **"跑完方法树必反馈"** — 不是"忘了就过"
2. **"反馈必带理由"** — 不是"打个标签就行"
3. **"bad 必查根因"** — 不是"挂 bad 标签完事"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 跑任务:[method-tree-run/SKILL.md](../method-tree-run/SKILL.md)
- 工具文档:[METHOD-TREE.md](~/.pi/agent/projects/lsx-mp-rust/methods/METHOD-TREE.md)
