---
name: method-tree-write
description: >
  Write a new RULE into RULES-TREE.md following the 7-section format.
  Triggered after `method-tree-pattern` confirms no duplicate. One-shot,
  appends a new RULE-XXX-NNN to RULES-TREE.md. Trigger: "/mr-write" /
  "/mr write" / "method tree write" / "写 RULE" / "沉淀 7 段" / "add rule to
  RULES-TREE" / "RULES-TREE 写一条"。对标 eight-rules-acceptance 的 8 项验收。
homepage: ./RULES-TREE.md
license: MIT
---

# Method Tree Write — Compose 7-Section RULE

按 7 段格式写一条新 RULE 到 RULES-TREE.md。
**先 `mr-pattern` 确认无重复**(准则 10 不重复犯错),再 `mr-write`。
**One-shot**。

> **何时写新 RULE?**
> - 失守 ≥ 1 条准则(踩坑)→ 必写(准则 10 + 28)
> - 新跑通的复杂流程(> 3 步)→ 必写(沉淀复用)
> - 用户明确说"沉淀这条经验"→ 必写
>
> **何时不写?**
> - 简单的一次性任务(没什么可复用的)
> - 已知 pattern 已覆盖(直接引用,不重复发明)

## Process

1. **三段元数据先填**:
   - `### RULE-{NAME}-{NNN}({DATE vX.Y.Z 沉淀} — {一句话标题})`
   - NAME: 大写英文,主题词(L00P/PUSH/MINICOG/...)
   - NNN: 3 位数字(001, 002, ...;同主题顺序)
   - DATE + vX.Y.Z: 沉淀日期 + 当前项目版本
2. **逐段填充 7 段**(见下方完整模板)
3. **本地校验**:
   - `wc -l` 增量 ≥ 30 行(短于 30 行的 RULE = 偷懒)
   - 7 段全有(grep 校验)
4. **写入 RULES-TREE.md 末尾**(`cat >>`,不覆盖)
5. **不立即 commit** — 让 `mr-publish` 同步 5 文件版本号后再 commit

## 7 段完整模板

```markdown
### RULE-{NAME}-{NNN}({DATE vX.Y.Z 沉淀} — {一句话标题})

- **触发**: 任何 {场景}。AI 被动接令: "{某指令}" 时, 直接走本 RULE 的 Pre 阶检查 + Run 阶执行。
- **核心纠正**: 以前是 {临时动作}, 本 RULE 固化 = **{N} 阶闭环}: {列表}。
- **本 RULE 定义** (形式化定义):
  - **Pre** (在动手前必跑完, 任何一项 fail = 暂停重对齐):
    - R1 查接口 — {本主题查什么}
    - R5 确认后行 — {本主题需要用户拍板什么}
    - R7 数学验证 — {本主题的量化指标}
    - R8 复述前必验证 — {本主题的 grep 校验点}
    - R9 不搞破坏 — {本主题的备份策略}
    - R20 备份先行 — {具体 cp 命令}
    - R21 回收站 — {具体 _recycle_bin 路径}
    - R24 联系全文 — {5 文件同步点}
  - **Run** (按序执行, 每步 smoke 验证):
    1. R{xx}+R{yy} 步骤描述
    2. R{zz} 步骤描述
    ...
  - **Post** (验证收尾):
    1. R{aa} 验证步骤
    2. R{bb} 沉淀步骤
- **与 26 条关系表**:
  | Run 阶段 | 涉及准则 (RULES.md 行号) | 性质 |
  |---|---|---|
  | Pre 阶段 | R1(:41) + R5(:98) + R7(:142) + ... | 依赖 |
  | Run 阶段 | R11(:215) + R14(:257) + ... | 组合 |
  | Post 阶段 | R12(:229) + R22(:387) | 依赖 |
- **反模式 N 条** (本会话踩过):
  1. {真实坑 1 + 修复 + 验证命令}
  2. {真实坑 2 + 修复 + 验证命令}
  ...
- **实战案例** (本会话 vX.Y.Z, {date}):
  - **Pre 阶段** (N 步齐): 1. ...; 2. ...; ...
  - **Run 阶段** (N 步): 1. ...; 2. ...; ...
  - **Run 阶段踩的坑** (反转于本会话): {X} + {Y} → 上文 "反模式" 引用
- **数学正确性自检** (按本 RULE N 阶逐项检查):
  - Pre R1 查: ✓/✗ {具体数字}
  - Run R7 验证: ✓/✗ {数字 1:1}
  - Run R8 验证: ✓/✗ {远程 commit 数}
  - confidence ≥ X% (公式 ...)
- **下次如何避免** (N 步走, 本 RULE 可复用):
  1. {同类问题前必跑的命令 1}
  2. {必跑的命令 2}
  3. {必跑的命令 3}
- **关联纪律**: 覆盖 RULES.md 准则 1 + 5 + 7 + 8 + 9 + 11 + 14 + 15 + 18 + 20 + 21 + 22 + 23 + 24 + 26 + 27 — N 条准则全可被本 RULE 调动
- **关联 RULE**: RULE-XXX-NNN (类似主题,做引用)
```

## Tags(共享字典)

- `write:` 写新 — **Replacement**:`mr-pattern`(先查后写)
- `7-sec:` 7 段格式 — **Replacement**:`/mr-show`(有 63 条现成的可参考)
- `cat>>:` 追加不覆盖 — **Replacement**:`mr-publish`(commit + 5 文件同步)

## 永不精简的边界

1. **写前必 `mr-pattern` 0 命中**(不是"凭印象写")
2. **7 段必全**(少 1 段 = 失守)
3. **反模式必 2-4 条真实坑**(不是凑数)
4. **实战案例必真实**(本会话具体 commit/行号)
5. **下次如何避免必 ≥ 3 步**(可复用性)
6. **不立即 commit** — 等 `mr-publish` 同步

## Boundaries

- ✅ 管:7 段模板 + 写入 RULES-TREE.md 末尾 + 校验段完整性
- ❌ 不管:commit(`method-tree-publish`)
- ❌ 不管:5 文件版本号同步(`method-tree-publish`)
- ❌ 不管:找同主题(`method-tree-pattern`)

## 必背三句话

1. **"写前必 pattern"** — 不是"写完发现重复再删"
2. **"7 段必全,反模式必真"** — 不是"凑数"
3. **"写完不 commit,等 publish"** — 不是"写完 git add 就完事"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 先 pattern:[method-tree-pattern/SKILL.md](../method-tree-pattern/SKILL.md)
- 发布:[method-tree-publish/SKILL.md](../method-tree-publish/SKILL.md)
- 沉淀池:[RULES-TREE.md](../../RULES-TREE.md)
