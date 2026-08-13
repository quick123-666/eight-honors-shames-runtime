# -*- coding: utf-8 -*-
"""手写测试 runner — 不用 pytest

原因: Python 3.11/3.14 在 __main__ 模式下, 把 `lnn_p` 这个名绑定为 None
     (即使显式赋值后, globals()['lnn_p'] 仍是 None).
     这是 strict module loading 与 __main__ 命名空间的交互 bug.

策略: 测试函数内不用模块级 `lnn_p`, 而是每次从 _SNAP dict 里查.
     把 _LLN_SNAP / _OP_SNAP 当 closure 变量.
"""
from __future__ import annotations
import sys
import traceback

sys.path.insert(0, ".")

# Windows GBK 控制台不能输出 emoji (✅❌➖), 强制重定向到 UTF-8
import io as _io
try:
    sys.stdout = _io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = _io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
except Exception:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import rules_tree.lln as lln_mod
import rules_tree.operators as op_mod

_LLN_SNAP = vars(lln_mod)
_OP_SNAP = vars(op_mod)


TESTS = []


def test(name):
    def deco(fn):
        TESTS.append((name, fn))
        return fn
    return deco


@test("LNN-场景1 全危险 → STOP/0.622")
def t1():
    P = _LLN_SNAP["lnn_p"](1.0, 0.2, 0.0)
    assert abs(P - 0.622) < 0.02, f"P={P:.3f}"
    assert _LLN_SNAP["decide"](P) == "STOP"


@test("LNN-场景2 弱激活 → OK/0.231")
def t2():
    P = _LLN_SNAP["lnn_p"](0.1, 0.5, 0.5)
    assert abs(P - 0.231) < 0.02
    assert _LLN_SNAP["decide"](P) == "OK"


@test("LNN-场景3 高覆盖 → OK/0.182")
def t3():
    P = _LLN_SNAP["lnn_p"](0.1, 0.8, 0.5)
    assert abs(P - 0.182) < 0.02
    assert _LLN_SNAP["decide"](P) == "OK"


@test("LNN-场景4 文档漂移 (声称 WARN/0.39, 实测 OK/0.31)")
def t4():
    P = _LLN_SNAP["lnn_p"](0.3, 0.5, 0.3)
    assert abs(P - 0.310) < 0.02
    assert _LLN_SNAP["decide"](P) == "OK"


@test("LNN-4 场景决策符合阈值")
def t5():
    lnn_p = _LLN_SNAP["lnn_p"]
    decide = _LLN_SNAP["decide"]
    thresholds = _LLN_SNAP["LNN_THRESHOLDS"]
    for act, rt, prior in [(1.0, 0.2, 0.0), (0.1, 0.5, 0.5),
                            (0.1, 0.8, 0.5), (0.3, 0.5, 0.3)]:
        P = lnn_p(act, rt, prior)
        d = decide(P)
        if P > thresholds["STOP"]:
            assert d == "STOP"
        elif P > thresholds["WARN"]:
            assert d == "WARN"
        else:
            assert d == "OK"


@test("INV-1 单调性: rt_cov↓ → P↑")
def t6():
    lnn_p = _LLN_SNAP["lnn_p"]
    mono = [lnn_p(0.5, r, 0.5) for r in (0.9, 0.5, 0.1)]
    assert mono[0] < mono[1] < mono[2]


@test("INV-2 安全边界: P < 0.20")
def t7():
    P = _LLN_SNAP["lnn_p"](0.05, 1.0, 1.0)
    assert P < 0.20


@test("INV-3 危险边界: P > 0.55, 决策 STOP")
def t8():
    P = _LLN_SNAP["lnn_p"](1.0, 0.0, 0.0)
    assert P > 0.55
    assert _LLN_SNAP["decide"](P) == "STOP"


@test("INV-4 公式等价")
def t9():
    for a, r, p in [(0.1, 0.5, 0.5), (0.3, 0.7, 0.4), (0.8, 0.2, 0.1)]:
        z1 = a + (1 - r) + (1 - p) - 2 - 0.3
        z2 = a - r - p - 0.3
        assert abs(z1 - z2) < 1e-9


