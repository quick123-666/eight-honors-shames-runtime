---
name: decision-annotation
description: >
  Add or audit eight-rules decision annotations for intentional simplifications
  and boundaries. Companion to eight-rules-review, focused on the
  `eight-rules:` comment marker convention. One-shot. Trigger:
  "eight-rules annotation" / "add eight-rules: comment" / "annotation
  audit" / "decision annotation" / "eight-rules 决策标注" / "八荣八耻
  标注" / "audit annotations" / "what annotations should I add"。
  对标 Ponytail `ponytail-debt`(扫描 + ledger + ceiling/upgrade pattern)。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/AGENTS.md
license: MIT
---

# Decision Annotation — 八荣八耻:`comment` Convention

`eight-rules:` 注释 = 声明"这是有意简化/特殊决策" + 标注天花板 + 给出升级触发条件。
让"later"不变成"never"。对标 Ponytail `ponytail-debt`(扫描 + ledger 模式)。

## When to Use

**只在确有工程决策需要记录时**使用 `eight-rules:`。不是每段代码都要标。

适用场景:
- ✅ 简化掉了一个 guard(准则 22 帮助解难):标升级条件(并发上来时)
- ✅ 跳了某个 edge case:标原因 + 何时补
- ✅ 选了一个"非主流"方案:标理由 + 何时切换
- ✅ 故意留下 TODO:标升级条件
- ❌ **不**用在"代码本身清楚"的注释
- ❌ **不**用来掩盖缺少安全校验或测试(那是 unsafe,见 `eight-rules-review` tag)

## Format(强制)

```
# eight-rules: <ceiling>, <upgrade path>
```

或:

```rust
// eight-rules: <ceiling>, upgrade: <trigger>
```

或 4 段全:

```
# eight-rules: <what> | <reason> | <ceiling> | <upgrade path>
```

## 4 字段(主档 4 字段,可全可省)

| 字段 | 必填? | 示例 |
|---|---|---|
| `what` | ✅ | "单文件 IO 不并发" |
| `reason` | ⚠ 可选 | "用户需求单线程;并发由上游限制" |
| `ceiling` | ✅ | "100 QPS 以上会卡" |
| `upgrade path` | ✅ | "切换到 tokio + 多 worker" |

## Process — Add(写代码时)

1. 决定简化/特殊决策 → 写 `eight-rules:` 注释
2. ceiling 必填(数字/条件)
3. upgrade path 必填(可观察触发)
4. 一起 commit(不能"晚点补")

## Process — Audit(审已有代码时)

`grep -rnE '(//|#) ?eight-rules:' .`(跳过 `node_modules` / `.git` / `target/` / `dist`)

每个命中 = 1 行 ledger row:

`<file>:<line> — <what>. ceiling: <the limit named>. upgrade: <the trigger to revisit>.`

**示例**:
```
src/io.rs:42 — 单文件 IO 不并发。ceiling: 100 QPS。upgrade: 切换 tokio + 多 worker。
src/cache.rs:88 — 全局锁。ceiling: 单进程 < 1ms 响应。upgrade: per-account locks。
```

**rot 风险 flag**:任何 `eight-rules:` 注释**没有 upgrade path** 的 → 标 `no-trigger`,它会默默腐烂。

**End report**:`<N> markers, <M> with no trigger.`

无 finding:`Clean ledger. No 八荣八耻 debt.`

## Boundaries

- **Scope**:八荣八耻:`注释的添加 / 审计。代码逻辑 → `-review`
- **Action**: 写注释 / 输出 ledger,**不**改业务逻辑(改业务逻辑是 `-review` 的事)
- **Revert**: `"停止 annotation"` / `"normal mode"`

## Honesty

- **NEVER** 把 `eight-rules:` 用在"我没想清楚但先 ship"的情况 — 那是 deferral 不是 annotation
- **NEVER** 写"以后再说"的 upgrade path — 必填**可观察触发条件**(e.g. ">100 QPS", "next major version")
- **NEVER** 在 ceiling 缺失时写 `eight-rules:` 注释 — 没 ceiling 就是 rot 风险

## Boundaries 与主档对应

| 本 skill 字段 | 主档 `eight-rules/SKILL.md` 对应段 |
|---|---|
| `what` | "Lazy code without its check is unfinished" |
| `reason` | "Mark intentional simplifications" |
| `ceiling` | "The ladder shortens the solution, never the reading" |
| `upgrade path` | 主档 Boundaries 的"revert 方式" 同样必填可观察条件 |

---

> 生成:2026-08-13,八荣八耻子档改进(RULE-EIGHT-RULES-SKILLS-001 配套)