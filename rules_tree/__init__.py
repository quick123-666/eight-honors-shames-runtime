"""rules_tree — 八荣八耻算子运行时

把 RULES-TREE.md 中的算子定义从 markdown 伪代码变成可调用 Python 代码。

子模块(直接 `from rules_tree.lln import ...` 或 `from rules_tree.operators import ...`):
    lln        — LNN D 方案 (重复检测算法)
    operators  — 5 复合算子 + 1 兜底算子 (RULE-COVER-001)

CLI:
    python -m rules_tree <sub>   (走 __main__.py)

设计原则:
    - 数学正确性:每个算子都跑 pytest 验证
    - 文档一致:RULES-TREE.md 描述的数学结构必须与代码一致
    - 不重复:LNN 算法 = RULES-TREE.md:174 D 方案,完全等价
    - 跨项目:本包可被任何项目 `pip install -e` 使用
"""
__version__ = "0.1.0"

# 注: __init__.py 故意不导出任何符号,以避开 Python 3.12+ 在
# `from .submodule import X` 时的部分初始化竞态(dataclass 模块半
# 加载时, ns = sys.modules.get(cls.__module__).__dict__ 取 None).
# 调用方请用:
#   from rules_tree.lln import lln_p, decide, evaluate, LNN_THRESHOLDS
#   from rules_tree.operators import OPERATORS, coverage_report, ...
# 或:
#   import rules_tree.lln as lln
#   import rules_tree.operators as op
#   lln.lln_p(...)
#   op.OPERATORS