@test("base_activation 兜底")
def t10():
    lnn_p = _LLN_SNAP["lnn_p"]
    P_zero = lnn_p(0.0, 0.5, 0.5)
    P_base = lnn_p(_LLN_SNAP["BASE_ACTIVATION"], 0.5, 0.5)
    assert abs(P_zero - P_base) < 1e-9


@test("阈值 STOP > WARN, STOP > 0.5")
def t11():
    thresholds = _LLN_SNAP["LNN_THRESHOLDS"]
    assert thresholds["STOP"] > thresholds["WARN"]
    assert thresholds["STOP"] > 0.5


@test("evaluate 返回 LNNResult")
def t12():
    r = _LLN_SNAP["evaluate"](0.5, 0.5, 0.5)
    assert isinstance(r, _LLN_SNAP["LNNResult"])
    assert r.decision in ("STOP", "WARN", "OK")
    assert 0 < r.p < 1


@test("sigmoid 已知值")
def t13():
    sigmoid = _LLN_SNAP["_sigmoid"]
    assert abs(sigmoid(0) - 0.5) < 1e-9
    assert sigmoid(100) > 0.9999
    assert sigmoid(-100) < 0.0001


@test("6 算子全集子集一致性 (含 RULE-COVER-001)")
def t14():
    for ev in _OP_SNAP["evaluate_operators"]():
        assert ev.is_subset_of_all


@test("6 算子规模与文档一致")
def t15():
    sizes = {ev.name: len(ev.rules) for ev in _OP_SNAP["evaluate_operators"]()}
    assert sizes == {
        "RUN-THROUGH": 9,  # v3.4.3: +R28 跨会话沉淀(Sediment 阶准则化)
        "DEBUG": 6,
        "EXPLAIN": 4,
        "LEARN": 5,
        "REVIEW": 5,
        "COVER-ALL": 8,  # RULE-COVER-001
    }


@test("覆盖率报告字段齐全")
def t16():
    rep = _OP_SNAP["coverage_report"]()
    for k in ("total_rules", "covered_rules", "coverage_pct",
              "unused_rules", "operator_sizes"):
        assert k in rep
    assert rep["total_rules"] == 28
    assert rep["covered_rules"] == 28  # COVER-ALL 后 100%
    assert rep["coverage_pct"] == 100.0
    assert rep["unused_rules"] == []   # 不再有闲置


@test("8 条闲置准则被 COVER-ALL 覆盖")
def t17():
    rep = _OP_SNAP["coverage_report"]()
    assert rep["unused_rules"] == []  # COVER-ALL 后无闲置
    assert rep["covered_rules"] == 28  # v3.4.3: R28 接入 RUN-THROUGH 后全覆盖
    # 验证 COVER-ALL 确实包含 8 条准则
    COVER_ALL = _OP_SNAP["OPERATORS"]["COVER-ALL"]
    assert COVER_ALL == frozenset({"R2", "R3", "R9", "R10", "R15", "R16", "R21", "R27"})


@test("5+1 算子无集合论矛盾")
def t18():
    OPERATORS = _OP_SNAP["OPERATORS"]
    intersection = _OP_SNAP["intersection"]
    RULES_ALL = _OP_SNAP["RULES_ALL"]
    names = list(OPERATORS.keys())
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            inter = intersection(names[i], names[j])
            assert inter.issubset(RULES_ALL)
    # 额外: 5 算子 ∪ COVER-ALL = RULES_ALL (100% 覆盖)
    union = _OP_SNAP["union"]
    all_six = union("RUN-THROUGH", "DEBUG", "EXPLAIN", "LEARN", "REVIEW", "COVER-ALL")
    assert all_six == RULES_ALL
    assert len(all_six) == 28


