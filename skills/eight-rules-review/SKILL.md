---
name: eight-rules-review
description: >
  Review a change against the 八荣八耻 rules, focusing on reuse, assumptions,
  safety, validation, and over-engineering. One-shot, does not apply fixes.
  Trigger: "/rules-review" / "/rules review" / "review for 八荣八耻" /
  "review this change against rules" / "规则审查" / "八荣八耻 review" /
  "simplify review" / "is this over-engineered" / "what can we delete"。
  对标 Ponytail 的 `ponytail-review`。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/AGENTS.md
license: MIT
---

# Eight Rules Review — Change Diff Review

Review current diff for 八荣八耻 compliance. **One-shot**, applies nothing.
对标 Ponytail `ponytail-review`(结构、tags、output 格式对齐)。

## Process

1. 先扫 diff(已读 / 暂存区 / HEAD~1 / 当前 branch)
2. 按 8 维度逐条判定:需求对齐 / 复用 / 安全 / 错误处理 / 测试 / 回滚 / 过度工程 / 范围缩减
3. 每条 finding = 1 行,定位 + tag + 修复
4. 结尾报 `net: -<N> 行可删, -<M> deps 可去` 或 `Lean already. Ship.`

## Tags(共享字典,与 `eight-rules-audit` 同源)

- `delete:` 死代码 / 投机特性 / 未用 import / 未触发 flag。**Replacement**: nothing。
- `stdlib:` 手写的 stdlib 已有的东西(`dict(zip(...))` / `functools.lru_cache` / `@dataclass`)。Name the function。
- `native:` 依赖做了平台能做的事(`moment.js` 换 `Intl.DateTimeFormat`、`flatpickr` 换 `<input type="date">`)。Name the feature。
- `yagni:` 单实现的抽象 / 无 caller 的 layer / 单 product 的 factory / 没人 set 的 config。
- `shrink:` 同逻辑行数更少。Show the shorter form。
- `unsafe:` 砍了"永不精简的边界"(见主档 `eight-rules/SKILL.md` "当 NOT to be lazy" 段)→ **Severity HIGH,必修复,非可选**。

## Output Format

每 finding 1 行:

`<path>:L<line>: <tag> <what>. <replacement>.`

或全仓 grep:`L<line>: <tag> <what>. <replacement>.`

**示例**:
- ✅ `L12-38: stdlib: 27 行 validator class. "@" + DNS MX query, 3 lines, real validation is the confirmation mail.`
- ✅ `repo.py:L88: yagni: AbstractRepository with one implementation. Inline until a second exists.`
- ❌ "This EmailValidator class might be more complex than necessary, have you considered..."(禁止 prose)

## End Report

```
net: -<N> 行可能,-<M> deps 可能,<K> unsafe findings(HIGH)
```

如果无 finding:`Lean already. Ship.`

## Boundaries

- **Scope**:八荣八耻合规 + 过度工程。Correctness / security holes / performance 不在范围 → 走常规 review pass
- **Action**: 只输出报告,**不**改文件(改文件走其他命令)
- **Revert**: `"停止 review"` / `"normal mode"`

## Honesty

- **NEVER** 把 "少写代码" 当成唯一成功标准(可能砍了 safety,见 `unsafe` tag)
- **NEVER** 报 "I rewrote this for clarity" 而没有 evidence path:line
- 单个 `assert` 自检或 1 个小测试文件是八荣八耻**最低要求**,**不**算 bloat,**不** flag 删除

---

> 生成:2026-08-13,八荣八耻子档改进(RULE-EIGHT-RULES-SKILLS-001 配套)