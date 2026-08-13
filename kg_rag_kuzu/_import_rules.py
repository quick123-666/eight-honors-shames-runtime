#!/usr/bin/env python3
"""将 RULES-TREE.md ## 6 的 RULE-XXX-001 沉淀导入 kg_rag_kuzu 向量图谱.

子任务 1+2:解析 RULES-TREE → 入 type=rule 节点到 graph_data.pkl
(子任务 3 = 重跑 backfill_vectors.py,本批不执行)
"""
import pickle
import re
from pathlib import Path

GRAPH_PATH = Path(__file__).resolve().parent / "graph_data.pkl"
RULES_TREE = Path("C:/Users/Administrator/Desktop/kimi_code_test/RULES-TREE.md")

# 提取 ## 6 起至下一个 ## 之前的全部内容
text = RULES_TREE.read_text(encoding="utf-8")
m = re.search(r"## 6\. 元信息(.*?)(?=\n## 7\. |\Z)", text, re.DOTALL)
assert m, "未找到 ## 6 段"
section6 = m.group(1)

# 提取每个 ### RULE-XXX-001 段(到下一个 ### 或 ## 为止)
pat = re.compile(
    r"^### (RULE-[A-Z0-9\-]+)\(([^)]*)\)\s*\n(.*?)(?=^### |^## |\Z)",
    re.MULTILINE | re.DOTALL,
)
matches = pat.findall(section6)
print(f"## 6 解析到 {len(matches)} 条 RULE-XXX-001")

# 加载现有图
with open(GRAPH_PATH, "rb") as f:
    g = pickle.load(f)

# 已存在的 RULE 节点(避免重复)
existing = {n for n, d in g.nodes(data=True) if d.get("type") == "rule"}
print(f"已有 rule 节点: {len(existing)}")

added = 0
skipped = 0
for rule_id, subtitle, body in matches:
    if rule_id in existing:
        skipped += 1
        continue
    # 取首段(## 前内容)作为 description
    first_para = re.split(r"\n## ", body, maxsplit=1)[0].strip()
    # 截断到 300 字
    desc = first_para[:300].replace("\n", " ")
    full_text = body.strip()
    g.add_node(
        rule_id,
        type="rule",
        name=f"{rule_id} ({subtitle.strip()})",
        description=desc,
        full_text=full_text,
        source_doc="rules_tree_md_section_6",
        section="6",
    )
    added += 1

# 保存
with open(GRAPH_PATH, "wb") as f:
    pickle.dump(g, f)

print(f"新增: {added} 条")
print(f"跳过(已存在): {skipped} 条")
print(f"图谱总节点: {g.number_of_nodes()}")
print(f"备份在: {GRAPH_PATH}.bak-20260812-2130")