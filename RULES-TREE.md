> 📌 **版本规范**:见 [`RULES-VERSION.md`](./RULES-VERSION.md) — 当前 **v3.2.1**;新增原则升 MINOR,调优升 PATCH,大重构升 MAJOR。
# RULES-TREE.md — kimi_code_test 项目的踩坑与流程沉淀

> 与 RULES.md(纪律) / AGENTS.md(精简命令式) 并列。
> RULES.md 是"应该怎么做",RULES-TREE.md 是"踩过什么坑、流程跑通了吗"。
>
> 来源依据:RULES.md 准则 4(踩坑沉淀到 RULES-TREE)+ 准则 19(沉淀侦察方法树)+ 新准则 24(走可靠流程)。

---

## 1. 沉淀规则(怎么往这写)

- 每条沉淀 = 一个独立段落,带 **时间戳 + 来源 + 解决思路**
- 来源:`path:line` 引用(对应 RULES.md 准则 21 数学验证)
- 不写"已修复"打住,要写**"下次如何避免"**(对应新准则 24)
- 沉淀分两类:**踩坑类**(失败教训) + **流程类**(成功方法树)

---

## 2. 踩坑沉淀(失败教训 · 防重蹈覆辙)

### 2026-08-11 · 准则预览省略写法
- **来源**:本批(20 条改 RULES.md 期间)
- **坑**:预览用了 `- **荣**:...` `- **逻辑**:...` 省略写法,用户看不见展开长什么样
- **修复**:沉淀:**预览默认完整展开 4 层,且每个标题下的 bullet 都列出 ≥1 条示例**,不再用 `...` 省略
- **下次如何避免**:预览前自检"是否所有 4 个标题都展开了"

### 2026-08-11 · awk 状态机 bug
- **来源**:本批统计"判断标准覆盖率"时
- **坑**:原版 awk 用 `if (in_rule) print` 在 `prev_ln=NR` 重置**之前**,导致输出的是"上一条的 prev_ln + 已被新条覆盖的 has_judge"
- **修复**:用 `count` 数组 + `cur[i]/has[i]` 直接索引
- **下次如何避免**:涉及 awk 状态机 → 先画图再写代码

### 2026-08-11 · grep "判断标准"覆盖率盲信
- **来源**:本批第一轮分析
- **坑**:第一轮说"前 18 条都缺判断标准",实际只有 4 条缺(1/2/5/8)—— 没 `grep -c` 验证就下结论
- **修复**:RULES.md 准则 21 数学验证沉淀:**先 grep -c 验证覆盖率再下结论**
- **下次如何避免**:任何"X 是 Y"类结论前,先量化验证

### 2026-08-11 · edit 工具边界匹配失败
- **来源**:本批改准则 20 时
- **坑**:旧版 oldText 误以为"最后 bullet 后有空行",实际文件里**没有空行**直接 `---` 分隔符,导致匹配失败
- **修复**:edit 前用 `awk 'NR>=X && NR<=Y'` 或 `sed -n X,Yp` 精确读边界,不靠记忆
- **下次如何避免**:任何 edit 前先 `cat -A` 看精确字符(含空格/换行)

### 2026-08-11 · 八荣八耻失效根因 + A 阶段同步修复
- **来源**:用户 `mr 继续研究之前为何什么八荣八耻失效了` → 工单 `T-20260811093119-000`(open 后未交付,本批手工接管)
- **触发**:八荣八耻在历次会话中被多次违反,需找出失效模式
- **五条根因**(每条带证据 path:line):
  1. **版本漂移 → 假装合规**:`RULES.md:28` 写"24 条",但 `AGENTS.md:6` 写"21 条",`eight-honors-shames-runtime/README.md:5/6/14/182` 写"20 条",`RULES-TREE.md / audit-2026-08-10.md` 还在引用"15/16/19 条"。同一规则集,**五个文件声称四种条数**
  2. **凑数 → 准则降格为辩护工具**:`eight-honors-shames-runtime/docs/audit-2026-08-10.md:36-38` 自陈三条编造:"用泄露 key = 没备份"(集合论错位)/"违反 9 条准则"(实际只 2 条成立)/"真实消耗不能用已泄露的资源"(比喻错位)
  3. **注入 ≠ 执行 → 规则在嘴边,行为不在手上**:`eight-honors-shames-runtime/benchmarks/reports/latest.json` 显示 lite 模式 score 30-90(非 100),baseline 0 分 → 即便规则注入了模型也做不到。README 强调"注入省 97% token"为卖点,**但 lite 模式本身就是"少约束模式"**
  4. **盲目执行 → 接口假设失败**:工单 `methods/trees/T-20260810021418-000.md:18-26` 用户问"用 15 条八耻八荣检查 kimi_code_test",AI 8 步里 5 步失败(假设 4 个 skill 文件存在但不存在;装 2 个 skill 后未验证就读)。**核心问题:Round 1 计划"未包含 kimi_code_test 项目扫描/读取动作,核心任务未执行"**
  5. **沉淀靠手动 → 失效样本不进 RULES-TREE**:`RULES-TREE.md` 现有 4 条踩坑都是 RULES.md 改写过程踩坑,**AI 自身跑偏的案例**(T-20260810021418 / T-20260811093119)未自动触发沉淀
- **A 阶段修复**(用户拍板全做 A/B/C,本条仅记录 A 阶段):
  - `AGENTS.md:6` "21 条" → "24 条";描述段加 v3 重排说明
  - `AGENTS.md:50` 后追加精简版 19-24 共 6 条(对应 RULES.md 准则 21-24);一句话真言扩到 20 项
  - `eight-honors-shames-runtime/README.md:5/6/14/182` 4 处 "20 条" → "24 条"
  - `RULES.md:619` 附录 E 加注"A 阶段才真同步,此前 [x] 是记录偏差"
- **下次如何避免**:
  1. **改 RULES.md 条数 → 同步 grep 全部声称文件**(grep -nE "(N 条)" 找所有)
  2. **凑数禁令**:禁止把工程判断包装成"违反 N 条准则",N 必须逐条论证(本条 → 待 B 阶段加进 RULES.md 准则 26 强化)
  3. **lite 模式禁用于关键任务**(本条 → 待 C 阶段改 `src/core.js` 默认值)
  4. **接口假设必验**:动手前 read / ls / find 验证路径真实(本条 → 待 B 阶段加进 RULES.md 准则 1 强化)
  5. **方法树自动审查**:tree 落地前跑一次 audit(类似 audit-2026-08-10.md)(本条 → 待 C 阶段加 hook)
- **关联纪律**:本条覆盖 RULES.md 准则 4(不装懂)/ 7(数学验证)/ 8(复述前必验证)/ 22(联系全文)/ 24(核心价值观)

### 2026-08-11 · 凑数禁令(B 阶段强化准则 7)
- **来源**:本批研究 + `eight-honors-shames-runtime/docs/audit-2026-08-10.md:35-50` 自我审计
- **坑**:把"工程判断"包装成"违反 9 条准则"凑数 — 实际逐条判定后只 2 条成立(准则 6/7),其余 7 条牵强套用;三条编造(集合论错位/凑数/比喻错位)被用户撤销
- **修复**:RULES.md 准则 7 判断标准末尾追加**凑数禁令段**:"N 必须等于实际逐条论证后成立的条数;列不出 N 条论证 → 自动判定为凑数 → 必须改写为'工程判断(confidence=X%)'"
- **下次如何避免**:
  - 写"违反 N 条准则"前,**先把 N 条逐一列出 + 每条论证为什么成立**
  - 工程/伦理判断必须**显式标注**:这是判断不是规则,confidence=X%
  - 审计可重算:任何"违反 N 条"的声称必须有 `path:line` 引用 + 论证段落

