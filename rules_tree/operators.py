"""八荣八耻 5 + 1 复合算子

来源:
    RULES-TREE.md:320 RULE-RUN-THROUGH-001 (一次跑完)
    RULES-TREE.md:388 RULE-DEBUG-001       (调试)
    RULES-TREE.md:450 RULE-EXPLAIN-001     (解释)
    RULES-TREE.md:512 RULE-LEARN-001       (学习)
    RULES-TREE.md:574 RULE-REVIEW-001      (审查)
    RULES-TREE.md RULE-COVER-001 (本文件新增,2026-08-12) — 兜底覆盖

算子定义:
    每个算子是 RULES.md 准则编号集合(R1..R26 → 27 条 v3.2.2)
    P := Pre ∧ Run — 复合算子 = 触发条件集合 ∧ 执行姿态集合
    数学:算子间只有 ∩ ∪ − 三种集合运算,不存在集合论矛盾(无 ⊕)

设计:
    5 算子原始覆盖 19/27 = 70.4%(v3.2.1 时是 19/26 = 73.1%,加 v3.2.2 新增 R27 后 70.4%)
    8 条闲置准则:R2/R3/R9/R10/R15/R16/R21/R27
    RULE-COVER-001 兜底覆盖全部 8 条 → 全集覆盖 100%
"""
from __future__ import annotations

from typing import Iterable

# ──────────────── 准则全集(v3.2.2 = 27 条)────────────
# RULES.md 准则编号 1-27 (v3.2.2 加 R27)
RULES_ALL: frozenset[str] = frozenset(f"R{i}" for i in range(1, 28))


# ──────────────── 5 原始算子(RULES-TREE.md §6) ─────────────
OPERATORS: dict[str, frozenset[str]] = {
    # 来源:RULES-TREE.md:320
    "RUN-THROUGH": frozenset({"R5", "R14", "R19", "R20", "R11", "R22", "R23", "R25"}),
    # 来源:RULES-TREE.md:388
    "DEBUG":       frozenset({"R7", "R8", "R12", "R24", "R11", "R22"}),
    # 来源:RULES-TREE.md:450
    "EXPLAIN":     frozenset({"R7", "R24", "R17", "R18"}),
    # 来源:RULES-TREE.md:512
    "LEARN":       frozenset({"R1", "R4", "R6", "R18", "R22"}),
    # 来源:RULES-TREE.md:574
    "REVIEW":      frozenset({"R7", "R13", "R14", "R22", "R26"}),
    # 来源:RULES-TREE.md:891 RULE-COVER-001 — 兑底算子,覆盖 5 算子遗漏的 8 条准则
    # Pre: 其他算子未覆盖 → Run: 兑底补齐(运行时检查 coverage_report() 中 unused_rules)
    # 注:本算子与 5 算子 交集为空(Pre 互斥),全集 ∪ = RULES_ALL = 100%
    "COVER-ALL":   frozenset({"R2", "R3", "R9", "R10", "R15", "R16", "R21", "R27"}),
}


class OperatorEval:
    """算子评估结果 — 覆盖 + 子集一致性"""
    __slots__ = ("name", "rules")

    def __init__(self, name: str, rules: frozenset):
        self.name = name
        self.rules = rules

    @property
    def coverage(self) -> float:
        """|rules| / 27"""
        return len(self.rules) / len(RULES_ALL)

    @property
    def is_subset_of_all(self) -> bool:
        return self.rules.issubset(RULES_ALL)

    @property
    def missing(self) -> frozenset[str]:
        return self.rules - RULES_ALL

    def __repr__(self):
        return f"OperatorEval(name={self.name!r}, |rules|={len(self.rules)})"

    def __eq__(self, other):
        if not isinstance(other, OperatorEval):
            return NotImplemented
        return self.name == other.name and self.rules == other.rules


def evaluate_operators() -> list[OperatorEval]:
    """评估所有算子的覆盖率与全集一致性"""
    return [
        OperatorEval(name=name, rules=s)
        for name, s in OPERATORS.items()
    ]


# ──────────────── 算子组合运算 ─────────────
def union(*names: str) -> frozenset[str]:
    """算子 ∧ 组合(并集)"""
    if not names:
        return frozenset()
    out: set[str] = set()
    for n in names:
        if n not in OPERATORS:
            raise KeyError(f"unknown operator: {n}")
        out |= OPERATORS[n]
    return frozenset(out)


def intersection(*names: str) -> frozenset[str]:
    """算子共享部分(交集)"""
    if not names:
        return frozenset()
    sets = [OPERATORS[n] for n in names]
    return frozenset.intersection(*sets) if len(sets) > 1 else sets[0]


def family_union() -> frozenset[str]:
    """5 算子家族并集"""
    return union(*OPERATORS.keys())


# ──────────────── 覆盖率诊断 ─────────────
def coverage_report() -> dict:
    """家族覆盖率 + 闲置准则清单

    Returns:
        {
          "total_rules": 27,
          "covered_rules": 19,
          "coverage_pct": 70.4,
          "unused_rules": ["R10", "R15", ...],
          "operator_sizes": {"RUN-THROUGH": 8, ...},
        }
    """
    fam = family_union()
    unused = RULES_ALL - fam
    return {
        "total_rules": len(RULES_ALL),
        "covered_rules": len(fam),
        "coverage_pct": round(len(fam) / len(RULES_ALL) * 100, 1),
        "unused_rules": sorted(unused, key=lambda x: int(x[1:])),
        "operator_sizes": {n: len(s) for n, s in OPERATORS.items()},
    }


# ──────────────── 准则 → 算子 反向索引 ─────────────
def rules_to_operators() -> dict[str, list[str]]:
    """每条准则被哪些算子使用"""
    out: dict[str, list[str]] = {r: [] for r in RULES_ALL}
    for name, s in OPERATORS.items():
        for r in s:
            out[r].append(name)
    return out