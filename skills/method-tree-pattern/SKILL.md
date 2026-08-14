---
name: method-tree-pattern
description: >
  Search RULES-TREE.md for existing RULEs on the same topic — to avoid
  reinventing or duplicating. Uses `grep` + vector search (kg_rag_rust find).
  One-shot, does NOT create new RULE. Trigger: "/mr-pattern" / "/mr pattern" /
  "method tree pattern" / "find similar rule" / "RULES-TREE 找同主题" /
  "有没有类似 RULE" / "before write rule check"。对标 eight-rules-help 速查模式。
homepage: ./RULES-TREE.md
license: MIT
---

# Method Tree Pattern — Find Existing Similar RULEs

写新 RULE 前必跑——**先找同主题已有 RULE**,防重复发明。
用 `grep -nE 'RULE-XXX|<关键词>' RULES-TREE.md` + 向量图谱 `kg_rag_rust find "<topic>"`。
**One-shot**,不写任何文件。

> **为何必须 pattern 先?**
> - 八荣八耻准则 10·不重复犯错 → "同类问题先查 RULES-TREE"
> - 八荣八耻准则 11·复用 → "主动扫项目已有能力"
> - 否则:同主题 RULE 已存在,新写 1 条 = 重复 = 浪费 + 检索成本 ↑

## Process

1. **关键概念抽取**:从失守/新流程中提取 2-3 个关键词
2. **三路检索**(RAG 优先,文件兜底):
   - **第一手段:向量图谱**:`./kg_rag_rust/target/release/kg_rag_rust.exe find "<关键词>" --top 5`
   - **第二手段:grep 倒排**:`grep -nE 'RULE-[A-Z]+-[0-9]+\(' RULES-TREE.md | head -20`
   - **第三手段:全文搜**:`grep -nE '<关键词1>|<关键词2>' RULES-TREE.md`
3. **判定**:
   - 找到 ≥ 1 条主题重叠 → **读全文**(`mr-show <RULE-id>`)→ 决定是引用还是新写
   - 找到 0 条 → 才写新 RULE
4. **返回搜索报告**给用户,**等用户拍板**后才 `mr-write`

## 标准输出格式

```
mr pattern "死循环"  ─────────────────────

  第一手段 — 向量图谱 (top 5):
    ⭐ RULE-LOOP-001  L1175  三套终止信号死循环修复
    ⭐ RULE-LOOP-002  L1204  commit 前 5 文件版本号对称检查
    ⭐ RULE-LOOP-003  L1255  AI 把活推给用户禁止
    ⭐ RULE-LOOP-004  L3737  条数/版本/沉淀状态双向漂移

  第二手段 — grep 倒排 RULE-XXX-001:
    RULE-LOOP-001 / 002 / 003 / 004 (4 条 LOOP 系列)

  第三手段 — 关键词全文搜 "死循环":
    RULES-TREE.md: 11 处提及

  判定: 主题重叠 ≥ 1 → 建议复用 / 引用,不写新 RULE
  下一步: /mr-show RULE-LOOP-001 读全文
```

## Tags(共享字典)

- `pattern:` 检索同类 — **Replacement**:`mr-write`(确认无重复才写)
- `find:` 找 — **Replacement**:`mr-show`(找到了就读)
- `dup?:` 防止重复发明 — **Replacement**:`mr-write`(确认无重复才写)

## 永不精简的边界

1. **写新 RULE 前必 pattern**(不是"写完发现重复再删")
2. **找到同主题必先读全文**(`mr-show`)(不是"看摘要就够")
3. **pattern 失败 0 命中才允许写**(不是"找不到就算了,凭印象写")
4. **图谱为空时的兜底**:用 `grep` 第二/第三手段(本项目向量图谱为空常见,见 RULES-TREE § 5.2)

## Boundaries

- ✅ 管:`grep` + 向量图谱 + 关键词提取 + 搜索报告
- ❌ 不管:写新 RULE(那是 `method-tree-write`)
- ❌ 不管:复用决策(用户决定,是引用还是新写)

## 必背三句话

1. **"写前必 pattern"** — 不是"写完发现重复再删"
2. **"找到同主题必 mr-show 读全文"** — 不是"看摘要就够"
3. **"0 命中才允许 write"** — 不是"找不到凭印象写"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 写新 RULE:[method-tree-write/SKILL.md](../method-tree-write/SKILL.md)
- 看 RULE 全文:[method-tree-show/SKILL.md](../method-tree-show/SKILL.md)
- 沉淀池:[RULES-TREE.md](../../RULES-TREE.md)