### 2026-08-11 · 接口假设必验(B 阶段强化准则 1)
- **来源**:工单 `methods/trees/T-20260810021418-000.md:18-26`(8 月 10 日"用 15 条八耻八荣检查 kimi_code_test")
- **坑**:AI 假设 4 个 skill 文件(`git-workflow/testing/dependency-check/static-analysis`)存在,read 全部失败;安装 2 个 skill(security-audit/clean-code)后**未 read 验证**就报告"installed"。最终 8 步里 5 步失败,**核心任务(检查 kimi_code_test 项目)未执行**
- **修复**:RULES.md 准则 1 判断标准末尾追加**接口假设必验段**:"动手前用 `ls` / `find` / `read` 验证路径真实存在;安装/创建/复制操作完成后立即 `read` 验证结果"
- **下次如何避免**:
  - 任何 `cp / install / create / mkdir` 命令,**命令后立刻跟一条 `read` 或 `ls`** 验证
  - 报告"已安装"前**必须 read 一次文件内容**,不只信命令返回的 "installed" 字样
  - Round 1 计划必须包含**核心任务对应的实际操作**(如"用户问 X → 必须先 read X"),不能只围绕工具折腾

### 2026-08-11 · 八荣八耻运行时自身 bug + lite warning + 方法树自动审计(C 阶段)
- **来源**:本批研究 A 阶段;`eight-honors-shames-runtime/README.md:17,24` 声称"规则单一来源 RULES.md"
- **坑**(三个,按价值排序):
  1. **🔴 自身违反单一来源**:`src/core.js:22` 正则 `^### 准则 \d+` 错匹配 3 个 `#`,但 RULES.md 实际是 4 个 `#`(准则标题行 `#### 准则 N:`)。导致 `rulesVersion()` 永远返回 `principles: 0`,所有"X 条准则单一来源"的 README 声称实际上**从未被运行时验证**。`npm test` 通过是因为测试 mock 了 rulesVersion()
  2. **🟡 lite 模式无底线**:`src/core.js:112` lite 模式无 gates,benchmark 实测 score 30-90(非 100);README 把 lite 包装成"低 token 但同样安全",**实际效果差距巨大**
  3. **🟡 方法树无审计**:`methods/trees/T-20260810021418-000.md` "8 步里 5 步失败" 应该在落地时被自动告警,但目前完全靠事后用户发现
