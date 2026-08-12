"""算子使用率审计 — 算子审计算子

设计: 给一段文本(对话 / commit / 文档), 跑所有 6 个算子的 Pre 集,
      输出每个算子被触发的次数 + 触发的具体准则 + 整体覆盖率.

注意: 这是 LLM 助手可调用的"自我审计工具", 输出会暴露:
      - 真激活的算子 (Pre 集实际触发过)
      - 休眠算子 (Pre 集从未被这段文本激活)

来源: RULES-TREE.md RULE-PUSH-V323-001 的"算子使用率审计"需求
"""
from __future__ import annotations

import re
from collections import Counter


import rules_tree.operators as op


# 每个算子的触发关键词 (中文 / 英文, 映射到该算子典型场景)
# v0.2 扩充: 加更多隐式触发模式 (三栏 / 估算 / 探装 / 沉淀)
TRIGGER_KEYWORDS: dict[str, list[str]] = {
    "RUN-THROUGH": [
        "用户确认", "拍板", "备份先行", "分阶段 commit", "9 阶闭环",
        "立即但完整", "协助到底", "一次跑完", "close", "merged",
        "闭环", "陪伴到", "一天闭环", "陪跑到底",
    ],
    "DEBUG": [
        "bug", "bug fix", "debug", "调试", "排查", "修复",
        "smoke test", "运行", "math-check", "不变量", "math.verify",
        "在动手前", "必跑完", "踩过", "反模式",
    ],
    "EXPLAIN": [
        "解释", "为什么", "how", "what", "explain", "三栏",
        "通俗", "结论", "大白话", "白话",
        "结论与价值", "先讲", "白话解释",
    ],
    "LEARN": [
        "查接口", "先看", "调研", "看现状", "read", "ls", "find",
        "穷尽", "调研", "覆盖", "三 维", "explore",
        "别猜", "不凭", "3 维问询", "估计", "盘点", "扫描",
    ],
    "REVIEW": [
        "审查", "review", "审计", "校验", "验证", "verify",
        "贴规范", "按 RULES", "沉淀", "按 §", "规范", "贴 RULES-TREE",
        "§ 1", "§ 1 沉淀规则", "按 RULES-TREE.md", "贴规范", "按格式", "附明",
    ],
    "COVER-ALL": [
        "兜底", "对齐", "业务", "不搞破坏", "重复犯错", "完整版",
        "超越平凡", "回收站", "稳扎稳打", "fallback", "guard",
        "业务边界", "不装懂", "覆盖", "完整的", "平凡", "重复",
        "打了 * 阶", "不重复", "不试",
    ],
}


def audit_text(text: str, *, window: int = 200) -> dict:
    """对一段文本跑算子激活审计

    Args:
        text: 审计目标文本 (对话 / commit / 文档)
        window: 关键词匹配的窗口字符数 (越大越宽松)

    Returns:
        {
          "operator_hits": { "RUN-THROUGH": 5, "DEBUG": 3, ... },
          "ruleset_hits":  { "R5": 2, "R7": 5, ... },
          "total_rules":   27,  # 全文出现的不同准则数
          "uncovered_rules": ["R2", "R9", ...],  # 完全没出现的准则
          "dormant_operators": ["LEARN", ...],   # 算子 Pre 集 0 命中
        }
    """
    text_lower = text.lower()
    operator_hits: Counter[str] = Counter()
    keyword_hits: dict[str, list[str]] = {op: [] for op in op.OPERATORS}

    for op_name, kws in TRIGGER_KEYWORDS.items():
        for kw in kws:
            if kw.lower() in text_lower:
                operator_hits[op_name] += 1
                keyword_hits[op_name].append(kw)

    # 准则被提及的次数 (从 R1..R27)
    # 注意: 从大到小匹配, 避免 R1 被 R10/R11 误吃
    ruleset_hits: Counter[str] = Counter()
    # 先把文本中所有 R<数字> 提到出来 (负向后行 + 负向前行)
    mentioned = set()
    for m in re.finditer(r"R(\d+)", text):
        mentioned.add(int(m.group(1)))
    # 加 "准则 N" 中文形式
    for m in re.finditer(r"准则\s*(\d+)", text):
        mentioned.add(int(m.group(1)))
    for n in mentioned:
        if 1 <= n <= 27:
            ruleset_hits[f"R{n}"] += 1

    # 算子 Pre 集 (哪些准则被算子定义) vs 实际出现 (哪些准则被文本提到)
    used_rules = set(ruleset_hits.keys())
    all_rules = {f"R{n}" for n in range(1, 28)}
    uncovered = sorted(all_rules - used_rules, key=lambda x: int(x[1:]))

    # 算子 Pre 集 vs 文本中实际出现: 算子的每个 Pre 准则在文本里出现 = 算子"激活"
    operator_rule_evidence: dict[str, list[str]] = {}
    for op_name in op.OPERATORS:
        evidence = sorted(
            [r for r in op.OPERATORS[op_name] if r in used_rules],
            key=lambda x: int(x[1:])
        )
        operator_rule_evidence[op_name] = evidence

    # 休眠算子: Pre 集 0 命中
    dormant = [
        op_name for op_name in op.OPERATORS
        if not operator_rule_evidence[op_name]
    ]

    return {
        "operator_hits": dict(operator_hits),
        "keyword_hits": keyword_hits,
        "ruleset_hits": dict(ruleset_hits),
        "operator_rule_evidence": operator_rule_evidence,
        "total_rules_used": len(used_rules),
        "all_rules_count": len(all_rules),
        "uncovered_rules": uncovered,
        "dormant_operators": dormant,
    }