@test("audit.py 可对 RULE 文本跑算子使用率审计")
def t18b():
    import os, re as _re
    rules_tree_path = os.path.join(os.path.dirname(_OP_SNAP["__file__"]), "..", "RULES-TREE.md")
    with open(rules_tree_path, encoding="utf-8") as f:
        content = f.read()
    # 提取 RULE-PUSH-V323-001
    m = _re.search(r"### RULE-PUSH-V323-001.*?(?=\n### |\Z)", content, _re.DOTALL)
    assert m, "RULE-PUSH-V323-001 应存在于 RULES-TREE.md"
    from rules_tree.audit import audit_text
    audit = audit_text(m.group(0))
    # 1. 所有 6 算子应至少激活 1 个 Pre 准则 (不出现休眠算子)
    for op_name, evidence in audit["operator_rule_evidence"].items():
        assert len(evidence) > 0, f"算子 {op_name} 应被本次 RULE 激活, 但 Pre 集 0 命中"
    # 2. 总激活度 >= 50% (RULE-PUSH-V323-001 覆盖 16 条准则, 总去重 27, 比例应高)
    import rules_tree.operators as op
    total = sum(len(audit["operator_rule_evidence"][o]) for o in op.OPERATORS)
    coverage = total / len(op.family_union())
    assert coverage >= 0.5, f"算子家族总激活度 {coverage:.1%} 应 ≥ 50%"


@test("∧ 组合: RUN-THROUGH ∪ DEBUG = 13 条")
def t19():
    s = _OP_SNAP["union"]("RUN-THROUGH", "DEBUG")
    # 9 + 6 - |{R11,R22}| = 13 (v3.4.3: RUN-THROUGH +R28,不在 DEBUG 中故并集 12→13)
    assert len(s) == 13


@test("家族并集 = 28 条 (含 COVER-ALL)")
def t20():
    assert len(_OP_SNAP["family_union"]()) == 28


@test("反向索引: R22 → 4 算子")
def t21():
    idx = _OP_SNAP["rules_to_operators"]()
    assert sorted(idx["R22"]) == ["DEBUG", "LEARN", "REVIEW", "RUN-THROUGH"]
    assert sorted(idx["R7"]) == ["DEBUG", "EXPLAIN", "REVIEW"]


@test("R2/R27 现在在 COVER-ALL 里")
def t22():
    idx = _OP_SNAP["rules_to_operators"]()
    # COVER-ALL 后这 8 条被这个算子覆盖
    assert idx["R2"] == ["COVER-ALL"]
    assert idx["R27"] == ["COVER-ALL"]


@test("未知算子抛 KeyError")
def t23():
    try:
        _OP_SNAP["union"]("FAKE-OP")
        assert False
    except KeyError:
        pass


@test("CLI: lln 1.0 0.2 0.0")
def t24():
    import io, contextlib
    import rules_tree.__main__ as cli
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = cli.main(["lln", "1.0", "0.2", "0.0"])
    out = buf.getvalue()
    assert rc == 0
    assert "STOP" in out
    assert "0.622" in out


@test("CLI: operators")
def t25():
    import io, contextlib
    import rules_tree.__main__ as cli
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = cli.main(["operators"])
    out = buf.getvalue()
    assert rc == 0
    assert "RUN-THROUGH" in out
    assert "27" in out


@test("CLI: coverage")
def t26():
    import io, contextlib
    import rules_tree.__main__ as cli
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = cli.main(["coverage"])
    out = buf.getvalue()
    assert rc == 0
    assert "覆盖率" in out
    assert "100" in out  # 100% 覆盖
    # COVER-ALL 后不再有闲置准则提示
    assert "需 RULE-COVER-001 兑底" not in out  # 兑底生效后这句话不再出现


@test("CLI: math-check")
def t27():
    import io, contextlib
    import rules_tree.__main__ as cli
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = cli.main(["math-check"])
    out = buf.getvalue()
    assert rc == 0
    assert "INV-1" in out
    assert "全部不变量通过" in out


@test("CLI: 未知子命令 rc=2")
def t28():
    import rules_tree.__main__ as cli
    rc = cli.main(["bogus"])
    assert rc == 2


@test("CLI: lln 参数不足 rc=2")
def t29():
    import rules_tree.__main__ as cli
    rc = cli.main(["lln", "1.0"])
    assert rc == 2


# ──────────── COVER-ALL 兑底算子测试 (t30-t35) ────────────


