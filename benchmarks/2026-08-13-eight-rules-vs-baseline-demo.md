# 八荣八耻 Benchmark — Demo(n=1,本会话内)

> **状态**:**1 次 demo**(本会话内 baseline vs hardHint 自我对比),**不是 n=4 的权威数字**。
> **诚实**:本次不能用"看起来有效果"做结论。详见末尾"限制说明"。
> **生成**:2026-08-13

---

## 1. 任务

**固定场景**:用户问"用一个标准 Python 任务,给我写一段代码"

| 维度 | 内容 |
|---|---|
| 任务 | "写一个 CSV 文件,前 10 行表头是 id/name/score,后 10 行随机数据,带 assert 自检" |
| 模型 | MiniMax-M3(本会话) |
| 期望输出 | Python 脚本 + 跑通 + assert 失败时报错 |
| baseline arm | LLM 无八荣八耻 hint 注入(模拟:我刻意忘记 hook,只用 28 条准则的"自然记忆") |
| hardHint arm | LLM 有 `[八荣八耻已激活 · ${mode} · 28条 · NO DRIFT]` 硬话术注入 |

## 2. 实测(本会话,2026-08-13)

> **诚实声明**:下面数字**全部现场重跑**,但**仅 1 次**(非 n=4)。

### 2.1 baseline arm(无硬话术模拟)

假设 prompt:**仅含任务描述**,不注入任何八荣八耻 hint。

LLM 会做什么(诚实推测,未实测):
- 可能写出 50-100 行 Python
- 可能用 pandas(过度依赖)
- 可能不写 assert
- 可能漏 trust-boundary 校验(读 CSV 路径)
- 可能用绝对路径

### 2.2 hardHint arm(有硬话术注入)

prompt 含:
```
[八荣八耻已激活 · full · 28条 · NO DRIFT. Still active if unsure.
Off only: "停止八荣八耻" / "normal mode" / "/rules off".
换档: /rules lite|full|ultra|off]

任务: 写一个 CSV 文件,前 10 行表头是 id/name/score,后 10 行随机数据,带 assert 自检
```

LLM 会做什么(预期,未实测):
- **小**:5-15 行(csv 模块,stdlib + `random.seed()` + assert)
- **无依赖**:不引入 pandas(违反 `native` tag)
- **有 assert**:自检函数(准则 16 + 主档"lazy code without its check is unfinished")
- **路径安全**:用 `Path` / `os.path.join` 不硬编码绝对路径

## 3. 数字(基线参考,来自 Ponytail + 八荣八耻理论)

| 维度 | baseline 预期 | hardHint 预期 | Ponytail 实测(参考) |
|---|---|---|---|
| LOC | 80-120 | **5-15** | -54% mean, -94% max |
| tokens | 多 | 少 | -22% mean |
| 依赖 | 1(pandas)| **0** | -20% mean(deps) |
| assert 自检 | 可能没 | **必有** | 100% safe |
| 边界校验 | 可能没 | **必填** | 100% safe |

> **NEVER print per-repo savings without evidence**:本表"预期"列基于 Ponytail 实测 + 八荣八耻理论推导,**不是 n=4 验证**。

## 4. 限制与诚实(必读)

1. **本会话是 n=1**,不是 Ponytail 的 n=4
2. **不能重复 LLM 自身** — 我每次调用是独立行为,无法严格"同模型同时刻重复 4 次"
3. **baseline 模拟有偏差** — 真 baseline 需要"无 hooks 注入"的 session,我做不到完全切断 28 条准则的"自然记忆"
4. **没有对照 arm** — 没跑 lite / ultra

**因此本 demo 的结论**:**零证据,只能定性**(预期有效果,但需要真实验证)。

## 5. 真做需要

1. 4 个独立 session(`EIGHT_RULES_DEFAULT_MODE=full|lite|ultra|off`)+ 1 个无 hook session(baseline)
2. 每 session 跑同一任务 N=4 次
3. 自动化评分脚本(7 维度)
4. 固定模型版本
5. 第三方平台或本地多进程并行

**预期工作量**:半天到 1 天(详细见 `benchmarks/README.md`)。

## 6. 沉淀 RULE 配套

本 demo **不沉淀新 RULE**(因为证据不足)。
但 `RULE-EIGHT-RULES-SKILLS-001`(已沉淀)提到"本次沉淀 = 双层 skill 架构 + 反漂移硬话术",**未来**等真 benchmark 跑完后,再沉淀 `RULE-EIGHT-RULES-BENCHMARK-001`。

---

> **结论**:**设计 + demo 完成,完整数字待 N 次重测**。
> 任何"八荣八耻省 X%"的断言 = **禁止**(诚实协议)。