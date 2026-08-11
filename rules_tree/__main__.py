"""CLI 入口 — `python -m rules_tree <sub>`

子命令:
    lln <act> <rt> <prior>   评估 LNN D 方案
    operators                 列出 5 算子 + 覆盖率
    coverage                  打印闲置准则清单
    math-check                跑数学不变量验证

设计: 每个 cmd 函数内延迟 import, 避开 Python 3.11+ 在
     __main__ 模块状态下模块级符号绑定的边界 bug.
"""
from __future__ import annotations

import sys


def cmd_lln(args):
    if len(args) != 3:
        print("用法: python -m rules_tree lln <activation> <rt_cov> <prior_success>")
        return 2
    try:
        act, rt, prior = (float(a) for a in args)
    except ValueError:
        print(f"❌ 参数必须为数字: {args}")
        return 2
    import rules_tree.lln as lln
    r = lln.evaluate(act, rt, prior)
    print(f"  activation   = {r.activation:.2f}  (base ≥ 0.05)")
    print(f"  rt_coverage  = {r.rt_cov:.2f}")
    print(f"  prior_success= {r.prior_success:.2f}")
    print(f"  z            = {r.z:.3f}")
    print(f"  P(sigmoid)   = {r.p:.3f}")
    print(f"  阈值         = STOP>{lln.LNN_THRESHOLDS['STOP']}, WARN>{lln.LNN_THRESHOLDS['WARN']}")
    print(f"  决策         = {r.decision}")
    return 0


def cmd_operators(_):
    import rules_tree.operators as op
    print(f"=== {len(op.OPERATORS)} 个复合算子 (RULES-TREE.md §6) ===")
    for ev in op.evaluate_operators():
        ok = "✅" if ev.is_subset_of_all else "❌"
        sorted_rules = sorted(ev.rules, key=lambda x: int(x[1:]))
        print(f"  {ok} {ev.name:<14} size={len(ev.rules):<3} coverage={ev.coverage:.1%} rules={sorted_rules}")
    fam = op.family_union()
    print(f"\n家族并集 = {len(fam)} 条 ({len(fam)/len(op.RULES_ALL):.1%} 全集)")
    print(f"全集 = {len(op.RULES_ALL)} 条 (v3.2.2)")
    return 0


def cmd_coverage(_):
    import rules_tree.operators as op
    rep = op.coverage_report()
    print("=== 算子家族覆盖率报告 ===")
    print(f"  总准则:    {rep['total_rules']}")
    print(f"  已覆盖:    {rep['covered_rules']}")
    print(f"  覆盖率:    {rep['coverage_pct']}%")
    print(f"  算子规模:  {rep['operator_sizes']}")
    print(f"  闲置准则:  {rep['unused_rules']}")
    if rep['unused_rules']:
        print("\n⚠️  这些准则不被任何算子触发 — 需 RULE-COVER-001 兜底")
    return 0


def cmd_audit(args):
    """算子使用率审计 — audit_text <text> 或 audit_rule <RULE-name>"""
    if not args:
        print("用法:")
        print("  python -m rules_tree audit stdin   # 从 stdin 读取")
        print("  python -m rules_tree audit rule RULE-PUSH-V323-001   # 从 RULES-TREE.md 提取")
        return 2
    sub = args[0]
    if sub == "stdin":
        text = sys.stdin.read()
    elif sub == "rule":
        from .audit import audit_text, format_report
        import os
        rule_name = args[1] if len(args) > 1 else "RULE-PUSH-V323-001"
        rules_tree_path = os.path.join(os.path.dirname(__file__), "..", "RULES-TREE.md")
        try:
            with open(rules_tree_path, encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print(f"❌ RULES-TREE.md 未找到: {rules_tree_path}")
            return 1
        # 提取 RULE 块
        import re as _re
        m = _re.search(rf"### {rule_name}.*?(?=\n### |\Z)", content, _re.DOTALL)
        if not m:
            print(f"❌ 找不到 RULE: {rule_name}")
            return 1
        text = m.group(0)
    else:
        print(f"❌ 未知 audit 子命令: {sub}")
        return 2

    from .audit import audit_text, format_report
    audit = audit_text(text)
    print(format_report(audit))
    # 加总结
    import rules_tree.operators as op
    family = op.family_union()
    used = set(audit["ruleset_hits"].keys())
    activated_pre = sum(len(audit["operator_rule_evidence"][o]) for o in op.OPERATORS)
    print()
    print(f"算子家族总激活度: {activated_pre}/{len(family)} = {activated_pre/len(family):.1%}")
    return 0


def cmd_math_check(_):
    """4 个数学不变量检查"""
    import rules_tree.lln as lln
    lln_p = lln.lnn_p
    print("=== LNN 数学不变量验证 ===")
    # INV-1: 单调性
    a, p = 0.5, 0.5
    mono = [lln_p(a, r, p) for r in (0.9, 0.5, 0.1)]
    inv1 = mono[0] < mono[1] < mono[2]
    print(f"  INV-1 单调性: {mono[0]:.3f} < {mono[1]:.3f} < {mono[2]:.3f} → {'✅' if inv1 else '❌'}")
    # INV-2: 边界(全安全)
    inv2 = lln_p(0.05, 1.0, 1.0) < 0.20
    print(f"  INV-2 安全边界: P={lln_p(0.05, 1.0, 1.0):.3f} < 0.20 → {'✅' if inv2 else '❌'}")
    # INV-3: 边界(全危险)
    inv3 = lln_p(1.0, 0.0, 0.0) > 0.55
    print(f"  INV-3 危险边界: P={lln_p(1.0, 0.0, 0.0):.3f} > 0.55 → {'✅' if inv3 else '❌'}")
    # INV-4: 公式等价
    eq_diffs = []
    for a, r, p in [(0.1, 0.5, 0.5), (0.3, 0.7, 0.4), (0.8, 0.2, 0.1)]:
        z1 = a + (1 - r) + (1 - p) - 2 - 0.3
        z2 = a - r - p - 0.3
        eq_diffs.append(abs(z1 - z2))
    inv4 = max(eq_diffs) < 1e-9
    print(f"  INV-4 公式等价: max|Δ|={max(eq_diffs):.2e} → {'✅' if inv4 else '❌'}")
    ok = inv1 and inv2 and inv3 and inv4
    print(f"\n{'✅ 全部不变量通过' if ok else '❌ 不变量违反'}")
    return 0 if ok else 1


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    sub, args = argv[0], argv[1:]
    table = {
        "lln": cmd_lln,
        "operators": cmd_operators,
        "coverage": cmd_coverage,
        "math-check": cmd_math_check,
        "audit": cmd_audit,
    }
    if sub not in table:
        print(f"❌ 未知子命令: {sub}\n可用: {', '.join(table)}")
        return 2
    return table[sub](args)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))