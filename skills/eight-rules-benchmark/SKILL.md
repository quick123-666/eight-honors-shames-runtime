---
name: eight-rules-benchmark
description: >
  Run and interpret baseline/lite/full/ultra behavior benchmarks for 八荣八耻.
  One-shot, does not change mode or persist anything. Trigger:
  "/rules-benchmark" / "/rules benchmark" / "rules benchmark" / "rule benchmark" /
  "benchmark 八荣八耻" / "compare modes" / "baseline vs full vs ultra"。
  对标 Ponytail `ponytail-gain`(诚实协议 + scoreboard 风格)。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/AGENTS.md
license: MIT
---

# Eight Rules Benchmark — Mode Comparison

跑基准对比 **baseline / lite / full / ultra** 4 档在固定场景的行为差异。
**One-shot**, 不改 mode、不写 flag、不持久化。
对标 Ponytail `ponytail-gain`(scoreboard + honesty boundary)。

## Scoreboard(交付形态)

```
八荣八耻 benchmark              baseline vs lite/full/ultra · N tasks · M models

  行为合规      baseline  ████████████████████  100%
                lite      ████████████████····  82%   ▼ 18%
                full      ████████████████████  100%  (默认)
                ultra     ████████████████████  100%  + 主动挑战

  范围完整性    baseline  ████████████████████  100%
                lite      █████████████████···  91%   ▼ 9%
                full      ████████████████████  100%
                ultra     ████████████████████  105%  ← 主动挡需求

  Token 消耗    baseline  ████████████████████  100%
                lite      ██████████████······  70%   ▼ 30%
                full      ████████████████····  80%   ▼ 20%
                ultra     █████████████████···  92%   ▼ 8%

  速度          full      ▸ 1.0x (参考)
                lite      ▸ 1.3x
                ultra     ▸ 0.7x  ← 严格挡需求,可能慢
```

## 7 评估维度(对齐 Ponytail gain + 八荣八耻)

| 维度 | 八荣八耻映射 |
|---|---|
| 正确性 | 准则 7 · 数学验证 |
| 安全性 | 准则 9 · 不搞破坏(边界校验永不砍) |
| 复用 | 准则 11 · 复用 |
| 测试 | 准则 16 · 超越平凡(默认补全测试) |
| 过度设计 | 准则 15 · 完整版(完整 ≠ 膨胀) |
| Token | 准则 18 · 节约 token |
| 耗时 | 准则 23 · 立即但完整(快 ≠ 少想) |

## Honesty Boundary(必须)

- **NEVER** 给 per-repo 节省数:"this repo saved X lines/tokens"(unbuilt version 未写,无 baseline)
- **NEVER** 把"少写代码"当成唯一成功标准(ultra 可能慢,**砍安全会出事**)
- **NEVER** 把合规率虚标成 100% 当实际 <100%(检查证据 path:line)
- ✅ 必须用实测数据(benchmark 跑出来的,不是估算)
- ✅ 实测场景要列:**N 任务 × M 模型**,与 Ponytail `ponytail-gain` 的 "5 tasks · 3 models" 对齐
- ✅ 真实失败案例要标(如 Ponytail 公开承认 OpenAI 弱模型 email 校验 79-98% slip)

## Boundaries

- **Scope**:4 档行为对比 + 7 维度评估。代码本身审计 → `-audit`
- **Action**: 输出 scoreboard + 数据,**不**改 mode / **不**改 RULES.md / **不**跑 build
- **Revert**: `"停止 benchmark"` / `"normal mode"`

## 数据来源(必须可追溯)

每个数字必须给:
- 来源文件:`benchmarks/results/<date>-<name>.md`(本项目目录)
- 跑法:`n=4` 重复 + 模型 + 日期 + 任务清单
- 限制:"实测 vs 估算"必须标

---

> 生成:2026-08-13,八荣八耻子档改进(RULE-EIGHT-RULES-SKILLS-001 配套)