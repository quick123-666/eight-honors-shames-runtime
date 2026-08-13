#!/usr/bin/env python3
"""审计最近 pi session 是否触发了 RULES-TREE 里的 RULE-XXX-001.

子任务:自动回归 - 跑 grep 看规则文本是否在行为里出现.
用法: PYTHONUTF8=1 python _audit_rules.py [--top N]
"""
import json
import re
import sys
from pathlib import Path

PI_DIR = Path.home() / ".pi" / "agent" / "sessions"
RULES_TREE = Path("C:/Users/Administrator/Desktop/kimi_code_test/RULES-TREE.md")

# 1. 提取 RULES-TREE ## 6 + ## 7 的 RULE-XXX-001 列表 + 关键词
text = RULES_TREE.read_text(encoding="utf-8")
pat = re.compile(r"^### (RULE-[A-Z0-9\-]+)\(([^)]*)\)\s*\n(.*?)(?=^### |^## |\Z)",
                 re.MULTILINE | re.DOTALL)
matches = pat.findall(text)
in_scope_ids = set()
for sec_marker in (r"## 6\. 元信息(.*?)(?=\n## 7\. |\Z)", r"## 7\. 元工作流沉淀(.*?)(?=\n## |\Z)"):
    m = re.search(sec_marker, text, re.DOTALL)
    if m:
        body = m.group(0)
        for rid, _, _ in matches:
            if rid in body:
                in_scope_ids.add(rid)
rules = [(rid, sub, body) for rid, sub, body in matches if rid in in_scope_ids]

# 2. 找最近的 pi session
session_files = sorted(PI_DIR.glob("*--C--Users-Administrator-Desktop-kimi_code_test--/*.jsonl"),
                        key=lambda p: p.stat().st_mtime, reverse=True)
if not session_files:
    print("❌ 未找到 kimi_code_test 的 pi session")
    sys.exit(1)

latest_session = session_files[0]
print(f"扫描: {latest_session}")
print(f"## 6 RULE 数: {len(rules)}")
print()

# 3. 抽取本 session 所有 assistant 文本
ass_text = ""
try:
    with open(latest_session, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                if rec.get("type") == "message":
                    msg = rec.get("message", {})
                    if msg.get("role") != "assistant":
                        continue
                    content = msg.get("content", "")
                    if isinstance(content, list):
                        for c in content:
                            if isinstance(c, dict) and c.get("type") == "text":
                                ass_text += c.get("text", "") + "\n"
                            elif isinstance(c, dict) and c.get("type") == "thinking":
                                ass_text += c.get("thinking", "") + "\n"
                    elif isinstance(content, str):
                        ass_text += content + "\n"
            except json.JSONDecodeError:
                continue
except FileNotFoundError as e:
    print(f"读 session 失败: {e}")
    sys.exit(1)

ass_text_lower = ass_text.lower()
print(f"assistant 文本总长: {len(ass_text)} 字符")
print()

# 4. 每条 RULE 在文本里找命中
hits = []
for rid, subtitle, body in rules:
    # 取 trigger 关键词
    trig_m = re.search(r"\*\*(?:触发|适用|场景)\*\*:?\s*([^\n]+)", body)
    trigger = trig_m.group(1).strip() if trig_m else subtitle.strip()
    # 在文本里查 trigger 中前 2 个中文/英文实词
    keywords = re.findall(r"[A-Z][A-Z\-]+|[\u4e00-\u9fff]{2,}", trigger)
    keywords = [k for k in keywords if len(k) >= 2][:3]
    if not keywords:
        continue
    n_hit = sum(1 for k in keywords if k.lower() in ass_text_lower)
    if n_hit > 0:
        hits.append((rid, trigger[:40], n_hit, len(keywords)))

hits.sort(key=lambda x: (-x[2], x[0]))
top = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == "--top" else 10
print(f"--- 触发的 RULE (Top {top}) ---")
for rid, trig, hit, total in hits[:top]:
    mark = "✅" if hit >= total else "⚠️"
    print(f"  {mark} {rid}: {trig} ({hit}/{total} 关键词命中)")
print()
untriggered = len(rules) - len(hits)
print(f"未触发 / 未检测: {untriggered}/{len(rules)}")
print(f"触发率(粗估): {len(hits)/max(len(rules),1)*100:.0f}%")