def format_report(audit: dict) -> str:
    """格式化审计报告"""
    lines = []
    lines.append("=" * 60)
    lines.append("算子使用率审计报告")
    lines.append("=" * 60)
    lines.append("")

    # 算子激活度 (按 Pre 集命中数排序)
    lines.append("【算子 Pre 集激活度】")
    op_ev = audit["operator_rule_evidence"]
    for op_name, evidence in sorted(op_ev.items(), key=lambda x: -len(x[1])):
        pre_size = len(op.OPERATORS[op_name])
        hits = audit["operator_hits"].get(op_name, 0)
        marker = "🟢" if len(evidence) >= pre_size * 0.5 else ("🟡" if len(evidence) > 0 else "⚪")
        lines.append(f"  {marker} {op_name:<14} | Pre集 {pre_size} 条 → 命中 {len(evidence)} 条 | 关键词命中 {hits} 次")
        if evidence:
            lines.append(f"     激活: {evidence}")
    lines.append("")

    # 休眠算子
    lines.append("【休眠算子 (Pre 集 0 命中)】")
    if audit["dormant_operators"]:
        lines.append(f"  ⚠️  {len(audit['dormant_operators'])} 个算子本次未激活:")
        for op_name in audit["dormant_operators"]:
            lines.append(f"     - {op_name} (Pre 集: {sorted(op.OPERATORS[op_name], key=lambda x: int(x[1:]))})")
    else:
        lines.append("  ✅ 所有 6 算子 Pre 集都有命中")
    lines.append("")

    # 准则覆盖率
    lines.append("【准则提及覆盖】")
    lines.append(f"  出现准则: {audit['total_rules_used']}/{audit['all_rules_count']} ({audit['total_rules_used']/audit['all_rules_count']:.1%})")
    if audit["uncovered_rules"]:
        lines.append(f"  未提及: {audit['uncovered_rules']}")
    lines.append("")

    # 准则被算子家族"全部覆盖"验证
    family = op.family_union()
    used_set = set(audit["ruleset_hits"].keys())
    lines.append("【算子家族覆盖 vs 实际提及】")
    lines.append(f"  算子家族 Pre 集: {sorted(family)}")
    lines.append(f"  文本中实际出现: {sorted(used_set)}")
    overused = used_set - family
    if overused:
        lines.append(f"  ⚠️  文本出现但无算子接管 (COVER-ALL 接管中): {sorted(overused)}")
    unused_in_family = family - used_set
    if unused_in_family:
        lines.append(f"  📋  算子覆盖但本次未使用: {sorted(unused_in_family)}")

    return "\n".join(lines)