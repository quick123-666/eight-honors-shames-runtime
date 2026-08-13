# 八荣八耻 Rules Help — 人类可读文档

> **配套**:本目录人类可读版 ↔ [`skills/eight-rules-help/SKILL.md`](../skills/eight-rules-help/SKILL.md)(机器可读版)。
> **生成**:2026-08-13,RULE-EIGHT-RULES-SKILLS-001 沉淀配套。

---

## 1. 一句话

八荣八耻 = AI 协作纪律 28 条 + 4 强度档 + 反漂移硬话术。**ACTIVE EVERY RESPONSE**。

---

## 2. 4 强度档速查

| 档位 | 行为 | 触发 |
|---|---|---|
| **off** | 完全停用(罕见,默认不要)| `/rules off` / `"停止八荣八耻"` / `"normal mode"` |
| **lite** | 写用户要的 + 一句话点名更严替代;**不主动重构** | `/rules lite` |
| **full** | **默认**。28 条全执行 | `/rules`(无参)|
| **ultra** | 主动挑战需求;严苛 review;**敢删** | `/rules ultra` |
| **review**(独立档) | 只跑 `-review` 子 skill,持久模式不变 | `/rules-review` |

**持久化路径**:`~/.config/eight-rules/state.json`(Windows: `%APPDATA%\eight-rules\state.json`)

---

## 3. 6 命令速查

| 命令 | 子档 skill | 作用 |
|---|---|---|
| `/rules` 或 `/rules <mode>` | `eight-rules`(主) | 切档 / 显示当前档 |
| `/rules-review` | `eight-rules-review` | 审当前变更:复用/假设/安全/校验/过度工程 |
| `/rules-audit` | `eight-rules-audit` | 审整个仓库:违规清单 + 修复优先级 |
| `/rules-accept` | `eight-rules-acceptance` | 8 项验收:需求/代码/测试/构建/安全/文档/回滚/遗留 |
| `/rules-benchmark` | `eight-rules-benchmark` | 跑 baseline/lite/full/ultra 基准对比 |
| `/rules-help` | `eight-rules-help` | 速查(本卡的 skill 版本) |

---

## 4. 关闭方式(3 种等价)

- `/rules off`(命令)
- `"停止八荣八耻"`(自然语言)
- `"normal mode"`(英文)

**resume**:`/rules` = 回到 full(默认)。

---

## 5. 配置默认档

### 环境变量(最高优先)

```bash
# Windows
setx EIGHT_RULES_DEFAULT_MODE "lite"
# Linux/macOS
export EIGHT_RULES_DEFAULT_MODE=lite
```

### 配置文件

- macOS/Linux:`~/.config/eight-rules/config.json`
- Windows:`%APPDATA%\eight-rules\config.json`

```json
{ "defaultMode": "lite" }
```

### 解析顺序

env > config > `"full"`(默认)

---

## 6. 反漂移硬话术(每轮注入)

`onSessionStart` 和 `onBeforeAgentStart` 都在 hint 前置:

```
[八荣八耻已激活 · ${mode} · 28条 · NO DRIFT. Still active if unsure.
Off only: "停止八荣八耻" / "normal mode" / "/rules off".
换档: /rules lite|full|ultra|off]
```

> 对标 Ponytail `ponytail-activate.js` 的 `"PONYTAIL MODE ACTIVE — level: full"`。

---

## 7. 共享 5-tag 字典(`review`/`audit` 同源)

| tag | 含义 | 例子 |
|---|---|---|
| `delete:` | 死代码 / 投机特性 | 未用 import,无 caller flag |
| `stdlib:` | 重造 stdlib | `dict(zip(k,v))` 替手写 loop |
| `native:` | 平台能做的事 | `<input type="date">` 替 flatpickr |
| `yagni:` | 单实现抽象 | AbstractRepo with one impl → inline |
| `shrink:` | 同逻辑行数更少 | `Counter` 替手写 dict 累加 |
| `drift:` *(八荣八耻专有)* | 规则副本漂移 | AGENTS.md vs RULES.md 版本错位 |
| `unsafe:` *(八荣八耻专有)* | 砍了永不精简的边界 | 砍 trust-boundary 校验 → HIGH |

---

## 8. 永不精简的边界(6 项)

简化时**永不砍**:

1. 信任边界的输入校验(用户输入 / 文件路径 / 网络数据)
2. 防止数据丢失的错误处理(准则 22)
3. 安全(路径穿越 / 注入 / 权限)
4. 可访问性基础(标签 / ARIA / 错误提示)
5. 用户显式请求的内容(准则 25)
6. 数学正确性自检(准则 7)

---

## 9. 与 Ponytail 对比

| 维度 | Ponytail | 八荣八耻 |
|---|---|---|
| 主档 | `ponytail/SKILL.md` | `eight-rules/SKILL.md` |
| 子档数 | 5 | **6**(多 -acceptance)|
| 强度档 | lite/full/ultra/off | lite/full/ultra/off + review 独立档 |
| 触发词 | 英文 + 命令 | **中英双语** + 命令 |
| 反漂移话术 | "ACTIVE EVERY RESPONSE" | "**NO DRIFT**" + 中文版 |
| 反思文协 | Ponytail `ponytail-debt` | 八荣八耻 `decision-annotation` |

---

## 10. 相关文档

- [`skills/eight-rules/SKILL.md`](../skills/eight-rules/SKILL.md) — 主持续档(机器可读)
- [`skills/eight-rules-help/SKILL.md`](../skills/eight-rules-help/SKILL.md) — 速查 skill
- [`docs/ponytail-tech-report.md`](ponytail-tech-report.md) — 同源 Ponytail 研究
- [`RULES.md`](../RULES.md) — 28 条完整版 + 六章
- [`AGENTS.md`](../AGENTS.md) — 精简版 + 输出骨架
- [`RULES-TREE.md`](../RULES-TREE.md) — 沉淀池(RULE-EIGHT-RULES-SKILLS-001)

---

> **生成信息**:本文件由 `RULE-EIGHT-RULES-SKILLS-001` 沉淀配套自动生成于 2026-08-13。
> 双层架构:1 主持续(`eight-rules/SKILL.md`) + 6 子 one-shot。