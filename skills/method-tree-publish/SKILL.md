---
name: method-tree-publish
description: >
  Publish a newly written RULE: stage RULES-TREE.md, run 5-file version
  symmetry check, then commit. Implements the spirit of RULE-PUSH-V323-001
  specialized for RULE-only changes. One-shot. Trigger: "/mr-publish" /
  "/mr publish" / "method tree publish" / "发布 RULE" / "commit RULE" /
  "沉淀发布" / "RULES-TREE commit"。对标 eight-rules-acceptance 8 项验收 +
  RULE-PUSH-V323-001 推送 SOP 的轻量版(只 RULE 改动,不全量推送)。
homepage: file:///C:/Users/Administrator/Desktop/kimi_code_test/RULES-TREE.md
license: MIT
---

# Method Tree Publish — Commit RULE to Git

把新写的 RULE 落盘:staging → 5 文件版本号对称检查 → commit。
**专用于 RULE 改动**(非全量推送, 复用 RULE-PUSH-V323-001 的纪律但简化为 4 阶)。
**One-shot**。

> **为何独立 publish skill?(不直接 git commit)**
> - 5 文件版本号对称是 RULE-LOOP-002 的**强制 Pre 阶**
> - 缺这一步 = 漂移到 main = 下次会话踩同坑
> - 自动化 = 不靠人记

## Process(4 阶)

### 1. Staging
- `git add RULES-TREE.md`
- 不加其他文件(除非本次会话也改了)

### 2. 5 文件版本号对称检查(RULE-LOOP-002 强制)
```bash
# 5 文件(主项目 5 + 1 运行时副本,共 6)
for f in RULES.md RULES-VERSION.md RULES-TREE.md AGENTS.md README.md tuomin/eight-honors-shames-runtime/RULES.md; do
  echo "=== $f ==="
  grep -nE '当前(版本)?.{0,3}\*\*v3\.[0-9]+\.[0-9]+\*\*' $f 2>/dev/null
done
```
- 全 v3.4.X 一致 → 通过
- 任一不一致 → **立即补齐再 commit**(不 commit 不一致的版本)

### 3. Smoke 3 套(从 RULE-PUSH-V323-001 借鉴)
- `node --test hooks/eight-rules-hint.test.js` → 7/7 必须
- `python tests/run_rules_tree_tests.py` → 38/38 必须(若有 Python 规则树测试)
- `grep -cE '^### RULE-[A-Z]+-[0-9]+\(' RULES-TREE.md` → ≥ 58(沉淀数不减少)

### 4. Commit + 推送(可选)
- `git commit -m "v3.4.X 沉淀: RULE-XXX-NNN — <一句话标题>"`
- 推送 = `git push origin main`(本地仓库可推;否则只 commit)

## 标准输出格式

```
mr publish  ─────────────────────

  1) Staging: git add RULES-TREE.md ✓
  2) 6 文件版本号对称: v3.4.5 一致 ✓
  3) Smoke 3 套:
     - hooks/eight-rules-hint.test.js: 7/7 PASS ✓
     - run_rules_tree_tests.py: 38/38 PASS ✓
     - RULES-TREE RULE 总数: 59 (≥ 58) ✓
  4) Commit: abc1234 "v3.4.5 沉淀: RULE-LOOP-005 — ..."

  下一步:
    - git push origin main(可选)
    - /mr-feedback RULE-LOOP-005(跟踪引用)
```

## Tags(共享字典)

- `publish:` 5 文件同步 — **Replacement**:`mr-write`(无 commit 的写入)
- `5-file:` 6 文件版本号对称(RULE-LOOP-002) — **Replacement**:`mr-write`(无检查的写)
- `smoke:` 3 套测试 — **Replacement**:`/rules-accept`(八荣八耻验收)

## 永不精简的边界

1. **commit 前必 6 文件版本号对账**(RULE-LOOP-002 强制)
2. **smoke 3 套必跑**(任一 fail = 不 commit)
3. **staging 必只加 RULE 相关文件**(不 `git add .`)
4. **commit message 必含 RULE-id + 一句话标题**(便于历史检索)

## Boundaries

- ✅ 管:staging + 5 文件对账 + smoke 3 套 + commit
- ❌ 不管:写新 RULE(那是 `method-tree-write`)
- ❌ 不管:push 到远程(用户决定;本地 commit 即可)

## 必背三句话

1. **"commit 前必 6 文件版本号对账"** — 不是"改完 git add 就完事"
2. **"smoke 3 套必过"** — 不是"测试太慢,跳一下"
3. **"commit message 含 RULE-id"** — 不是"fix: 改了点东西"

## More

- 主档:[method-tree/SKILL.md](../method-tree/SKILL.md)
- 速查:[method-tree-help/SKILL.md](../method-tree-help/SKILL.md)
- 写新 RULE:[method-tree-write/SKILL.md](../method-tree-write/SKILL.md)
- 沉淀池:[RULES-TREE.md](../../RULES-TREE.md)
- 全量推送 SOP:`RULE-PUSH-V323-001`(RULES-TREE.md:1040)
- 5 文件对账:`RULE-LOOP-002`(RULES-TREE.md:1204)
