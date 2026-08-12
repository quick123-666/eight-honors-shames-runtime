"""八荣八耻 5 + 1 复合算子

来源:
    RULES-TREE.md:320 RULE-RUN-THROUGH-001 (一次跑完)
    RULES-TREE.md:388 RULE-DEBUG-001       (调试)
    RULES-TREE.md:450 RULE-EXPLAIN-001     (解释)
    RULES-TREE.md:512 RULE-LEARN-001       (学习)
    RULES-TREE.md:574 RULE-REVIEW-001      (审查)
    RULES-TREE.md RULE-COVER-001 (本文件新增,2026-08-12) — 兜底覆盖

算子定义:
    每个算子是 RULES.md 准则编号集合(R1..R28 → 28 条 v3.4.0)
    P := Pre ∧ Run — 复合算子 = 触发条件集合 ∧ 执行姿态集合
    数学:算子间只有 ∩ ∪ − 三种集合运算,不存在集合论矛盾(无 ⊕)

设计:
    5 算子原始覆盖 19/28 = 67.9%(v3.4.0 加 R28 后;v3.2.2 加 R27 时是 19/27=70.4%;v3.2.1 时是 19/26=73.1%)
    8 条闲置准则:R2/R3/R9/R10/R15/R16/R21/R27
    RULE-COVER-001 兜底覆盖全部 8 条 → 全集覆盖 100%
"""
from __future__ import annotations



# ──────────────── 准则全集(v3.4.0 = 28 条)────────────
# RULES.md 准则编号 1-28 (v3.4.0 加 R28)
RULES_ALL: frozenset[str] = frozenset(f"R{i}" for i in range(1, 29))


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
        """|rules| / 28"""
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


# ──────────────── COVER-ALL 兑底算子: 8 项会话结尾自检 (2026-08-12 v3.2.3 实装) ─────────────
COVER_ALL_RULES: list[tuple[str, str]] = [
    ("R2",  "对齐"),
    ("R3",  "业务"),
    ("R9",  "不搞破坏"),
    ("R10", "不重复犯错"),
    ("R15", "完整版"),
    ("R16", "超越平凡"),
    ("R21", "回收站"),
    ("R27", "稳扎稳打分"),
]


class CoverAllItem:
    """单条 COVER-ALL 判定结果"""

    def __init__(self, rule: str, name: str, status: str, reason: str = ""):
        self.rule = rule
        self.name = name
        self.status = status
        self.reason = reason

    def __repr__(self):
        suffix = f" — {self.reason}" if self.reason else ""
        return f"{self.status} {self.rule}·{self.name}{suffix}"

    def __eq__(self, other):
        return (
            isinstance(other, CoverAllItem)
            and self.rule == other.rule
            and self.name == other.name
            and self.status == other.status
            and self.reason == other.reason
        )


class CoverAllContext:
    """会话自检输入: 8 项 boolean 状态, 由 AI/CLI 调用方提供"""

    __slots__ = (
        "R2_alignment",
        "R3_business",
        "R9_no_destroy",
        "R10_no_repeat",
        "R15_complete",
        "R16_extraordinary",
        "R21_recycle",
        "R27_score3d",
    )

    def __init__(
        self,
        R2_alignment: str = "y",
        R3_business: str = "y",
        R9_no_destroy: str = "n/a",
        R10_no_repeat: str = "y",
        R15_complete: str = "y",
        R16_extraordinary: str = "y",
        R21_recycle: str = "n/a",
        R27_score3d: str = "y",
    ):
        self.R2_alignment = R2_alignment
        self.R3_business = R3_business
        self.R9_no_destroy = R9_no_destroy
        self.R10_no_repeat = R10_no_repeat
        self.R15_complete = R15_complete
        self.R16_extraordinary = R16_extraordinary
        self.R21_recycle = R21_recycle
        self.R27_score3d = R27_score3d

    def as_dict(self) -> dict[str, str]:
        return {
            "R2":  self.R2_alignment,
            "R3":  self.R3_business,
            "R9":  self.R9_no_destroy,
            "R10": self.R10_no_repeat,
            "R15": self.R15_complete,
            "R16": self.R16_extraordinary,
            "R21": self.R21_recycle,
            "R27": self.R27_score3d,
        }


_PASS_TOKENS = frozenset({"y", "yes", "ok", "true", "1", "✅", "pass"})
_FAIL_TOKENS = frozenset({"n", "no", "fail", "false", "0", "❌"})
_NA_TOKENS = frozenset({"n/a", "na", "-", "—", "skip", "none"})


def parse_cover_token(tok: str) -> str:
    """解析 y / n / n/a token 为 emoji 状态"""
    t = tok.strip().lower()
    if t in _PASS_TOKENS:
        return "✅"
    if t in _FAIL_TOKENS:
        return "❌"
    if t in _NA_TOKENS:
        return "➖"
    raise ValueError(
        f"unknown cover-all token: {tok!r} (合法: y / n / n/a)"
    )


def check_cover_all(ctx: CoverAllContext) -> list[CoverAllItem]:
    """跑 8 项自检, 返回 CoverAllItem 列表"""
    ctx_map = ctx.as_dict()
    items: list[CoverAllItem] = []
    for rid, name in COVER_ALL_RULES:
        items.append(
            CoverAllItem(
                rule=rid,
                name=name,
                status=parse_cover_token(ctx_map[rid]),
            )
        )
    return items


def render_cover_all(items: list[CoverAllItem]) -> str:
    """渲染为会话结尾格式: [COVER-ALL] + 8 行"""
    lines = ["[COVER-ALL]"]
    for it in items:
        lines.append(repr(it))
    return "\n".join(lines)


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
          "total_rules": 28,
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