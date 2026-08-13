---
name: eight-rules-audit
description: >
  Whole-repo audit for 八荣八耻 violations and missing quality safeguards.
  Like eight-rules-review, but scans the entire codebase instead of a diff.
  One-shot, does not apply fixes. Trigger: "/rules-audit" / "/rules audit" /
  "audit this repo for 八荣八耻" / "rules audit" / "规则审计" /
  "find violations in repo" / "what can I delete from this repo" /
  "find bloat"。对标 Ponytail 的 `ponytail-audit`。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/AGENTS.md
license: MIT
---

# Eight Rules Audit — Whole-Repo Audit

八荣八耻违规 + 缺失质量护栏的全仓审计。**One-shot**, applies nothing。
对标 Ponytail `ponytail-audit`(结构、tags、output 格式对齐)。

## Process

1. 扫全仓(排除 `node_modules` / `.git` / `target/` / `dist/` / `.venv`)
2. 按 8 维度逐项查:重复实现 / 未确认假设 / 危险删除 / 缺测试 / 缺错误处理 / 规则副本漂移 / 过度工程 / 范围缩减
3. 每个 finding = 1 行,tag + 修复 + path
4. **Ranked by impact** (大赢点先报)
5. 结尾报 `net: -<N> 行可删, -<M> deps 可去,<K> unsafe (HIGH)` 或 `Lean already. Ship.`

## Tags(共享字典,与 `eight-rules-review` 同源)

- `delete:` 死代码 / 投机特性 / 未触发 flag / 未用 import
- `stdlib:` 手写的 stdlib 已有(`dict(zip)` / `functools.lru_cache` / `@dataclass` / `pathlib` / `argparse`)
- `native:` 依赖做了平台能做的事(`moment` → `Intl` / `flatpickr` → `<input type="date">`)
- `yagni:` 单实现抽象 / 无 caller layer / 单 product factory
- `shrink:` 同逻辑行数更少
- `drift:` **八荣八耻专有**:规则副本在不同文件不一致(AGENTS.md vs RULES.md vs README)/ 版本号错位 / hook 未同步触发
- `unsafe:` 砍了"永不精简的边界" → HIGH,必修复

## Hunt Patterns(主动找的 7 类)

1. **重复实现**:同一函数/工具在 ≥2 个文件(grep for function name across files)
2. **未确认假设**:hardcoded 路径(无 env 兜底)/ SKILL 引用文件不存在
3. **危险删除**:`rm -rf` / `taskkill` / `drop` / 删 git 推送凭据 / 跨盘 mv 不备份
4. **缺测试**:改动业务逻辑但没 test(grep `def test_`/`it(` on changed modules)
5. **缺错误处理**:`try {} catch {}`(空 catch)/ `unwrap()` 无处理 / IO 无 retry
6. **规则副本漂移**:RULES.md 与 hooks/index.js 与 commands/*.toml 描述不一致
7. **过度工程化**:`delete` / `stdlib` / `native` / `yagni` / `shrink` 任一命中

## Output Format

`<tag> <what to cut>. <replacement>. [path]`

**示例**:
- ✅ `yagni: AbstractRepository with one implementation. Inline until second exists. [repo.py:88]`
- ✅ `drift: AGENTS.md says "21 条", RULES.md says "28 条", README.md says "v3.4.0". Sync required.`
- ✅ `unsafe: rm -rf _recycle_bin/. Use /recycle commands per rule-21. [scripts/cleanup.sh:42]`
- ❌ "There might be some redundancy in the codebase..."(禁止 prose)

## End Report

```
net: -<N> 行可删,-<M> deps 可去,<K> unsafe (HIGH)
```

如果无 finding:`Lean already. Ship.`

## Boundaries

- **Scope**:八荣八耻合规 + 缺失护栏。**Correctness / security holes / performance 显式不在范围** → 走常规审计 pass
- **Action**: 只输出报告,**不**改文件 / **不**触发重构
- **Revert**: `"停止 audit"` / `"normal mode"`

## Honesty

- **NEVER** 给 "估算节省 X%" 没 evidence path:line
- **NEVER** 把 drift / unsafe 降到 low priority(它们是 HIGH,见主档 Boundaries)
- 单个 `assert` 自检或 1 个小测试文件 = **最低要求**,**不**算 bloat

---

> 生成:2026-08-13,八荣八耻子档改进(RULE-EIGHT-RULES-SKILLS-001 配套)