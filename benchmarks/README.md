# 八荣八耻 Benchmark — 设计文档

> **目的**:量化对比 baseline(无八荣八耻)/ lite / full / ultra 4 档在固定场景的行为差异。
> **对齐**:Ponytail `benchmarks/results/2026-06-18-agentic.md`(n=4, Haiku 4.5)。
> **状态**:**设计稿**(2026-08-13),待 baseline 实测 + N 次重复跑。

---

## 1. 设计原则

| Ponytail 经验 | 八荣八耻落地 |
|---|---|
| baseline = 真实 Claude Code 无 skill | baseline = 真实 LLM 无 hint 注入(无 hooks 触发) |
| n=4 重复跑(per arm per task) | 同:**每场景每档 4 次重复** |
| 隔离 arm(避免污染) | **同**:每个 session 启动时设置 `EIGHT_RULES_DEFAULT_MODE` 到目标档 |
| 测量:`git diff` added lines | **同**:`git diff` added lines + LLM 调用 tokens + 安全命中 + 漂移触发数 |
| 自我发现的污染 bug | **预先防**:`hooks/index.js` 在 baseline arm 必须禁用 |

## 2. 7 评估维度(对齐 Ponytail gain + 八荣八耻)

| 维度 | 测量方式 | 八荣八耻映射 |
|---|---|---|
| 行为合规 | 八荣八耻 28 条命中数(0-28)| 准则 7 数学验证 |
| 安全性 | 砍"永不精简边界"的次数(应=0)| 准则 9 不搞破坏 |
| 复用 | 复用既有函数的次数 | 准则 11 复用 |
| 测试 | 单测/assert 覆盖率 | 准则 16 超越平凡 |
| 过度设计 | 删除可删行数 | 准则 15 完整版 |
| Token | LLM 调用总 tokens | 准则 18 节约 token |
| 耗时 | 端到端 wall time | 准则 23 立即但完整 |

## 3. 4 强度档行为对照

| 档 | 关键差异 | 期望行为 |
|---|---|---|
| **baseline** | 不注入任何 hint | LLM 自然行为 |
| **lite** | 注入精简 hint(只核心 8 条)| LLM 知道八荣八耻存在,但**不主动重构** |
| **full** | 注入完整 28 条 + 摘要 + 门禁 + 硬话术 | **默认**,28 条全执行 |
| **ultra** | full + 主动挑战需求 | 敢说"你不需要这个,需要的话回我" |

## 4. 测试任务(待 baseline 实测后定)

**候选任务类型**:
1. **小型代码改动**(1-2 文件,50 行内)
2. **中型代码重构**(3-5 文件,200 行内)
3. **新增功能**(完整 spec)
4. **Bug 修复**(具体 bug 报告)
5. **文档生成**(README / API 文档)

每类任务 3 个具体题,4 arm × 4 重复 = 16 × 3 = 48 个测试用例。

## 5. 评分方法

```bash
# 单个 arm × 任务跑完后,自动化评分:
node benchmarks/scoring/score.js \
  --baseline benchmarks/results/<task>-baseline \
  --lite benchmarks/results/<task>-lite \
  --full benchmarks/results/<task>-full \
  --ultra benchmarks/results/<task>-ultra
```

评分输出 7 维度 × 4 档 的表格,对照 Ponytail gain 风格。

## 6. 与 Ponytail 的差异

| 维度 | Ponytail | 八荣八耻 |
|---|---|---|
| 模型 | Haiku 4.5(n=4) | MiniMax-M3(n=待定) |
| baseline | Claude Code 无 skill | LLM 无 hint 注入 |
| 范围 | 12 任务(real FastAPI repo)| 待定(可能 5-8 任务) |
| 安全 | 显式 adversarial 输入 | **基线**:是否砍永不精简边界 |
| 漂移 | 不测(单一 skill 不会漂移) | **新增**:hooks 漂移计数(原本应该激活但没激活的次数) |

## 7. 限制与诚实(NEVER print per-repo savings without evidence)

> 完整 benchmark **需 N 次重复 + 多模型**,本次设计**只完成设计文档**,**未跑完整数字**。
> 真跑需要:
> 1. 4 个独立 session 配置(`EIGHT_RULES_DEFAULT_MODE=full|lite|ultra|baseline`)
> 2. 至少 5 任务 × 4 arm × 4 重复 = 80 个测试用例
> 3. 自动化评分脚本(`benchmarks/scoring/score.js`)
> 4. 模型基准固定(防版本漂移)
>
> **当前状态**:只跑了 1 次 demo(见 `2026-08-13-eight-rules-vs-baseline-demo.md`),**不能作为权威数字**。

## 8. 与 RULE-XXX-001 沉淀配套

- **RULE-EIGHT-RULES-SKILLS-001**(双层 skill 架构)— 本 benchmark 是它的验证
- **RULE-LOOP-004**(条数/版本漂移)— benchmark 必须先跑条数对账

---

> **生成**:2026-08-13,八荣八耻 benchmark 设计稿(对标 Ponytail `benchmarks/`)。