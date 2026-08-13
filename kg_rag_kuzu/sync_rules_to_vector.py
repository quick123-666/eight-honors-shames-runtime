#!/usr/bin/env python3
"""一命令同步 RULES-TREE.md 沉淀 → kg_rag_kuzu 向量图谱.

SOP:
  1. 备份 graph_data.pkl
  2. 解析 RULES-TREE.md ## 6 的 RULE-XXX-001 → type=rule 节点(graph 已有则跳)
  3. 重建 vector_index.faiss + vector_idmap.pkl
  4. 显示前后 ntotal 变化

回滚:
  cp graph_data.pkl.bak-{ts} graph_data.pkl
  cp vector_index.faiss.bak-{ts} vector_index.faiss
  cp vector_idmap.pkl.bak-{ts} vector_idmap.pkl
  然后跑 backfill_vectors.py

用法: PYTHONUTF8=1 python sync_rules_to_vector.py
"""
import pickle
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

GRAPH = Path(__file__).resolve().parent / "graph_data.pkl"
FAISS = Path(__file__).resolve().parent / "vector_index.faiss"
IDMAP = Path(__file__).resolve().parent / "vector_idmap.pkl"
RULES_TREE = Path("C:/Users/Administrator/Desktop/kimi_code_test/RULES-TREE.md")

TS = datetime.now().strftime("%Y%m%d-%H%M%S")


def backup(p: Path):
    if not p.exists():
        return None
    dest = p.with_suffix(p.suffix + f".bak-{TS}")
    shutil.copy2(p, dest)
    return dest


def parse_rules():
    """扫描 RULES-TREE.md ## 6 和 ## 7 所有 RULE-XXX-001 标题."""
    text = RULES_TREE.read_text(encoding="utf-8")
    pat = re.compile(r"^### (RULE-[A-Z0-9\-]+)\(([^)]*)\)\s*\n(.*?)(?=^### |^## |\Z)",
                     re.MULTILINE | re.DOTALL)
    matches = pat.findall(text)
    # 仅保留 ## 6 / ## 7 区段内的(过滤任何外源提及)
    section6 = re.search(r"## 6\. 元信息(.*?)(?=\n## 7\. |\Z)", text, re.DOTALL)
    section7 = re.search(r"## 7\. 元工作流沉淀(.*?)(?=\n## |\Z)", text, re.DOTALL)
    in_scope = set()
    for sec in (section6, section7):
        if sec:
            for rid, _, _ in matches:
                if rid in sec.group(0):
                    in_scope.add(rid)
    return [(rid, sub, body) for rid, sub, body in matches if rid in in_scope]


def import_rules():
    rules = parse_rules()
    with open(GRAPH, "rb") as f:
        g = pickle.load(f)
    existing = {n for n, d in g.nodes(data=True) if d.get("type") == "rule"}
    added = 0
    skipped = 0
    for rid, subtitle, body in rules:
        if rid in existing:
            skipped += 1
            continue
        first_para = re.split(r"\n## ", body, maxsplit=1)[0].strip()
        desc = first_para[:300].replace("\n", " ")
        g.add_node(rid, type="rule", name=f"{rid} ({subtitle.strip()})",
                   description=desc, full_text=body.strip(),
                   source_doc="rules_tree_md_section_6", section="6")
        added += 1
    with open(GRAPH, "wb") as f:
        pickle.dump(g, f)
    return added, skipped, len(rules), g.number_of_nodes()


def verify_semantic_search():
    """[4/4] 自动验证:跑几个代表性查询,检查 RULE 节点能命中."""
    sys.path.insert(0, str(GRAPH.parent))
    from knowledge_graph_rag import KnowledgeGraphManager
    rag = KnowledgeGraphManager()
    queries = [
        "怎么调试 bug",
        "RULE 沉淀规范",
        "重复犯错的避免",
        "如何同步规则到向量图谱",
    ]
    hits = 0
    print(f"  跑 {len(queries)} 个代表性查询:")
    for q in queries:
        results = rag.semantic_search(q)
        if not results:
            print(f"    ❌ \"{q}\" → 无结果")
            continue
        top = results[0]
        top_type = top.get("type", "?")
        top_id = top.get("id", top.get("name", "?"))
        top_score = top.get("score", 0)
        ok = "rule" in str(top_type).lower()
        mark = "✅" if ok else "⚠️"
        if ok:
            hits += 1
        print(f"    {mark} \"{q}\" → {top_id} (score={top_score:.4f})")
    pct = hits / max(len(queries), 1) * 100
    print(f"  验证: {hits}/{len(queries)} 个 Top-1 命中 rule 节点 ({pct:.0f}%)")
    return pct >= 75  # 至少 75% 命中算通过


def rebuild_vectors():
    for p in (FAISS, IDMAP):
        if p.exists():
            p.unlink()
    r = subprocess.run([sys.executable, "backfill_vectors.py"],
                       cwd=GRAPH.parent, capture_output=True, text=True,
                       encoding="utf-8")
    return r


def main():
    print("=" * 60)
    print(f"sync_rules_to_vector.py @ {TS}")
    print("=" * 60)

    # Step 1: 备份
    print("\n[1/3] 备份 graph_data.pkl + vectors...")
    g_bak = backup(GRAPH)
    f_bak = backup(FAISS)
    i_bak = backup(IDMAP)
    print(f"  graph  : {g_bak}")
    print(f"  faiss  : {f_bak}")
    print(f"  idmap  : {i_bak}")

    # Step 2: 解析 + 入库
    print("\n[2/3] 解析 RULES-TREE.md ## 6 → graph_data.pkl...")
    t0 = time.time()
    added, skipped, total_rules, new_nodes = import_rules()
    t1 = time.time()
    print(f"  解析: {total_rules} 条 RULE")
    print(f"  新增: {added} 条")
    print(f"  跳过(已存在): {skipped} 条")
    print(f"  图谱总节点: {new_nodes}")
    print(f"  耗时: {t1-t0:.1f}s")

    # Step 3: 重建向量
    print("\n[3/3] 重建向量索引...")
    t2 = time.time()
    r = rebuild_vectors()
    t3 = time.time()
    print(f"  耗时: {t3-t2:.1f}s")
    if r.returncode == 0:
        m = re.search(r"Saved:\s*(\d+)\s*vectors", r.stdout)
        if m:
            print(f"  索引大小: {m.group(1)} vectors")
    else:
        print(f"  ❌ backfill_vectors.py 失败: {r.stderr[:500]}")

    # Step 4: 验证语义搜索
    print("\n[4/4] 自动验证(语义搜索 RULE 节点)...")
    passed = verify_semantic_search()

    print("\n" + "=" * 60)
    print(f"完成 · 验证 {'✅ 通过' if passed else '⚠️ 未达标'} · 备份在 .{TS}")
    print("=" * 60)
    sys.exit(0 if passed else 1)
    print(f"完成 · 备份在 .{TS}")
    print("=" * 60)


if __name__ == "__main__":
    main()