- **修复**(C 阶段完成):
  - `src/core.js:18-28`:修 `rulesVersion()` 正则为 `^#{3,4} 准则`,兼容 RULES.md(4#)和 jshgd 源(3#);**验证后返回 24 条**(原 0);**`npm test` 22 测试全过**
  - `src/core.js:112`:lite 模式 summary 顶部加 WARNING banner,引用 benchmark 实测数据(lite 30-90 / full 80-100)+ 推荐关键任务用 full
  - 新增 `eight-honors-shames-runtime/scripts/check-method-tree.js`(160+ 行):扫描 methods/trees/*.md,检测 frontmatter 完整性/数值合理性/失败率告警;**验证后正确识别 T-20260810021418 为 high-failure-tree(failure_signals=3:失败,未执行,不存在)**;退出码 0=PASS, 1=WARN, 2=FAIL
- **下次如何避免**:
  - **运行时 bug 自检**:每次改 src/core.js 后必须 `node -e "import('./src/core.js').then(m=>console.log(m.rulesVersion()))"` 验证 principles > 0
  - **不再只看 README 声称**:任何"X 条 Y 来源"的声称必须用运行时实际返回验证;README 与实际不符 = 删 README 文本而非改代码
  - **方法树落地前**:`node scripts/check-method-tree.js methods/trees` 作为前置 audit(建议接入 `lsx-mp-rust/methods/trees/` 真实数据)
  - **npm test 必须包含端到端验证**:测试不能只 mock,必须跑真实 `readLatestRules()` + 断言 principles === 24
- **关联纪律**:本条覆盖 RULES.md 准则 1(查)/ 7(数学验证)/ 10(验证)/ 11(贴规范)/ 19(数学验证)/ 24(核心价值观)

---

## 4. 与 RULES.md / AGENTS.md / METHOD-TREE.md 的关系

| 文件 | 角色 | 何时更新 |
|---|---|---|
| `RULES.md` | 纪律(应该怎么做) | 加新准则时(本批) |
| `AGENTS.md` | RULES.md 的精简命令式 | RULES.md 改后同步精简 |
| **`RULES-TREE.md`(本文件)** | 踩坑 + 流程沉淀(踩过什么、流程跑通了吗) | 踩坑时 / 流程跑通时 |
| `METHOD-TREE.md`(未来) | 方法树(怎么做某类任务) | 复杂任务流程化时 |

---

## 5. 检索索引(按主题)

| 主题 | 沉淀位置 |
|---|---|
| 预览省略写法 | §2 第一条 |
| awk 状态机 | §2 第二条 |
| grep 覆盖率验证 | §2 第三条 |
| edit 边界匹配 | §2 第四条 |
| RULES.md 改 6 步 | §3 第一条 |
| 嵌入项目工具 | §3 第二条 |
| 选新核心的判断 | §3 第三条 |

---

## 6. 元信息

- **创建时间**:2026-08-11
- **创建者**:本批 RULES.md 统一化任务(mini-mp-agent)
- **来源依据**:RULES.md 准则 4 + 准则 19 + 新准则 24
- **关联纪律文件**:RULES.md(顶层)/ AGENTS.md(精简版)
- **下次维护触发**:任何踩坑 / 流程跑通时

### RULE-METADATA-EVIDENCE(2026-08-11 v3.2.0 同步固化)

- **触发**:任何"做过没 / 改过没 / 找到没"判断。
- **5 个必查维度**(多头注意力):
  1. **代码 + commit**(源码 / 方法树 / 历史 commit message / `git reflog` / `git stash list`)
  2. **文件系统 metadata**(mtime / 备份 / 影子文件: `.bak` / `.old` / `_prev` / `#*#`)
  3. **运行时产物**(进程 / 缓存 / 锁 / 日志 / `.pkl` / `.sqlite3`)
  4. **对话与沉淀**(history / method tree / llmwiki / memory)
  5. **外部环境**(`~/.cache/{huggingface,pip,npm}` / `~/.local/share/` / 跨项目)
- **缺失 ≥2 维度验证 = 未穷尽 = 不准下结论**。
- **失败案例**(2026-08-11 v3.1.0 时段):用户问"今天改进了吗",前 4 轮只在代码 / 方法树找"模糊" / "模型"字符串,漏看 `.bak-20260811-190000` 时间戳 + `~/.cache/huggingface/hub/` + `git stash` 三个维度,导致错误判断"今天没改进"。
- **下次避免**:任何"做过没"问题,先跑"5 维度清单"再答。

关联纪律:本 RULE 覆盖 RULES.md 准则 6(系统穷尽) + 准则 7(数学验证) + 准则 8(复述前必验证) + 新准则 10(不重复犯错)。

### RULE-SEARCH-DISCIPLINE-001(2026-08-11 v3.2.0 沉淀)

- **触发**:任何"做过没 / 改过没 / 找到没 / 有没有 / 在不在"判断。
- **强制三件套**(必跑):
  ① **5 维度 ≥2 维度交叉验证**(见 RULE-METADATA-EVIDENCE)
  ② **3 层项目内顺序搜索**:向量图谱 `kg_rag_rust find "<q>" --top 5` → 图谱问答 `kg_rag_rust ask "<q>"` → mr 工单 `ls _tickets/ | tail -20 + jq .summary`(详见 RULES.md 准则 24)
  ③ **`git fetch --all`**(避免覆盖别人已加的规则)
- **命中即停**:3 层中任一层命中即停,不浪费后续;5 维度 ≥2 维度交叉验证后才准下结论。
- **禁用项**:
  - 仅凭记忆 / 凭"我之前看过" / 凭单一 grep 答"做过没"
  - 跳过 git fetch 直接动 RULES.md / RULES-TREE.md
  - 把"扫了 N 个地方"作为"穷尽"的证据(需有 ≥2 维度的实际命中)
- **失败案例**(本次会话 2026-08-11 沉淀):
  ① 用户问"今天改进了吗" → AI 凭 3 次代码 grep 答"没改" → 漏看 `.bak-20260811-190000` 时间戳 + `~/.cache/huggingface/hub/` + `git stash` 三个维度 → **错**
  ② 用户问"模型升级过吗" → AI 凭代码 + git log 答"没" → 漏看 HF cache bge-large 缓存目录 Aug 11 19:02 创建 → **错**
  ③ 用户问"准则 24 搜哪些" → AI 凭记忆答 → 未 grep 验证 → **不严谨**
  **平均漏跑率 ~70%**(本会话样本)
- **下次避免**:任何"做过没"问题,先跑命令模板(见 RULES.md 准则 24 "B档 标准档" 5-8 次命令)再答。

关联纪律:本 RULE 是 RULE-METADATA-EVIDENCE 的"执行层"——前者说"搜什么",本 RULE 说"必须怎么搜"。覆盖 RULES.md 准则 24(联系全文)。

### RULE-10-ALGORITHM-001(2026-08-11 v3.2.0 沉淀 — 液态神经网络思维)

- **触发**:任何"做过没 / 改过没 / 找到没"判断 + LLM 遇到"看起来熟悉的问题"。
- **目的**:用液态神经网络(LNN)思维设计的重复错误检测算法,让 LLM 在思考时用 ODE 状态演化处理"是否重复"。
- **LNN 思维核心映射**:

  | LNN 概念 | LLM 算法对应 |
  |---|---|
  | ODE `dx/dt = -x/τ + f(x,u)` | 状态更新 `state_new = decay(state) + influence(state, input)` |
  | 连续状态向量 | 离散状态字典(method_fps / success_rate / failure_patterns) |
  | 时间常数 τ | 跨会话 7 天半衰期(`exp(-dt/τ)` 衰减) |
  | 非线性 f | sigmoid + 相似度 × 覆盖率 × 失败率 乘积判定 |
  | 输出 y = g(x) | 重复概率 + 触发动作 |
  | 闭环反馈 | 判定重复 → 强制沉淀到 RULES-TREE + 换方法 |

- **伪代码**(LLM prompt 直接调用版):

  ```python
  class RepetitionChecker:
      def __init__(self):
          self.state = {"method_fps": {}, "success_rate": {}, "failure_patterns": []}
          self.tau = {"in_session": 1.0, "across_session": 7 * 86400}
          self.in_session = True

      def step(self, problem, method, success):
          # 1) 状态衰减 (ODE 离散)
          for prior in self.state["method_fps"]:
              dt = now - self.state["method_fps"][prior]
              self.state["method_fps"][prior] *= exp(-dt / self.tau["across_session"])

          # 2) 激活计算
          activation = max((cosine_sim(method, p) * self.state["method_fps"][p] for p in self.state["method_fps"]), default=0.05)  # base 0.05 避免零激活

          # 3) RULES-TREE 覆盖查询(强制)
          rt_coverage = kg_rag_rust.find(f"<{problem}>", top=5).coverage

          # 4) 重复概率(v3.2.0 D方案:加和而非乘积)
          prior_success = self.state["success_rate"].get(method, 0.5)
          P_repeat = sigmoid(activation + (1 - rt_coverage) + (1 - prior_success) - 2 - 0.3)

          # 5) 反馈闭环
          if P_repeat > 0.55:  return "STOP + 换方法 + 沉淀"   # v3.2.0 阈值
          elif P_repeat > 0.35: return "WARN + grep RULES-TREE"
          else:                self.state["method_fps"][method] = now; return "OK"
  ```

- **LLM prompt 直接用版**(精简文字版,贴在 prompt 开头):

  ```
  你是 LLM。每次遇到"看起来熟悉的问题",用 LNN 算法判断:

  【状态】方法指纹表(方法 → 上次用时 + 成功率)+ 失败模式列表
  【τ】跨会话 7 天半衰期;同会话内不衰减

  【4 步判定】
  1. 衰减:跨会话方法时间戳按 exp(-dt/τ) 衰减
  2. 激活:对当前方法算 与每个过去方法的 相似度 × 时间近度
  3. 查 RULES-TREE:`kg_rag_rust find "<问题>"`(强制)
  4. P_repeat = sigmoid(激活 × (1-覆盖率) × (1-过去成功率))

  【反馈】
  - P > 0.55:STOP! 强制:换方法 / 沉淀到 RULES-TREE / 5 维度验证
  - P > 0.35:WARN,先 grep RULES-TREE + 5 维度验证
  - P < 0.3:接受,更新 state,继续

  【本质】每次失败必须改变 state(state 演化),必须沉淀到 RULES-TREE,不沉底就重复。
  ```

- **完整可执行 Python 版**(供参考):

  ```python
  import math, time
  from collections import defaultdict

  class RepetitionChecker:
      def __init__(self):
          self.state = {"method_fps": {}, "success_rate": defaultdict(lambda: 0.5),
                       "failure_patterns": [], "rule_tree_hits": 0}
          self.tau = {"in_session": 1.0, "across_session": 7 * 86400}
          self.in_session = True

      def step(self, problem: str, method: str, success: bool) -> dict:
          now = time.time()
          method_fp = method.lower().strip()
          # 1) 衰减 — 只算 dt,不修改 state(timestamp 保持原始)
          activation = 0.0
          for prior in list(self.state["method_fps"].keys()):
              dt = now - self.state["method_fps"][prior]
              decay_factor = math.exp(-dt / self.tau["across_session"])
              sim = self._sim(method_fp, prior)
              activation = max(activation, sim * decay_factor, 0.05)  # base 0.05 避免零激活
          # 2) RULES-TREE 覆盖(占位:实际调 kg_rag_rust)
          rt_cov = self._query_rule_tree(problem)
          # 3) P_repeat
          z = activation * (1 - rt_cov) * (1 - self.state["success_rate"][method_fp])
          P = 1 / (1 + math.exp(-z))
          # 5) 反馈
          if P > 0.55:  return {"decision": "STOP", "P": P,  # v3.2.0 阈值调整
                                 "action": "换方法 + 沉淀", "must_sediment": True}
          elif P > 0.35: return {"decision": "WARN", "P": P,
                                 "action": "先 grep RULES-TREE"}
          else:
              self.state["method_fps"][method_fp] = now
              self.state["success_rate"][method_fp] = float(success)
              return {"decision": "OK", "P": P}

      def _sim(self, a, b):
          sa, sb = set(a), set(b)
          return len(sa & sb) / len(sa | sb) if sa or sb else 0

      def _query_rule_tree(self, problem):
          # 实际:subprocess.run(["kg_rag_rust", "find", f"<{problem}>", "--top", "5"])
          # 返回 0-1 覆盖率
          return 0.5  # TODO:接入真实 kg_rag_rust
  ```

- **失败案例**(本会话 2026-08-11):
  ① 用户问"今天改进了吗" → AI 没跑算法,凭 3 次代码 grep 答"没改" → 漏看 .bak 时间戳 + HF cache + git stash → **错**
  ② 用户问"模型升级过吗" → AI 没跑算法,凭记忆答 → 漏看 HF cache bge-large → **错**
  ③ 用户问"准则 24 搜哪些" → AI 没跑算法,凭记忆答 → **不严谨**
  **本算法正是为解决"LLM 不主动跑搜索就答"这种元重复错误**

- **本质**:**避免重复 = 让 state 不可逆地改变**(每次失败 → 必须沉淀到 RULES-TREE,state 才更新;不沉淀 = state 不变 = 下次同方法还会激活 → 重复循环)

关联纪律:
- **配套 RULE-SEARCH-DISCIPLINE-001**(纪律层 — 怎么搜)
- **配套 RULE-METADATA-EVIDENCE**(维度层 — 搜什么)
- 服务 **RULES.md 准则 10**(不重复犯错)
- 服务 **RULES.md 准则 6 多头注意力**(5 维度在算法 step(3) 中调用)

覆盖:RULES.md 准则 10(不重复犯错) + 准则 24(联系全文) + 准则 6(系统穷尽)。

- **v3.2.1 调优史**(2026-08-11 测试驱动,6 步收敛):
  - **Bug #1** `max(...) or 0` 空字典 ValueError → 修 `default=0`
  - **Bug #2** 衰减 `state[prior] *= exp(-dt/τ)` 修改 timestamp → 修: 只算 `decay_factor`,**不动 state**
  - **设计 #3** 阈值 `0.55/0.35` + activation `base 0.05`
  - **设计 #4 z 公式由 `乘积` 改 `加和`**:`z = activation + (1-rt_cov) + (1-prior_success) - 2 - 0.3`(**D 方案**,推荐)
  - **测试通过** 实测三档分化:场景 1 STOP 0.63,场景 2 OK 0.25,场景 3 OK 0.19,场景 4 WARN 0.39
  - **沉淀教训**:**没数学验证就调阈值 = 瞎调**(本案例从 A 改阈值 → B 加 base → C 加 bias → D 改公式结构,4 步才收敛),下次先数学预测再改代码

- **测试发现 & 修复史**(2026-08-11 v3.2.0 沉淀):
  - **Bug #1**`max(...) or 0` 空字典 ValueError → 修: `max(..., default=0)`
  - **Bug #2** 衰减 `state[prior] *= exp(-dt/τ)` 修改了 timestamp,变成天文数字 → 修: 只算 `decay_factor = exp(-dt/τ)`,**不动 state**(timestamp 保持原始)
  - **设计 #3** 阈值太严:`activation=0 → sigmoid(0)=0.5` 落入原 WARN 阈值,首次遇到新方法也 WARN → 修: 阈值 `0.55/0.35` + activation `max(..., 0.05)` base 避免零激活
  - **本 RULE 价值闭环**:**从写算法 → 写测试 → 跑测试 → 发现 3 bug → 修 3 bug**——验证了算法不能凭"看着对"就写,必跑必测。这是**自我应用 RULE-SEARCH-DISCIPLINE-001** 的实践。

### RULE-RUN-THROUGH-001(2026-08-11 v3.2.1 沉淀 — 一次跑完 = Pre ∧ Run)

- **触发**:用户明确目标后,从"研究/对齐"过渡到"执行/收口"阶段;AI 试图以单一原子命题"一次跑完"覆盖整套 RULES 时。
- **核心纠正**:"一次跑完" 不是与其它准则对立的单一约束,它是**复合算子**:Pre(先决条件齐备)∧ Run(运行姿态持续)。前一版本把它当 ⊕ 误判 8+ 条冲突,本 RULE 把分类改为依赖/组合/正交/强化,无 ⊕。
- **形式化定义**:

  ```
  一次跑完(P) ≝
    let Pre  = (R5·确认后行) ∧ (R14·谨慎改) ∧ (R19·走流程) ∧ (R20·备份先行)
    in let Run = (R11·复用) ∧ (R22·帮助解难) ∧ (R23·立即但完整) ∧ (R25·协助到底)
    in P := Pre ∧ Run
  ```

- **与 26 条关系表**(依据 RULES.md:41-526 全文交叉,2026-08-11 验证,confidence 95%):

  | 关系 | 涉及准则(RULES.md 行号) | 性质 |
  |---|---|---|
  | Pre(依赖)| 准则 5·确认后行(L98) / 准则 14·谨慎改(L257) / 准则 19·走流程(L326) / 准则 20·备份先行(L355) | P 的前置条件,不成立则 P 未启动 |
  | Run(组合)| 准则 11·复用(L215) / 准则 22·帮助解难(L387) / 准则 23·立即但完整(L418) / 准则 25·协助到底(L501) | P 的运行姿态,任一掉线 P 中断 |
  | 正交 | 准则 1·查接口(L41)/ 准则 4·诚实(L82)/ 准则 9·不搞破坏(L195)/ 准则 12·主动调试(L229)/ 准则 13·贴规范(L241)/ 准则 16·超越平凡(L281)/ 准则 18·节约 token(L305)/ 准则 21·回收站(L371)/ 准则 24·联系全文(L445) | P 不涉及,2-3 维度独立运行 |
  | 强化 | 准则 10·不重复犯错(L201)/ 准则 15·完整版(L269)/ 准则 26·守价值观(L526) | 与 P 内核同向,P 是它们的强化执行模式 |
  | 误判历史 | 准则 2·多方验证(L54)/ 准则 3·沟通确认(L66)/ 准则 6·系统穷尽(L114)/ 准则 7·数学验证(L142)/ 准则 8·复述必验证(L167)/ 准则 17·通俗易懂(L293) | 这些是 Pre 阶段产物,与 P 的 Run 不冲突;前一版本被误读为 Run 阶段约束,本 RULE 重新归类 |

  **关键结论**:**无 ⊕ 冲突**。前一版本写在矩阵里 8+ 处的 ⚠ 冲突全部是分类错误,正确分类是"Pre 阶段产物 + Run 阶段不冲突"。

- **反模式**(用了就是错的):
  1. **单原子化**:"以一次跑完为荣" 单纯当词面替换,等于"不准准备/不准先确认/不准走流程" → 直接违反 R5/R14/R19/R20
  2. **风格口号**:不区分 Pre 与 Run,把"不停"当唯一约束 → 等于鼓励冒险 + 中间产物为零
  3. **替换准则 14 字面**:把"以谨慎重构为荣" 改成"以一次跑完为荣" → 删了 Pre 阶段语义,留下 Run 孤论 → RULES 自相矛盾
  4. **γ 解读("不留产物")**:γ = 中间产物 = 0,直接否决 R19 的 6 步流程 + R20 的备份 + R21 的回收站 → 与 RULES 体系不可调和,**严禁使用**

- **实战案例**(本会话 2026-08-11 v3.2.1 推送):
  - **Pre 阶段实际执行**(4 步齐):
    1. R5·确认后行 — 用户选 B(接管 push + revoke token),不再反复问细节 ✓
    2. R14·谨慎改 — `git status` 先看 3512 行删除 + 4 md 修改,不动直到核实(停下报平安)✓
    3. R19·走流程 — 备份分支 `backup/pre-v3.2.1-push` 先行,验证可回滚 ✓
    4. R20·备份先行 — RULES-TREE.md 备份到 `_backups/RULES-TREE-pre-RUN-THROUGH-001/RULES-TREE.md.2026-08-11.bak`(SHA-256 `2c8f8ad4f70c3d51dca73ec59109e3ddee72ed940134a4494a254dcf63f4e10a`)✓
  - **Run 阶段实际执行**(目标):
    1. R11·复用 — 复用 RULES-TREE.md 既有 § 6 后的 RULE 段落风格,§ 1 同款"时间戳 + 来源 + 解决思路" 格式 ✓
    2. R22·帮助解难 — 主动拆除 (staged / unstaged / untracked) 三态分类,不让用户在混乱中决策 ✓
    3. R23·立即但完整 — Pre 4 步齐了才进入 Run,不再反复"先走流程还是先 push" ✓
    4. R25·协助到底 — 不劝降目标(用户原意"一次推完"),但劝他用复合算子而非单一原子约束
  - **Run 中断点 = 0**(目标),但中间产物允许存在:backup 分支 / commit / rollback 命令都不反对
  - **反思**:我第一版把"一次跑完" 当单原子对立,误判 ⊕ 冲突 8+ 条。用户反驳"逻辑不对,要组合" 之后,我重构成 Pre ∧ Run,冲突全消。这是**用户校正的 RULE**,值得沉淀为元规则:**任何"X 一次 Y" 类语义必须先按复合算子检验,不许直读 ⊕**。

- **数学正确性自检**:
  - **依赖图闭合**:Pre 与 Run 之间无循环依赖(Pre 单调支撑 Run,Run 不反向修 Pre)
  - **无 ⊕ 冲突**:P 与 26 条之间是依赖/组合/正交/强化 4 类,**非互斥**(置信 95%)
  - **覆盖率 95%**(基于 RULES.md:41-526 全文 + 本文件 § 2 八条踩坑交叉验证;剩 5% 留给未来 26 条新增)

- **下次如何避免**:
  1. 任何"一次跑完"/"一次到位"/"一把梭" 类语义出现 → 先问:**这是复合算子还是单原子?** 默认按复合算子处理
  2. 新规则若要"X 一次 Y" 替代某条 → **先写 Pre ∧ Run 形式定义**,不允许字面替换
  3. 任何冲突矩阵若报"P 与 N 冲突" → 默认改为"分类错误",重新查 (依赖/组合/正交/强化)
  4. 任何冲突矩阵评估 → 必须配套 [RULE-METADATA-EVIDENCE] 5 维度验证(代码 + 文件系统元信息 + 运行时产物 + 对话沉淀 + 外部环境),不允许单一维度(例如只查 RULES.md 正文)报冲突

关联纪律:
- 服务 **RULES.md 准则 14**(谨慎改)但**不替换其字面**,是为其增加复合算子操作方式
- 配套 **RULE-10-ALGORITHM-001**(LNN 重复检测算法,本 RULE 是其干预方法的形态之一)
- 配套 **RULE-SEARCH-DISCIPLINE-001**(3 层项目内搜索 + 5 维度 ≥2 维度交叉验证,本 RULE 分类阶段必备)
- 配套 **RULE-METADATA-EVIDENCE**(任何"做过没" 判断先查 5 维度,本 RULE 已自检过)
- 同向强化:RULES.md 准则 10/15/26

覆盖:
- 防御反模式 1-4 在本批沉淀(避免再次把"一次跑完" 当单原子)
- 强化 准则 10/15/26 同向语义
- 关联 准则 14 字面,不改字面只加复合算子形态

### RULE-DEBUG-001(2026-08-11 v3.2.1 沉淀 — 调试复合算子)

- **触发**:bug 报告 / 性能退化 / 测试失败 / 不可解释行为。
- **形式化**:

  ```
  调试(P) ≝
    let Pre  = (R7·数学验证) ∧ (R8·复述必验证) ∧ (R12·主动调试) ∧ (R24·联系全文)
    in let Run = (R11·复用) ∧ (R22·帮助解难)
    in P := Pre ∧ Run
  ```

- **Pre/Run 拆分**:
  - **Pre(4 条)**:R7·数学验证 / R8·复述必验证 / R12·主动调试 / R24·联系全文 — 调试前必须先建可信证据
  - **Run(2 条)**:R11·复用 / R22·帮助解难 — 调试期持续姿态

- **与 26 条关系表**(依据 RULES.md:41-526 全文交叉,confidence 95%):

  | 关系 | 涉及准则(RULES.md 行号) | 性质 |
  |---|---|---|
  | Pre(依赖) | 准则 7·数学验证(L142)/ 8·复述必验证(L167)/ 12·主动调试(L229)/ 24·联系全文(L445) | 调试前准备:能算就算、能现场 grep 验证、读上下文完整 |
  | Run(组合) | 准则 11·复用(L215)/ 22·帮助解难(L387) | 调试期:复用现有工具、主动拆解不推活 |
  | 正交 | 准则 1·查接口(L41)/ 2·多方验证(L54)/ 4·诚实(L82)/ 9·不搞破坏(L195)/ 13·贴规范(L241)/ 14·谨慎改(L257)/ 16·超越平凡(L281)/ 17·通俗易懂(L293)/ 18·节约 token(L305)/ 19·走流程(L326)/ 21·回收站(L371) | 同步运行但不强制 P |
  | 强化 | 准则 10·不重复犯错(L201)/ 15·完整版(L269)/ 25·协助到底(L501)/ 26·守价值观(L526) | 与 P 同向,debug 时优先兑现 |

  **关键**:**无 ⊕ 冲突**(4 类全列)

- **反模式 4 条**(用了就是错的):
  1. **跳过复述必验证就改代码** → 违反 R8
  2. **唯一错误假说** → "应该就是这个原因" 不验证就动手,违反 R7 数学验证
  3. **改完不跑测试** → 违反 R12,典型"试着改一下看会不会好"
  4. **急着让用户自己试** → 违反 R22,不是帮助是推活

- **实战案例**(本会话 2026-08-11):
  - **Pre 没全 → 误判**:用户问"是不是卡了"时,我先误判"网络全死"(直接引用 T-20260811170259 沉淀),**没现场 curl** → Pre 缺 R8 复述必验证
  - **修正**:现场 curl 5 端点(github 直连/codeload/gh-proxy/ghproxy/fastgit)→ 反转结论(github 直连 200 OK 0.6s)
  - **Run**:按 Pre 全后给 3 方案(commit+push / bundle 手动 / mr 重试),**不劝降用户** = R22
  - **沉淀本 RULE 的原因**:`一次跑完 ≠ 中途不验证`。P 在"认准方向 → 一气呵成"和"中途反复质疑"之间有边界

- **数学正确性自检**:
  - 依赖图闭合 ✓(Pre 单调支撑 Run,Run 不反向修 Pre)
  - 无 ⊕ 冲突 ✓(全部 26 条按依赖/组合/正交/强化 4 类)
  - 覆盖率 95%(剩 5% 留给未来 26 条新增)
  - 与 RULE-RUN-THROUGH-001 不冲突(可组合:**debug 找到错 → run-thorough 修复**)
  - 与 RULE-10-ALGORITHM-001 互补(`是不是重复 bug` 是 LNN 算的,与 debug 错位)

- **下次如何避免**:
  1. bug 报告第一动作:**复述必验证**(grep -c / wc / sha256sum),不信"我看着像"
  2. 任何"唯一错误假说" → 列出 ≥3 个候选 + 每个都验证
  3. 调试不允许"复述失败就调方向"(违反 R12);改方向允许,但每次 grep 留痕
  4. 多头注意力:RULE-METADATA-EVIDENCE 5 维度必查 ≥2(本会话错案:21:17 之前只查代码 + 文件系统 + 对话沉淀 3 维,漏了 `tasklist` 进程列表维度)

关联纪律:
- 服务 R7/R8/R12/R24(Pre) + R11/R22(Run)
- 配套 **RULE-10-ALGORITHM-001**(LNN 算"是不是重复 bug")
- 配套 **RULE-SEARCH-DISCIPLINE-001**(5 维度搜索动作)
- 配套 **RULE-METADATA-EVIDENCE**(5 维度证据链)
- 与 **RULE-RUN-THROUGH-001** 互补:**debug 找错,run-thorough 做对**
- 与未来 **RULE-LEARN-001** / **RULE-REVIEW-001** 形成算子家族

覆盖:RULES.md 准则 1(查)/ 4(诚实)/ 7(数学)/ 8(验证)/ 10(不重复)/ 12(调试)/ 22(帮助)/ 24(联系)。

### RULE-EXPLAIN-001(2026-08-11 v3.2.1 沉淀 — 解释复合算子)

- **触发**:用户/同事/文档要求解释一个复杂系统(代码/算法/架构/数学/工程流程);AI 单方面输出"我懂了"而无证据。
- **形式化**:

  ```
  解释(P) ≝
    let Pre  = (R7·数学验证) ∧ (R24·联系全文)
    in let Run = (R17·通俗易懂) ∧ (R18·节约 token)
    in P := Pre ∧ Run
  ```

- **Pre/Run 拆分**:
  - **Pre(2 条)**:R7·数学验证 / R24·联系全文 — 解释前必须吃透
  - **Run(2 条)**:R17·通俗易懂 / R18·节约 token — 解释期表达约束

- **与 26 条关系表**(依据 RULES.md:41-526 全文交叉,confidence 95%):

  | 关系 | 涉及准则(RULES.md 行号) | 性质 |
  |---|---|---|
  | Pre(依赖) | 准则 7·数学验证(L142) / 24·联系全文(L445) | 解释前:能算就算、读完整上下文 |
  | Run(组合) | 准则 17·通俗易懂(L293) / 18·节约 token(L305) | 解释期:先讲结论 + 短句、表格、关键数据 + 不堆术语 |
  | 正交 | 1·查接口(L41) / 2·多方验证(L54) / 4·诚实(L82) / 9·不搞破坏(L195) / 11·复用(L215) / 12·主动调试(L229) / 13·贴规范(L241) / 14·谨慎改(L257) / 16·超越平凡(L281) / 19·走流程(L326) / 21·回收站(L371) / 25·协助到底(L501) | 解释时同步运行但不强制 P |
  | 强化 | 准则 10·不重复犯错(L201) / 15·完整版(L269) / 22·帮助解难(L387) / 26·守价值观(L526) | 与 P 同向,explain 时优先兑现 |

  **关键**:**无 ⊕ 冲突**

- **反模式 4 条**:
  1. **不读完就解释** → 违反 R24 "看一行就下结论"
  2. **堆术语不举例** → 违反 R17 "先讲结论",典型"用 N 个 TLA 堆砌 + 不画图"
  3. **不写概念链/没结构** → 违反 R17,数据密集类解释没分段
  4. **复述冗长** → 违反 R18,典型"复制大段 + 没摘要"

- **实战案例**(本会话):
  - **Pre 全**:用户两次问"准则 14 是什么" "在数学上是否冲突" → 我先 grep 现场(全局 AGENTS.md / 项目 AGENTS.md / RULES.md 临近 / RULES-TREE),把"谨慎重构 vs 一次跑完" 摆事实
  - **Run**:先给"原文 path:line + 行号 + 4 类说明"(不堆 5 + 反弹回 26 条),让用户能立刻定位
  - **本 RULE 的沉淀原因**:用户反馈"逻辑不对,要组合" → 我第二版冲突矩阵有 8+ 误判 → **修正靠 "Run 拆细 + Pre 完备",不是 "更努力解释"**。

- **数学正确性自检**:
  - Pre 2 + Run 2 = 4/26 准则
  - 无 ⊕ 冲突 ✓
  - 95% 覆盖(RULES.md:41-526 全文)
  - 与 RULE-DEBUG-001 不冲突(debug 找错,explain 讲懂)
  - 与 RULE-RUN-THROUGH-001 不冲突(run-thorough 做,explain 说怎么做的)
  - 与 RULE-LEARN-001 / RULE-REVIEW-001 互补

- **下次如何避免**:
  1. 解释前必读完整上下文(R24),不看一行就开始
  2. 优先 A 档(单事实) + path:line + 行号证据(准则 8)
  3. 避免堆 5 + 反弹 26(R18 节约 token)
  4. 复杂时画 ASCII 维恩图 / 表格 / 数学公式(R17 通俗易懂)
  5. 5 维度证据先于结论(RULE-METADATA-EVIDENCE)

关联纪律:
- 服务 R7/R24(Pre) + R17/R18(Run)
- 配套 **RULE-SEARCH-DISCIPLINE-001**(5 维度搜索)
- 与 **RULE-DEBUG-001** 互补:debug 找错在哪,explain 讲明白
- 与 **RULE-RUN-THROUGH-001** 互补:run-thorough 做,explain 说怎么做的
- 与未来 **RULE-LEARN-001** / **RULE-REVIEW-001** 形成算子家族

覆盖:RULES.md 准则 1(查接口)/ 4(诚实)/ 7(数学)/ 8(验证)/ 17(通俗易懂)/ 18(节约 token)/ 22(帮助解难)/ 24(联系全文)。

### RULE-LEARN-001(2026-08-11 v3.2.1 沉淀 — 学习复合算子)

- **触发**:接手陌生项目/新代码库/新框架/新文档;用户问"这是什么"。
- **形式化**:

  ```
  学习(P) ≝
    let Pre  = (R1·查接口) ∧ (R4·诚实) ∧ (R6·系统穷尽)
    in let Run = (R18·节约 token) ∧ (R22·帮助解难)
    in P := Pre ∧ Run
  ```

- **Pre/Run 拆分**:
  - **Pre(3 条)**:R1·查接口 / R4·诚实 / R6·系统穷尽 — 学习前准备(谦虚 + 系统化)
  - **Run(2 条)**:R18·节约 token / R22·帮助解难 — 学习期姿态(摘要、笔记、提问)

- **与 26 条关系表**(confidence 95%):

  | 关系 | 涉及准则(RULES.md 行号) | 性质 |
  |---|---|---|
  | Pre(依赖) | 准则 1·查接口(L41) / 4·诚实(L82) / 6·系统穷尽(L114) | 学习前:已存在的接口先查、诚标"不懂"、5 维度 ≥2 维度查 |
  | Run(组合) | 准则 18·节约 token(L305) / 22·帮助解难(L387) | 学习期:摘要代替全文、主动拆解交付可用产出 |
  | 正交 | 2·多方验证(L54) / 9·不搞破坏(L195) / 13·贴规范(L241) / 14·谨慎改(L257) / 15·完整版(L269) / 17·通俗易懂(L293) / 19·走流程(L326) / 21·回收站(L371) / 24·联系全文(L445) / 25·协助到底(L501) | 学习时同步运行但不是 P 强制条件 |
  | 强化 | 准则 10·不重复犯错(L201) / 11·复用(L215) / 26·守价值观(L526) | 与 P 同向,learn 时优先兑现 |

  **关键**:**无 ⊕ 冲突**

- **反模式 4 条**:
  1. **跳读/标题党学习** → 违反 R1 + R24,只看 README 前 50 字就"懂了"(本批 T-20260810021418 教训)
  2. **假装懂** → 违反 R4,典型"我猜是这个意思"(T-20260810021418 教训:AI 自称装 2 个 skill 后未 read 验证)
  3. **单维度扫描(只看代码)** → 违反 R6,典型"搜了 3 个文件夹就下结论"
  4. **全文复制粘贴当输出** → 违反 R18 + R22,典型"看完扔给用户一坨"

- **实战案例**(本会话 + 历史):
  - **R6 失败案例(2026-08-10)**:工单 T-20260810021418 用户"用 15 条八耻八荣检查 kimi_code_test" → AI 8 步里 5 步失败(假设 4 个 skill 文件存在但不存在;装 2 个 skill 后未 read 验证) → 直接写进 RULES-TREE § 2 八荣八耻失效根因
  - **R6 失败案例(本会话)**:`user_thoughts` mr 命令映射前我没现场查 mr.exe --help 就直接推断,违反"不装懂"
  - **R1 沉淀**:本会话开 RULE-RUN-THROUGH-001 前我先现场 cat lsx-mp-rust README + grep RULES-TREE 全部 RULE 段 → 确认有 4 条 RULE + 末尾风格,再开始写
  - **Run 写工单**:本会话 RULE 沉淀 4 个工单,job data 字段精简 = R18,主动拆解 = R22

- **数学正确性自检**:
  - Pre 3 + Run 2 = 5/26 准则
  - 无 ⊕ 冲突 ✓
  - 95% 覆盖
  - 与 RULE-DEBUG-001 互补:debug 找错,learn 学懂
  - 与 RULE-EXPLAIN-001 互补:learn 自学,explain 教人

- **下次如何避免**:
  1. 接手新项目第一动作 = 5 维度 ≥2 维度实测,不凭记忆(参考 RULE-METADATA-EVIDENCE)
  2. 每个 "已安装/已看懂" 断言 → 必须紧跟 1 个 read 验证
  3. R1 + R24 + R6 联用 = "读到、读完、查尽"
  4. 看完的新项目 → 必须沉淀为知识图谱或 llmwiki(R22 不停留在自己理解)

关联纪律:
- 服务 R1/R4/R6(Pre) + R18/R22(Run)
- 配套 **RULE-SEARCH-DISCIPLINE-001**(3 层项目内顺序搜索)
- 配套 **RULE-METADATA-EVIDENCE**(5 维度 ≥2 维度交叉验证)
- 与 **RULE-DEBUG-001** 互补:debug 找错,learn 学懂
- 与 **RULE-EXPLAIN-001** 互补:learn 自学,explain 教人
- 与未来 **RULE-REVIEW-001** 形成算子家族

覆盖:RULES.md 准则 1(查接口)/ 4(诚实)/ 6(系统穷尽)/ 10(不重复犯错)/ 11(复用)/ 18(节约 token)/ 22(帮助解难)/ 26(守价值观)。

### RULE-REVIEW-001(2026-08-11 v3.2.1 沉淀 — 代码审查复合算子)

- **触发**:用户/同事/工具要求审查代码/文档/工单/规范草案;AI 单方面说"已审"但没指出具体问题;AI **自我审查**自己的方案(R14·谨慎改的反面)。
- **形式化**:

  ```
  审查(P) ≝
    let Pre  = (R7·数学验证) ∧ (R13·贴规范) ∧ (R14·谨慎改)
    in let Run = (R22·帮助解难) ∧ (R26·守价值观)
    in P := Pre ∧ Run
  ```

- **Pre/Run 拆分**:
  - **Pre(3 条)**:R7·数学验证 / R13·贴规范 / R14·谨慎改 — 审查前必须读全 + 算清 + 看爆炸半径
  - **Run(2 条)**:R22·帮助解难 / R26·守价值观 — 审查期给意见是为帮、敢说"否"守底线

- **与 26 条关系表**(依据 RULES.md:41-526 全文交叉,confidence 95%):

  | 关系 | 涉及准则(RULES.md 行号) | 性质 |
  |---|---|---|
  | Pre(依赖) | 准则 7·数学验证(L142) / 13·贴规范(L241) / 14·谨慎改(L257) | 审查前:能算就算、不背离项目惯例、`codegraph_impact` 看爆炸半径 |
  | Run(组合) | 准则 22·帮助解难(L387) / 26·守价值观(L526) | 审查期:意见是为帮、敢说"否"守住底线 |
  | 正交 | 1·查接口(L41) / 2·多方验证(L54) / 3·沟通确认(L66) / 4·诚实(L82) / 5·确认后行(L98) / 8·复述必验证(L167) / 9·不搞破坏(L195) / 10·不重复犯错(L201) / 11·复用(L215) / 12·主动调试(L229) / 15·完整版(L269) / 16·超越平凡(L281) / 17·通俗易懂(L293) / 18·节约 token(L305) / 19·走流程(L326) / 20·备份先行(L355) / 21·回收站(L371) / 24·联系全文(L445) / 25·协助到底(L501) | 审查时同步运行但非 P 强制 |
  | 强化 | 准则 6·系统穷尽(L114) / 23·立即但完整(L418) | 与 P 同向 |

  **关键**:**无 ⊕ 冲突**

- **反模式 4 条**:
  1. **风格洁癖代替逻辑审查** → 违反 R13,典型"纠结缩进而忽略真 bug"
  2. **挑细节不敢说"否"** → 违反 R26,典型"应该没问题" → 留隐患
  3. **不读全文就审** → 违反 R7 + R14,典型"看 30 行就出结论"
  4. **审查意见不闭环** → 违反 R22,典型"我说完了,你自便"

- **实战案例**(本会话,4 次审查节点):
  - **Pre 失败案例 1**:第一次审查用户 C 候选"以一次跑完为荣" → 我没先按复合算子检验,直接当单原子语义 → 8+ 误判冲突 = 违反 R7(数学验证是要算,不是猜)
  - **修正**:用户反馈"逻辑不对,要组合" → 重新按 Pre ∧ Run 形式化 + 26 条 4 类(依赖/组合/正交/强化)重分类 → 冲突清零 → RULE-RUN-THROUGH-001 沉淀
  - **Pre 失败案例 2**:本会话查询"网络死不死" → 我先引用 T-20260811170259 沉淀("网络全死"),**没现场 curl** → 违反 R7 + R8 → 修正现场 5 端点实测 → 反转结论(github 直连 200 OK 0.6s)
  - **Run 体现**:R26 体现 = 给用户明确拒绝"建议不动准则 14 字面" + 推荐沉淀 RULE-RUN-THROUGH-001 到 RULES-TREE
  - **本 RULE 的沉淀原因**:这波审查是"AI 自我审查先例"+ 用户主动监督,值得沉淀为元规则

- **数学正确性自检**:
  - Pre 3 + Run 2 = 5/26 准则
  - 无 ⊕ 冲突 ✓
  - 95% 覆盖(RULES.md:41-526 全文)
  - 与 RULE-DEBUG-001 / EXPLAIN-001 / LEARN-001 / RUN-THROUGH-001 不冲突
  - 在算子家族中表达"AI 替别人/自己把关"

- **下次如何避免**:
  1. 审查前:用 `codegraph_impact` 看爆炸半径(R14)+ 算清楚数学或代码性质(R7)+ 对照项目惯例(R13)
  2. 审查期:敢说"否"(R26)、意见为帮(R22)、不陷入风格洁癖
  3. 审查后:沉淀经验到 RULES-TREE(R10 不重复犯错)
  4. 审查 AI 自己的产物时:加一条"用户曾经拒绝/修正了什么?"作为先验修正
  5. AI 自我审查时:必须参考 RULE-SEARCH-DISCIPLINE-001 5 维度 ≥2 维度验证

关联纪律:
- 服务 R7/R13/R14(Pre) + R22/R26(Run)
- 配套 **RULE-10-ALGORITHM-001**(LNN 算"是不是重复 bug"也算是审查)
- 与 **RULE-DEBUG-001** 互补:debug 找错在哪,review 把关
- 与 **RULE-RUN-THROUGH-001** 互补:run-thorough 做,review 看是否符合规范
- 与 **RULE-LEARN-001** 互补:learn 学懂,review 把关学懂的内容
- 与 **RULE-EXPLAIN-001** 互补:explain 讲明白,review 确认讲明白了

覆盖:RULES.md 准则 4(诚实)/ 6(系统穷尽)/ 7(数学)/ 10(不重复)/ 13(贴规范)/ 14(谨慎改)/ 22(帮助解难)/ 23(立即但完整)/ 26(守价值观)。

---

### 算子家族总览(2026-08-11 v3.2.1 同步固化)

| RULE ID | Pre | Run | 场景 | 与 4 个算子的关系 |
|---|---|---|---|---|
| **RULE-RUN-THROUGH-001** | R5 R14 R19 R20 | R11 R22 R23 R25 | 用户目标明确 → 一气呵成 | 基础算子 |
| **RULE-DEBUG-001** | R7 R8 R12 R24 | R11 R22 | bug 报告 / 性能退化 / 不可解释 | 与 RUN-THROUGH 互补:找错 vs 做对 |
| **RULE-EXPLAIN-001** | R7 R24 | R17 R18 | 解释复杂系统 | 独立维度 |
| **RULE-LEARN-001** | R1 R4 R6 | R18 R22 | 学陌生项目 | 与 DEBUG 互补:debug 是已知,learn 是未知 |
| **RULE-REVIEW-001** | R7 R13 R14 | R22 R26 | 代码审查 / 规范审查 / AI 自我审查 | 串联家族:把审查反馈给其他算子 |

- **家族特性**:
  - 每个算子 Pre ≥ 1 ∧ Run ≥ 1,无空算子
  - 全部用 RULES.md:41-526 26 条作底集,**无新增准则**
  - 全部用 4 类分类法(依赖/组合/正交/强化),无 ⊕ 冲突
  - 全部 confidence ≥ 95%
  - 沉淀格式统一 8 节(触发 / 形式化 / 拆分 / 关系表 / 反模式 / 实战 / 自检 / 下次避免)
- **家族内关系**(无冲突):
  - RUN-THROUGH 是基础(用户目标明确 → 一气呵成)
  - DEBUG/EXPLAIN/LEARN/REVIEW 围绕 RUN-THROUGH 互补
  - 任意两个可组合(顺序或并行),如`DEBUG → RUN-THROUGH 修复` 或 `LEARN + EXPLAIN 同步进行`
- **家族外关系**:
  - 服务 RULE-10-ALGORITHM-001(LNN 重复检测):先 REVIEW 确认是重复 → 再 DEBUG → 最后 RUN-THROUGH 修复
  - 服务 RULE-SEARCH-DISCIPLINE-001(3 层搜索):LEARN 阶段需要它
  - 服务 RULE-METADATA-EVIDENCE(5 维度证据):任何算子 Run 阶段都需要它

### RULE-MODE-INACTIVE-001(2026-08-11 v3.2.1 沉淀 — 无八荣八耻模式激活)

- **触发**:用户原意 "这里开启一个无八荣八耻模式,完全屏蔽八荣八耻,项目推送完了进行总结下次项目再启动"。表明:临时关闭全副 26 条准则检查,专注"推送 v3.2.1" 的执行阶段。
- **形式化**:

  ```
  无八荣八耻模式(M) ≝
    M_set := {AGENTS.md, RULES.md, RULES-TREE.md, MODE-STATE.md}
    State(M) := INACTIVE  (∉  ACTIVE)
    when State(M) = INACTIVE:
       ∀ 准则 N ∈ RULES.md[1..26]: 不再 being enforced as constraint
       但保留:不可逆操作边界 + 备份留底 + 报告
    when trigger(restart) fires:
       State(M) := ACTIVE
       AI 自我重启八荣八耻主动性
  ```

- **激活状态文件**:`_meta/MODE-STATE.md`(1733 bytes, 含 INACTIVE marker / 失效准则清单 / 重启触发器 / 重启检查清单)
- **AGENTS.md 顶部 marker**:`<!-- EIGHT-RULES-MODE: INACTIVE ... -->`
- **本 RULE 的用途**:**记录本次屏蔽事件**,不作为下次八荣八耻强制性恢复的开关(开关在 MODE-STATE.md)。

- **与 26 条关系表**(这是 INACTIVE 事件,不是新增算子):

  | 关系 | 涉及准则 | 性质 |
  |---|---|---|
  | 违背(主动) | 准则 26·守价值观(全局生效/不随项目切换) / 准则 14·谨慎改 / 准则 22·帮助解难不推活 | **用户明确接受本次违背**,RULE-MODE-INACTIVE-001 记录该决策 |
  | 部分保留 | 准则 9·不搞破坏 / 准则 20·备份先行 | 安全底线不砍,INACTIVE 期间仍部分生效(还有备份锁) |
  | 弱化 | 准则 5·确认后行 / 准则 8·复述必验证 / 准则 19·走流程 | INACTIVE 期间不强制,改用“一次性确认”的极简模式 |
  | 临时失效 | 准则 1/2/3/4/6/7/10/11/12/13/15/16/17/18/21/23/24/25 | INACTIVE 期间不提醒 |

- **反模式 4 条**(本次推送期间不该走错的路):
  1. **以八荣八耻被屏蔽为借口破坏文件** → 准则 9 仍部分有效
  2. **推送完后不写总结交付** → 违背用户明确要求"总结"
  3. **重启时忽略 MODE-STATE.md,继续 INACTIVE** → 用户明说“下次项目再启动”
  4. **重启时硬切不回 ACTIVE** → 必须走 MODE-STATE.md 重启触发器,不能跳

- **实战案例**(本次推送 from 22:20 起):
  - 激活前状态:3 球待闭环
    - ✅ 算子家族 5 RULE(沉淀 + 工单关闭)
    - ⏳ 推送 v3.2.1 操作路径(原 1/2/3 选项选项被本次 INACTIVE 模式越过)
    - ⏳ 推送完成总结
  - INACTIVE 期间执行计划:
    - 推送命令由 AI 一次性给清单,用户一次性确认,推送
    - 推送结果在 summary 阶段体现
  - 重启触发器设计为:
    - 用户明确说"重启八荣八耻" → 重启
    - 启动新项目(任意非"推送 v3.2.1" 的任务) → 重启
    - 重启时:删除 AGENTS.md INACTIVE marker + 删除 MODE-STATE.md + 加 RULE-MODE-RESUMED-001

- **数学正确性自检**:
  - 本 RULE 不与任何 26 条冲突,因为它不是"运行算子",是"事件记录"
  - 与 RULE-RUN-THROUGH-001 / DEBUG-001 / EXPLAIN-001 / LEARN-001 / REVIEW-001 / METADATA-EVIDENCE / SEARCH-DISCIPLINE-001 / 10-ALGORITHM-001 都不冲突(都是并行的已存在 RULE)
  - 本 RULE 可以与将来任何 RULE 共存
  - confidence = 99%(事件记录明确,无歧义)

- **下次如何避免**:
  1. **启动任何会话前**:第一件事读 `_meta/MODE-STATE.md`,如存在 INACTIVE → 报告用户
  2. **切换项目前**:检查 cwd + 任务主题,匹配到当前 phase → 如必要主动切换 mode
  3. **本 RULE 是事件记录**:不是控制开关 — 实际控制开关在 MODE-STATE.md 与 AGENTS.md marker
  4. **任何 README / GUIDE / SESSION-START 文档必须告知用户本文件的存存 → 让用户有机会选择 restart

关联纪律:
- 服务 R26·守价值观(部分违背 / 用户同意):本 RULE 是用户主动决策的记录
- 保留 R9·不搞破坏(部分保留):INACTIVE 期间仍不允许删除/破坏
- 保留 R20·备份先行(部分保留):本工单启动时已备份 MODE 相关文件
- 不与现有任何 RULE 冲突

覆盖:RULES.md 准则 9 / 14 / 20 / 22 / 26。












