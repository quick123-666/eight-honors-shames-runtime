---
name: method-tree-help
description: >
  Quick-reference card for 方法树 modes, skills, and commands. One-shot
  display, not a persistent mode. Trigger: "/mr help" / "/mr-help" /
  "method tree help" / "方法树 help" / "how do I use method tree" /
  "what mr commands"。对标 eight-rules 的 `eight-rules-help` 子档。
homepage: ./RULES-TREE.md
license: MIT
---

# 方法树 Help — Quick Reference

Display this reference card when invoked. **One-shot**, do NOT change mode,
write flag files, or persist anything.

## 4 强度档(主持续 skill)

| Level | Trigger | What changes |
|-------|---------|--------------|
| **off** | `/mr off` / `"停止方法树"` / `"no mr"` | 完全停用(罕见) |
| **Lite** | `/mr lite` | **明显**失守或新流程跑通才沉淀;**不**主动 |
| **Full** | `/mr`(无参) | **默认**。每次失守/新流程自问"是否沉淀" |
| **Ultra** | `/mr ultra` | **任何**任务完成都自问"要不要沉淀 RULE" |

Level sticks until changed or session end。env 覆盖:
`METHOD_TREE_DEFAULT_MODE=lite|full|ultra|off`(优先级最高)。

## 6 命令(子 skill 触发)

| Command | Skill | What it does |
|---------|-------|--------------|
| `/mr-pattern` 或 `/mr pattern` | `method-tree-pattern` | 找同主题已有 RULE(防重复发明) |
| `/mr-write` 或 `/mr write` | `method-tree-write` | 写新 7 段 RULE(按 RULES-TREE 沉淀格式) |
| `/mr-show` 或 `/mr show` | `method-tree-show` | 看现有 RULE 全文 |
| `/mr-publish` 或 `/mr publish` | `method-tree-publish` | 发布到 git + 5 文件版本号同步 |
| `/mr-feedback` 或 `/mr feedback` | `method-tree-feedback` | 跟踪引用次数/复用率 |
| `/mr-help` 或 `/mr help` | `method-tree-help` | **本卡** |

> 短触发:`/mr` = `/mr status` = 显示当前档。

## RULES-TREE 7 段格式(完整)

> 完整模板见 [method-tree-write/SKILL.md](../method-tree-write/SKILL.md)。
> 简版如下(每条 RULE 必含,无例外):

1. **触发** — 场景描述 + AI 被动接令的指令
2. **核心纠正** — 以前是 {临时动作},本 RULE 固化 = {N 阶闭环}
3. **本 RULE 定义**:
   - **Pre** 阶 — 动手前必跑(准则 1/5/7/8/9/20/21/24 等)
   - **Run** 阶 — 按序执行,每步 smoke 验证(准则 11/14/15/18/22/23 等)
   - **Post** 阶 — 验证收尾(准则 12/22 等)
4. **与 26 条关系表** — 涉及 RULES.md 哪些准则 + 性质(依赖/组合/强化)
5. **反模式 2-4 条** — 本会话踩过的真实坑(不是凑数)
6. **实战案例** — 本会话 vX.Y.Z,具体 commit/文件/行号
7. **下次如何避免 ≥ 3 步** — 同类问题可直接照做

## 当前沉淀池(截至 v3.4.5)

`grep -cE '^### RULE-[A-Z]+-[0-9]+\(' RULES-TREE.md` → **57 条 RULE**

| 类别 | 数量 | 示例 |
|---|---|---|
| 复合算子 | 4 | DEBUG/EXPLAIN/LEARN/REVIEW-001 |
| 兑底算子 | 1 | COVER-001 |
| 死循环系列 | 4 | LOOP-001/002/003/004 |
| 推送工作流 | 1+ | PUSH-V323-001 |
| MiniCog 系列 | 45+ | MINICOG-001 ~ 045+ |
| skill 化 | 2 | EIGHT-RULES-SKILLS-001 / METHOD-TREE-SKILLS-001 (v3.4.4,已 revert) |

## 关闭方式

3 种等价方式(择一即可):
- `"/mr off"`(命令)
- `"停止方法树"`(自然语言)
- `"no mr"`(英文)

**resume**:`/mr`(无参)= 回到 full(默认)。

## 配置默认档

**环境变量**(最高优先):
```bash
# Windows
setx METHOD_TREE_DEFAULT_MODE "lite"
# Linux/macOS
export METHOD_TREE_DEFAULT_MODE=lite
```

**Config 文件**:
- macOS/Linux:`~/.config/method-tree/config.json`
- Windows:`%APPDATA%\method-tree\config.json`

```json
{ "defaultMode": "full" }
```

**Resolution 顺序**:env > config > `"full"`(默认)

## 与八荣八耻联动

| 维度 | 八荣八耻 | 方法树 |
|---|---|---|
| 管 | AI 协作纪律(29 条) | RULES-TREE 7 段沉淀(57 RULE) |
| 档联动 | 默认 full(29 条全执行) | 默认 full(失守/新流程自问沉淀) |
| 关闭 | `/rules off` / `"停止八荣八耻"` | `/mr off` / `"停止方法树"` |
| 互引 | 准则 28 把方法树列为必沉淀 | 主档 Boundaries 段注明"不管纪律" |

**不联动**:各自独立档位。改方法树档不影响八荣八耻档(反之亦然)。

## 与外部方法树工具链的关系(澄清)

| 维度 | 外部工具链(mr.exe) | 本套件(RULES-TREE 7 段) |
|---|---|---|
| 产物 | 自动生成执行树(`methods/trees/T-*.md`) | 人写 7 段 RULE(RULES-TREE) |
| 触发 | 任务跑完 | 失守后/新流程跑通 |
| 工具 | `mr.exe run/tree/wiki` | `grep` + `cat` + `git commit` |
| 数据来源 | 工具记录 | 人脑反思 |
| 数量 | 8 棵(本项目) | 57 条(本项目) |
| 命名 | 同样叫"method tree" | 同样叫"method tree" |

**两个系统同名但完全独立**:
- 外部工具链是独立项目,有自己的 METHOD-TREE.md(不在本仓库)
- 本套件是 RULES-TREE 沉淀池的 pi skill 化
- 互不引用,各自维护

## More

- 沉淀池:[RULES-TREE.md](../../RULES-TREE.md)(57 条 RULE)
- 沉淀方法:[method-tree-write/SKILL.md](../method-tree-write/SKILL.md)
- 8 段精简:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 关联 RULE:`RULE-METHOD-TREE-001`(本套件自身的沉淀,见 RULES-TREE.md 末尾)
- 八荣八耻主档:[eight-rules/SKILL.md](../eight-rules/SKILL.md)
