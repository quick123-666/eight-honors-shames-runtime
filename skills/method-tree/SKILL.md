---
name: method-tree
description: >
  方法树主持续 skill — ACTIVE EVERY RESPONSE. **RULES-TREE 7 段元工作流沉淀范式**(RULE-XXX-001 系列, 57 条)+ 反漂移硬话术。
  Default mode **full**。Trigger: "方法树"、"method tree"、"method-tree"、
  "沉淀 RULE"、"写 7 段 RULE"、"踩坑沉淀"、"RULES-TREE 7 段"。
  切换档位: `/mr lite|full|ultra|off`。停止: "停止方法树" / "no mr" / "/mr off"。
  本 skill 是双层架构的**主持续档**;one-shot 子档见
  method-tree-pattern / -write / -show / -publish / -feedback / -help。
  **重要**: 本套件是 RULES-TREE 7 段沉淀范式,**不是** 外部 mr.exe 工具链(那个独立运行,不在本 skill 范围)。
homepage: ./RULES-TREE.md
license: MIT
---

# Method Tree (方法树) — RULES-TREE 7 段沉淀范式

> **v3.4.5 修正**:本套件 v3.4.4 时错绑到了外部 mr.exe 工具链
> (commit bfad0bc,已 revert d6283ea)。
> **正解**:方法树 = RULES-TREE.md 里的 7 段元工作流沉淀(57 条 RULE-XXX-001)
> ——人写的、可复用的、踩坑或跑通流程后沉淀的 7 段 RULE。
> 与外部 mr.exe(自动生成执行树)**完全独立**。

## Persistence

**ACTIVE EVERY RESPONSE. NO DRIFT.** Still active if unsure. Off only:
`"停止方法树"` / `"no mr"` / `"/mr off"`。Default: **full**。

切换档位(`/mr lite|full|ultra|off`),persists 到 session 结束;
写入 `~/.config/method-tree/state.json`(Windows: `%APPDATA%\method-tree\state.json`)
+ 状态条显示当前档。

> **反漂移硬话术**:任何轮次,若检测到**失守**或**新跑通的复杂流程**,
> 立即自问"是否按 7 段格式沉淀到 RULES-TREE.md?"
> 不要等用户提醒。不要因为"流程很短"就跳过沉淀。

## 6 命令精简版

> 完整版见 [`方法树 help`](./method-tree-help/SKILL.md)。
> **不**写散文解释;**不**列长例;**只**保留可执行判定。

| 命令 | 用途 | 何时用 |
|---|---|---|
| `/mr-pattern` 或 `/mr pattern` | 找同主题已有 RULE(防重复) | 失守或新流程 → 第一步先查 |
| `/mr-write` 或 `/mr write` | 写新 7 段 RULE | 确认没有现成 → 按模板写 |
| `/mr-show` 或 `/mr show` | 看现有 RULE 全文 | 复用前必读全文(防凭印象) |
| `/mr-publish` 或 `/mr publish` | 发布(commit + 5 文件版本号同步) | RULE 写完 → 同步落盘 |
| `/mr-feedback` 或 `/mr feedback` | 跟踪引用次数/复用率 | RULE 跑 N 次后,看有效没 |
| `/mr-help` 或 `/mr help` | 速查 | 忘了格式时 |

## RULES-TREE 7 段格式(每条 RULE 必含)

> 完整模板见 [`method-tree-write/SKILL.md`](./method-tree-write/SKILL.md)。

```
### RULE-{NAME}-{NNN}({DATE vX.Y.Z 沉淀} — {一句话标题})

- **触发**: 任何 {场景}。AI 被动接令: "{某指令}" 时, 直接走本 RULE 的 Pre 阶检查 + Run 阶执行。
- **核心纠正**: 以前是 {临时动作}, 本 RULE 固化 = **{N} 阶闭环}: ...
- **本 RULE 定义** (形式化定义):
  - **Pre** (动手前必跑): R{xx} 准则 1, R{yy} 准则 2, ...
  - **Run** (按序执行): 1. R{zz} 步骤 1; 2. ...
  - **Post** (验证收尾): 1. ...
- **与 26 条关系表**:
  | Run 阶段 | 涉及准则 (RULES.md 行号) | 性质 |
  |---|---|---|
  | Pre | R1 + R5 + R7 + R8 | 依赖 |
  | Run | R11 + R14 + R15 + R18 | 组合 |
  | Post | R12 + R22 | 依赖 |
- **反模式 4 条** (本会话踩过): 1. ...; 2. ...; 3. ...; 4. ...
- **实战案例** (本会话 {vX.Y.Z}, {date}): Pre 阶段: ...; Run 阶段: ...;
- **数学正确性自检**: Pre/Run/Post 各项 ✓/✗, confidence X%
- **下次如何避免** (N 步走, 本 RULE 可复用): 1. ...; 2. ...; 3. ...
- **关联纪律**: 覆盖 RULES.md 准则 1 + 5 + 7 + 8 + 9 + 11 + 14 + 15 + 18 + 20 + 21 + 22 + 23 + 24 + 26 + 27 — N 条准则全可被本 RULE 调动
- **关联 RULE**: RULE-XXX-NNN (类似主题)
```

**总沉淀池**(截至 v3.4.5): **57 条 RULE**, 含 DEBUG/EXPLAIN/LEARN/REVIEW/COVER/LOOP×4/MINICOG×45+/PUSH-V323/MR-DIAG/EIGHT-RULES-SKILLS 等。

## 4 强度档