@test("COVER-ALL: CoverAllContext 默认值 (R9/R21 n/a, 其他 y)")
def t30():
    ctx = _OP_SNAP["CoverAllContext"]()
    assert ctx.R2_alignment == "y"
    assert ctx.R3_business == "y"
    assert ctx.R9_no_destroy == "n/a"
    assert ctx.R10_no_repeat == "y"
    assert ctx.R15_complete == "y"
    assert ctx.R16_extraordinary == "y"
    assert ctx.R21_recycle == "n/a"
    assert ctx.R27_score3d == "y"


@test("COVER-ALL: parse_cover_token 三状态 (y/n/n/a)")
def t31():
    parse = _OP_SNAP["parse_cover_token"]
    assert parse("y") == "✅"
    assert parse("YES") == "✅"
    assert parse("✅") == "✅"
    assert parse("n") == "❌"
    assert parse("NO") == "❌"
    assert parse("n/a") == "➖"
    assert parse("-") == "➖"
    try:
        parse("bogus")
        assert False, "should raise"
    except ValueError:
        pass


@test("COVER-ALL: check_cover_all 全 y (含 R9/R21) 返回 8 个 ✅")
def t32():
    ctx = _OP_SNAP["CoverAllContext"](R9_no_destroy="y", R21_recycle="y")
    items = _OP_SNAP["check_cover_all"](ctx)
    assert len(items) == 8
    assert all(it.status == "✅" for it in items), f"got: {items}"
    rules = [it.rule for it in items]
    assert rules == ["R2", "R3", "R9", "R10", "R15", "R16", "R21", "R27"]


@test("COVER-ALL: check_cover_all 一个 ❌ 不影响其他 7 项")
def t33():
    ctx = _OP_SNAP["CoverAllContext"](R15_complete="n")
    items = _OP_SNAP["check_cover_all"](ctx)
    r15 = [it for it in items if it.rule == "R15"][0]
    assert r15.status == "❌"
    r2 = [it for it in items if it.rule == "R2"][0]
    assert r2.status == "✅"


@test("COVER-ALL: render_cover_all 含 [COVER-ALL] 头 + 8 行")
def t34():
    ctx = _OP_SNAP["CoverAllContext"](R9_no_destroy="n")
    items = _OP_SNAP["check_cover_all"](ctx)
    out = _OP_SNAP["render_cover_all"](items)
    lines = out.split("\n")
    assert lines[0] == "[COVER-ALL]"
    assert len(lines) == 9
    # 检查某行格式
    assert any("R9·不搞破坏" in line and line.startswith("❌") for line in lines)


@test("CLI: cover-all 跑通 rc=0 输出 [COVER-ALL]")
def t35():
    import io, contextlib
    import rules_tree.__main__ as cli
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = cli.main([
            "cover-all", "--R2", "y", "--R3", "y", "--R9", "n/a",
            "--R10", "y", "--R15", "n", "--R16", "y", "--R21", "n/a",
            "--R27", "y",
        ])
    out = buf.getvalue()
    assert rc == 0
    assert "[COVER-ALL]" in out
    assert "R15·完整版" in out and "❌ R15·完整版" in out
    assert "R9·不搞破坏" in out and "➖ R9·不搞破坏" in out


@test("CLI: cover-all 缺值 rc=2")
def t36():
    import rules_tree.__main__ as cli
    rc = cli.main(["cover-all", "--R2"])
    assert rc == 2


@test("CLI: cover-all 未知准则 rc=2")
def t37():
    import rules_tree.__main__ as cli
    rc = cli.main(["cover-all", "--R99", "y"])
    assert rc == 2


def main():
    passed = 0
    failed = []
    for name, fn in TESTS:
        try:
            fn()
            passed += 1
            print(f"  PASS {name}")
        except Exception as e:
            failed.append((name, e, traceback.format_exc()))
            print(f"  FAIL {name}: {e}")
    print()
    print(f"=== {passed}/{len(TESTS)} 通过 ===")
    if failed:
        print("\n=== 失败详情 ===")
        for name, e, tb in failed:
            print(f"\n--- {name} ---")
            print(tb)
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()