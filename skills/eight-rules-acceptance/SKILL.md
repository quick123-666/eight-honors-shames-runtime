---
name: eight-rules-acceptance
description: >
  Run final acceptance checks for a coding task under the 八荣八耻 rules.
  One-shot, does not modify code. Trigger: "/rules-accept" / "/rules accept" /
  "rules accept" / "rule accept" / "八荣八耻 acceptance" / "规则验收" /
  "is this task done" / "validate completion"。对标 Ponytail 主档
  "Output: code first" + 八荣八耻 "走流程" 6 步验收。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/AGENTS.md
license: MIT
---

# Eight Rules Acceptance — Final 8-Point Check

编码任务完成时的 8 项验收。**One-shot**, 不改代码。
对标 Ponytail "Output: code first" 段 + 八荣八耻准则 19 · 走流程。

## 8 项验收(全部必过)

| # | 项 | 检查方式 |
|---|---|---|
| 1 | **需求对齐** | 用户原话 vs 实际产出 = 100%?分阶段交付 ≠ 范围切片(准则 15)|
| 2 | **代码质量** | `cargo build --release` / `npm test` / `pytest` 全过?lint clean? |
| 3 | **测试覆盖** | 业务逻辑有单测?边界有 assert 或 test?(准则 16)|
| 4 | **构建通过** | 真跑 `build`/`test`/`lint`,不是"应该能跑"(准则 12)|
| 5 | **安全** | trust boundary 有校验?路径穿越?注入?权限? |
| 6 | **文档同步** | RULES.md / RULES-TREE.md / hooks/* 描述与代码一致? |
| 7 | **回滚** | 备份就绪?具体回滚命令(不是"已备份")? |
| 8 | **遗留风险** | TODO / FIXME / 占位 / 已知未修 → 列清单,不要隐藏 |

## Process

1. 读用户原始需求(对话开头)
2. 跑构建/测试(真命令,非估算)
3. grep 验证文档同步(`grep -nE "version|状态" RULES.md RULES-TREE.md`)
4. 列 8 项结果,**阻塞项必须明确**(不能"应该没问题")
5. 输出 `ACCEPT / BLOCKED / DEFERRED` 状态

## Output Format

```
✅ 需求对齐 — 路径 grep 通过
✅ 代码质量 — cargo build --release 0 warning
⚠️ 测试覆盖 — 业务逻辑 6/8 有单测,边界 2/8 缺 assert (准则 16 弱)
❌ 构建通过 — cargo test 失败 3 个 case(见 path:line)
❌ 安全 — rm -rf 无 .recycle_bin 兜底(准则 9 违)
✅ 文档同步 — grep 通过
✅ 回滚 — git diff 备份就绪
⚠️ 遗留风险 — TODO × 3 在 path1/path2/path3

=== 状态: BLOCKED ===
阻塞项:4,8  → 必须解决前 4(安全)才 ACCEPT
```

## Honesty(必须)

- **NEVER** 报 "ACCEPT" 当有 ❌ 项 — 那是给用户的伪验收
- **NEVER** 把 `⚠️` 隐藏或合并进 `✅` — 模糊状态 = 谎报
- **NEVER** 报 "应该能跑" / "我没真测但看起来对" — 准则 7 数学验证违
- 单个 `assert` 自检或 1 个小测试文件 = 最低,**不**算"测试覆盖强"
- 阻塞项必须在交付物**头部**列出,不能藏在脚注

## Boundaries

- **Scope**:8 项验收 + 真命令验证。范围扩展(加新功能 / 重构)→ 走其他命令
- **Action**: 只输出验收报告,**不**改代码 / **不**回滚(回滚是用户决策)
- **Revert**: `"停止 accept"` / `"normal mode"`

## 与 8 准则的对应

| 验收项 | 对应八荣八耻准则 |
|---|---|
| 1 需求对齐 | 准则 15 · 完整版(分阶段 ≠ 范围切片) |
| 2 代码质量 | 准则 12 · 验证(改完跑构建/测试) |
| 3 测试覆盖 | 准则 16 · 超越平凡(默认补全测试) |
| 4 构建通过 | 准则 12 · 验证(看真实错误) |
| 5 安全 | 准则 9 · 不搞破坏 / 边界校验 |
| 6 文档同步 | 准则 13 · 贴规范 |
| 7 回滚 | 准则 19 · 走流程(6 步最后是沉淀) + 准则 20 · 备份先行 |
| 8 遗留风险 | 准则 4 · 不装懂(不懂就说) |

---

> 生成:2026-08-13,八荣八耻子档改进(RULE-EIGHT-RULES-SKILLS-001 配套)