| Level | 行为 | 触发 |
|---|---|---|
| **off** | 完全停用(罕见,默认不要) | `/mr off` / `"停止方法树"` / `"no mr"` |
| **lite** | **明显**失守或新流程跑通才沉淀;**不**主动 | `/mr lite` |
| **full** | **默认**。每次失守或新流程跑通,自问"是否沉淀" → 适合就 `mr-write` | `/mr`(无参) |
| **ultra** | **任何**任务完成必自问"要不要沉淀 RULE" — 哪怕流程很短,沉淀也是 1-2 段 | `/mr ultra` |

切换持久到 session 结束。env 覆盖:`METHOD_TREE_DEFAULT_MODE=lite|full|ultra|off`。

## 当 NOT to be lazy(永不精简的边界)

RULES-TREE 7 段沉淀**永不砍**:

1. **触发场景必明**(失守/新流程的信号 + 复现条件)
2. **形式化定义必含**(Pre/Run/Post 三段式,不省)
3. **与 26 条关系表必填**(让每条 RULE 可追溯到哪些准则)
4. **反模式必 2-4 条**(本会话踩过 = 真实坑,不是凑数)
5. **实战案例必真实**(本会话 vX.Y.Z,具体 commit/文件/行号)
6. **下次如何避免必 ≥ 3 步**(可复用性 = 同类问题可直接照做)
7. **失守 ≥ 1 必沉淀**(无例外;主观判断"差不多沉淀" = 失守 RULE-10)

> **反弹效应防护**:不要往这条清单里加具体漏洞形态(会反弹);
> 只列**类别**,不给具体实例。

## Boundaries

**Eight Rules 管的是"AI 协作纪律",Method Tree 管的是"工作流沉淀"**。本 skill:

- ✅ 管:RULES-TREE 7 段 RULE 沉淀的**触发**、**写**、**查**、**发**
- ✅ 管:沉淀动作的 4 强度档 / 反漂移话术 / Boundaries
- ❌ 不管:具体编码风格(那是 `## 六、编码操作纪律` + `eight-rules-review` 的事)
- ❌ 不管:具体技术栈选型(那是用户决策)
- ❌ 不管:RULES.md 29 条的修订(那是八荣八耻规则升级流程)
- ❌ **不管**:外部 mr.exe 工具链(那是独立项目,有自己的 RULES-TREE 沉淀)

`"停止方法树"` / `"no mr"` / `"/mr off"` → revert。
Level persists until changed or session end。

## 相关 skill(双层架构子档)

| skill | 类型 | 触发 |
|---|---|---|
| `method-tree-pattern` | 子 one-shot | 找同主题已有 RULE(`/mr-pattern` 或 `/mr pattern`) |
| `method-tree-write` | 子 one-shot | 写新 7 段 RULE(`/mr-write` 或 `/mr write`) |
| `method-tree-show` | 子 one-shot | 看现有 RULE(`/mr-show` 或 `/mr show`) |
| `method-tree-publish` | 子 one-shot | 发布到 git + 5 文件同步(`/mr-publish` 或 `/mr publish`) |
| `method-tree-feedback` | 子 one-shot | 跟踪引用次数/复用率(`/mr-feedback` 或 `/mr feedback`) |
| `method-tree-help` | 子 one-shot | 速查(`/mr-help` 或 `/mr help`) |

## 与八荣八耻的关系(强化版)

> **方法树系统不是八荣八耻里面**(2026-08-13 用户反问后澄清)
> 但八荣八耻**主动要求**沉淀方法树(准则 6/10/24/28 共 7 处):
> - 准则 6·系统穷尽 → "沉淀侦察方法树"
> - 准则 10·不重复犯错 → "方法树复用:同类问题先查 RULES-TREE / codegraph_explore"
> - 准则 24·联系全文 → "不读完工单 / 方法树 / wiki 就开始工作"
> - 准则 28·跨会话沉淀 → "方法树必须落盘 RULES-TREE.md / AGENTS.md / wiki"
>
> **本 skill 的核心价值**:**把"AI 应该在失守后沉淀 RULE"这 4 条准则,变成每轮可见的硬话术**。
> 之前是文字要求(易忘),现在是 ACTIVE EVERY RESPONSE 注入(不会忘)。
>
> **层级关系**(外部方法树体系自述):
> RULES-TREE(宪法) > METHOD-TREE(体系说明书) > 方法树(具体产物)
>
> **联动**:八荣八耻主档**默认**是 full(29 条全执行),方法树主档**默认**是 full(自问"是否沉淀")。
> 两套档**不联动**——纪律管"怎么沉淀",沉淀管"沉淀什么"。

## 必背三句话

1. **"失守或新流程跑通 → 自问是否沉淀 7 段 RULE"** — 不是"沉淀留给用户提醒"
2. **"沉淀前先 `pattern` 找同主题"** — 不是"凭印象写新 RULE"
3. **"沉淀后必 `publish`(5 文件版本号同步)"** — 不是"沉淀完就睡"

---

> **生成信息**:本 skill 由 `skills/method-tree/SKILL.md` v3.4.5 重做于 2026-08-13,
> 对标 `eight-rules/SKILL.md` 双层架构 + 沉淀池改指 RULES-TREE 7 段。
> 沉淀为 `RULE-METHOD-TREE-001`(RULES-TREE.md 末尾,替代 v3.4.4 的 RULE-METHOD-TREE-SKILLS-001)。
> 完整沉淀池见 [RULES-TREE.md](../../RULES-TREE.md) — 57 条 RULE。
> 工具:`grep` + `cat` + `git commit`(无外部工具链依赖)。
