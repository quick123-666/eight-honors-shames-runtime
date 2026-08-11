"""LNN 重复检测算法 — D 方案 (v3.2.1 反哺)

来源: RULES-TREE.md:174 RULE-10-ALGORITHM-001
设计:
    z = activation + (1 - rt_cov) + (1 - prior_success) - 2 - 0.3
    P = sigmoid(z)
    P > 0.55 → STOP     (v3.2.0 阈值)
    P > 0.35 → WARN
    else       → OK

数学不变量 (供 test 验证):
    INV-1: 单调性   rt_cov↓ → P↑  (覆盖少更危险)
    INV-2: 边界     activation=base + rt_cov=1 + prior=1 → P 最低(无危险)
    INV-3: 边界     activation=1 + rt_cov=0 + prior=0 → P 最高(强制 STOP)
    INV-4: 公式等价 z = a + (1-r) + (1-p) - 2 - 0.3 = a - r - p - 0.3
"""
from __future__ import annotations

import math

# ──────────────── 常量 ────────────────
LNN_THRESHOLDS = {"STOP": 0.55, "WARN": 0.35}
BASE_ACTIVATION = 0.05  # 避免 activation=0 误判
BIAS = 2.3              # -2 - 0.3 的合并


# LNNResult 用 plain class 替代 dataclass (规避 Python 3.14 部分初始化竞态)
class LNNResult:
    """LNN 评估结果 — 含 z, p, decision + 输入快照"""

    __slots__ = ("z", "p", "decision", "activation", "rt_cov", "prior_success")

    def __init__(self, z, p, decision, activation, rt_cov, prior_success):
        self.z = z
        self.p = p
        self.decision = decision
        self.activation = activation
        self.rt_cov = rt_cov
        self.prior_success = prior_success

    def __repr__(self):
        return (f"LNNResult(P={self.p:.3f}, decision={self.decision!r}, "
                f"activation={self.activation:.2f}, rt_cov={self.rt_cov:.2f}, "
                f"prior_success={self.prior_success:.2f})")

    def __eq__(self, other):
        if not isinstance(other, LNNResult):
            return NotImplemented
        return (self.z == other.z and self.p == other.p
                and self.decision == other.decision
                and self.activation == other.activation
                and self.rt_cov == other.rt_cov
                and self.prior_success == other.prior_success)


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def lnn_p(activation: float, rt_cov: float, prior_success: float,
          *, base_activation: float = BASE_ACTIVATION) -> float:
    """D 方案 — 重复检测概率 P

    Args:
        activation:  当次激活强度 (0~1)
        rt_cov:      RULES-TREE 覆盖率 (0~1, 越高越安全)
        prior_success: 历史成功率 (0~1, 越高越安全)

    Returns:
        P ∈ (0, 1),越高越像重复 bug
    """
    a = max(activation, base_activation)
    z = a + (1 - rt_cov) + (1 - prior_success) - BIAS
    return _sigmoid(z)


def decide(p: float) -> str:
    """根据 P 返回 STOP / WARN / OK"""
    if p > LNN_THRESHOLDS["STOP"]:
        return "STOP"
    if p > LNN_THRESHOLDS["WARN"]:
        return "WARN"
    return "OK"


def evaluate(activation: float, rt_cov: float, prior_success: float) -> LNNResult:
    """完整评估 — 返回 z, p, decision + 输入快照"""
    a = max(activation, BASE_ACTIVATION)
    z = a + (1 - rt_cov) + (1 - prior_success) - BIAS
    p = _sigmoid(z)
    return LNNResult(z=z, p=p, decision=decide(p),
                     activation=a, rt_cov=rt_cov, prior_success=prior_success)