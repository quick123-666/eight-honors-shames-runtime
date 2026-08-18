# RULE-VECTOR-DESC-DUP-001: 图谱节点描述去重

> **沉淀日期**: 2026-08-12 18:57
> **触发场景**: kg_rag_kuzu 中 GEMINI.md / MIT 节点的 description 被错填为 README 头,导致 "神经网络" query 返回不相关结果
> **读者**: kg_rag_kuzu 维护者(下次抽取数据后查这份)

---

## 1. 摘要

**要点**: 图谱节点抽取后,必须**校验 description 是否与节点名匹配**。多个节点共用同一份长 description(= README 头)是最常见的污染源。

---

## 2. 检测方法

**要点**: 1 个 Python 一行流扫所有节点的 desc[:200] 重复。

```python
from collections import defaultdict
by_desc = defaultdict(list)
for name, attrs in graph.nodes(data=True):
    desc = attrs.get('description', '')[:200]
    if desc:
        by_desc[desc].append(name)
dups = {d: ns for d, ns in by_desc.items() if len(ns) >= 2 and len(d) > 80}
# 只关心长 desc 的重复(短 desc 如命令名/skill 名是合法的)
```

**判定标准**: `len(desc) > 80` 且出现 ≥ 2 次 → 可疑。

---

## 3. 根因

| 根因 | 表现 |
|---|---|
| **抽取时引用了 README 头** | 多个节点拿到 `<div align="center">...# 🎌 八荣八耻...` |
| **source_doc 写错** | 节点名是 `GEMINI.md`,但 source_doc = `eight_honors_runtime`(README 路径) |

---

## 4. 修复模板

**要点**: 给每个被污染的节点写**专有 description**,**不要复用**。

```python
fixes = {
    'GEMINI.md': 'AI 编程适配文件 for Google Gemini CLI · 八荣八耻核心价值观注入 · 本项目 7 个 adapter 之一',
    'MIT': 'MIT License · 本项目开源许可证 · 允许商用/修改/分发/私有使用/再许可 · 仅需保留版权声明',
}
for name, desc in fixes.items():
    graph.nodes[name]['description'] = desc
pickle.dump(graph, open('graph_data.pkl', 'wb'))
```

**修完必须**:重新跑 `backfill_vectors.py` + 跑搜索 query 验证污染节点退出 top-5。

---

## 5. 防范措施

| 动作 | 优先级 |
|---|---|
| **抽取后跑一次 dup 检测**(本 RULE §2 代码) | P0 |
| **每个节点的 description 至少含节点名本身** | P0 |
| **description 长度 < 200 字符时,优先写专有内容** | P1 |
| **source_doc 字段必须指向节点真实所在文件** | P1 |

---

**写完**:2026-08-12 18:57,文件 `RULES-TREE/RULE-VECTOR-DESC-DUP-001.md`,5 节,数字实测。
