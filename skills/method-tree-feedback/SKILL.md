---
name: method-tree-feedback
description: >
  Track how often each RULE in RULES-TREE.md is actually referenced
  (cited by other RULEs or skill SKILL.md) — measures whether the
  RULE is "living" or "dead". Read-only grep, no modification.
  One-shot. Trigger: "/mr-feedback" / "/mr feedback" / "method tree feedback" /
  "RULE 引用统计" / "哪条 RULE 死代码" / "scoreboard RULE"。对标
  eight-rules-benchmark scoreboard 风格。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/RULES-TREE.md
license: MIT
---

# Method Tree Feedback — RULE Citation Scoreboard

跟踪 RULES-TREE.md 里每条 RULE 被引用次数(被其他 RULE 引用 + 被 skill 引用)。
**只读 grep**,不写任何文件。
**One-shot**。

> **为何要 scoreboard?**
> - 沉淀的 RULE 越多 → 沉淀池越"胖"→ 但**不等于** RULE 越有效
> - 0 引用 = 死 RULE = 占地方,以后 pattern 检索时被噪声干扰
> - 高引用 = 真正被复用 = 沉淀动作有回报
> - 周期性扫,识别"该删 / 该改写 / 该保留"

## Process

### 1. 单条 RULE 引用统计
```bash
RULE_ID=RULE-LOOP-001
grep -rE "\b$RULE_ID\b" RULES-TREE.md skills/ 2>/dev/null | wc -l
```

### 2. 全量统计(对每条 RULE 跑 1)
```bash
for rule in $(grep -oE 'RULE-[A-Z]+-[0-9]+' RULES-TREE.md | sort -u); do
  count=$(grep -rE "\b$rule\b" RULES-TREE.md skills/ 2>/dev/null | wc -l)
  echo "$count $rule"
done | sort -rn | head -20
```

### 3. 报告三类:
- **🔥 高引用**(≥ 5):真复用,保留并考虑加 5-tag 关联
- **😐 低引用**(1-4):可能正常,也可能沉淀时太具体
- **💀 0 引用**:候选删除/合并/重写(沉淀动作可追溯,先看 7 段是否真的通用)

## 标准输出格式

```
mr feedback  ─────────────────────

  RULE 引用统计(全量, top 20):
    🔥 12 RULE-COVER-001        8 条闲置准则兑底算子
    🔥  9 RULE-LOOP-001        三套终止信号死循环修复
    🔥  8 RULE-LOOP-002        commit 前 5 文件版本号对称检查
    😐  3 RULE-DEBUG-001        调试复合算子
    😐  2 RULE-PUSH-V323-001    版本升级 + 脱敏 + GitHub 推送工作流
    💀  0 RULE-MINICOG-018     (8 棵方法树相关,可能本项目不用了)
    💀  0 RULE-NOPHASE-001     八荣八耻本质平铺

  沉淀池健康:
    总 RULE: 58
    高引用(≥5): 3 (5.2%)
    中引用(1-4): 45 (77.6%)
    0 引用: 10 (17.2%)

  建议:
    - 💀 0 引用 RULE 10 条:review 是否本项目已不需要 → 考虑移到 _recycle_bin/
    - 😐 中引用 45 条:健康(沉淀是经验,不一定每次都引用)
    - 🔥 高引用 3 条:固化到相关 skill 主档(本主档已加 method-tree 引用即一例)
```

## Tags(共享字典)

- `feedback:` 跟踪引用 — **Replacement**:`/mr-show`(看单条 RULE)
- `scoreboard:` 统计 — **Replacement**:`/mr-write`(写新 RULE)
- `cite:` 引用次数 — **Replacement**:`/mr-pattern`(找同主题时)

## 永不精简的边界

1. **周期性跑 scoreboard**(不是"写完 RULE 就不管")
2. **0 引用 RULE 不立即删**(先 review 是真没用还是没引用时机)
3. **高引用 RULE 必固化**(加进相关 skill 主档或 method-tree 套件)
4. **引用统计不靠人肉**(用 `grep -c` + `sort -rn` 自动化)

## Boundaries

- ✅ 管:`grep` 引用统计 + 报告 + 改进建议
- ❌ 不管:写/改/删 RULE(那是 `method-tree-write` / `method-tree-publish`)
- ❌ 不管:看单条 RULE 全文(那是 `method-tree-show`)

## 必背三句话

1. **"周期性跑 scoreboard"** — 不是"写完 RULE 就不管"
2. **"0 引用不立即删"** — 不是"看到没用就清"
3. **"高引用必固化"** — 不是"好用就让它自然增长"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 写新 RULE:[method-tree-write/SKILL.md](../method-tree-write/SKILL.md)
- 看 RULE:[method-tree-show/SKILL.md](../method-tree-show/SKILL.md)
- 沉淀池:[RULES-TREE.md](../../RULES-TREE.md)
