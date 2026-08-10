# 真实 LLM 对照实验使用方式

## 默认（确定性模拟）

```bash
node scripts/run-benchmark.js
```

用于在没有 LLM 时验证管线：构造 prompt、跑 4 种模式、写 JSON 报告、汇总平均分和 token。
确定性模式内置的分数仅作为“管线是否工作”的自检，不构成真实收益证据。

## 真实 LLM

```bash
set EIGHT_RULES_LLM=openai
set OPENAI_API_KEY=sk-...
set OPENAI_BASE_URL=https://api.openai.com/v1
set OPENAI_MODEL=gpt-4o-mini
node scripts/run-benchmark.js
```

也可换成 `https://api.deepseek.com/v1` 等兼容端点。

每次任务会以：

- baseline：无规则提示
- lite：注入精简摘要
- full：注入摘要 + 门禁（不重复塞完整规则）
- ultra：注入摘要 + 4 条门禁

四份不同 prompt 发出，采集 prompt/completion token、违规、耗时、模型原始输出到：

```text
benchmarks/reports/latest.json
```

## 复现的注意事项

- 真实模式下，每次运行会消耗真实 token 和真实费用
- 同一 scenario 同一 mode 建议至少运行 3 次取中位数
- 真实模式与确定性模式不应混用做平均，否则会失去可比性
- 模型升级后请同步重跑 baseline，否则结论不可外推
- 不要只比较代码行数或 token，必须同时比较：分数、违规数、测试通过率、过度设计检查
