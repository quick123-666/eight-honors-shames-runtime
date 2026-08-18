# RULES-VERSION.md — 八荣八耻版本规范

> **作用**:固化八荣八耻(本项目 AI 工作准则)的**版本号命名规范**和**升级流程**,避免"v3+2.1" vs "v2.3" vs "2026-08-11 v2.3" 之类的命名混乱。
> **维护触发**:任何新增原则 / 调优 / 反哺 / 大重构之前 + 之后
> **当前版本**:**v3.5.5**(2026-08-14,PATCH: v3.5.4 + token-slim 001/002 — skill 注入瘦身 ~87% + 会话卫生 + RULES 按需读 + [COVER-ALL] 输出取消)
> **上一版本**:v3.5.4
> **关联文件**:RULES.md(完整版 **29 条**) / AGENTS.md(精简版 **29 条**) / RULES-TREE.md(方法论沉淀)

## 最新变更摘要 v3.5.5 (2026-08-14)

- **本质**: PATCH 调优 — 29 条不变;token 消耗暴涨根因治理(用户报"最近 token 消耗量特别大")
- **根因量化**: ① skill 全量注入 — pi 内建扫描 `~/.agents/skills`(2022 个 SKILL.md)description 每次请求全量注入 system prompt ≈358KB/请求(~10 万+ token)② 会话滚雪球 — 近 30 天 128 会话合计 126.7MB,63 个 >800KB(15-20 万 token),最大单会话 105 万 token;deepseek contextWindow=1M 导致 auto-compaction 阈值 984k 才触发 ③ 规则文件 81KB 完整版首读整读 ④ 每轮 [COVER-ALL] 8 行强制输出
- **落地 4 件**:
  1. `~/.pi/agent/settings.json` 加 `!~/.agents/skills/**` 排除(pi 0.84.1 `isEnabledByOverrides` 支持 `!` 排除,minimatch 实测通过) → 注入 ~358KB → ~47KB(-87%)
  2. `compaction` 显式化(`enabled/reserveTokens/keepRecentTokens`)+ 会话卫生脚本 `~/.pi/agent/scripts/session-health.py`(>200KB WARN />800KB ALERT 建议 /compact)
  3. 项目 AGENTS.md「会话首读」改 read 前 120 行建索引,完整正文 grep/分段读
  4. [COVER-ALL] 8 行输出先分级(token-slim v1)后**完全取消**(v2 用户指令)—— 防空转由 RULES.md 第五章 5.1-5.5 A 终止标记兑底;算子 `python -m rules_tree cover-all` 保留按需手动
- **同步**: 全局 AGENTS.md F 档 / 运行时 RULES.md 准则 29+附录索引 / 项目 AGENTS.md 准则 29+探针段;主项目 v3.5.4 QClaw 适配器一并追平
- **沉淀**: RULE-TOKEN-SLIM-001 / RULE-TOKEN-SLIM-002(主 + 副本 RULES-TREE.md 同步)
- **不动结构**: **30 条准则**(v3.10.0 起),4 组不变,编号不变
- **回滚**: `cp _recycle_bin/pre-v3.5.5-20260814-221431/<file> <原路径>`(7 件备份)

---

## 最新变更摘要 v3.5.4 (2026-08-14)

- **本质**: PATCH 调优 — 29 条不变;新增 **QClaw / OpenClaw 适配器**(第 8 个适配目标)
- **补全**:
  - `scripts/build-adapters.js` — `ADAPTER_TARGETS` 加 `qclaw-eight-honors.SKILL.md`;新增 `buildQclawSkill()` 生成 always-load skill 模板(frontmatter `metadata.openclaw.always: true` + 21 条精简命令式 + RULES.md 指针 + 输出骨架/防空转简版)
  - `tests/adapters.test.js` — 7→8 目标断言 + qclaw skill 模板断言(name/always/frontmatter + 21 条零漂移);敏感内容测试豁免 qclaw 平台标识(name 与 metadata 键)
  - 部署:`~/.qclaw/skills/qclaw-eight-honors/SKILL.md`(4492 字节)+ `~/.qclaw/openclaw.json` 注册 main/mr-llm 两 agent + skills.entries 显式启用(改前已备份 `.bak-8r-20260814-210202`)
- **不动结构**: 29 条准则不变,4 组不变,编号不变
- **回滚**: `cp ~/.qclaw/openclaw.json.bak-8r-20260814-210202 ~/.qclaw/openclaw.json` + 删除 `~/.qclaw/skills/qclaw-eight-honors/`

---

## 六、 v3.2.3 变更摘要 (2026-08-12)

- **本质**: PATCH 调优 — LNN D 方案 + 5 复合算子从 markdown 伪代码代码化为 Python `rules_tree` 包,覆盖率 70.4%→100%
- **补全**:
  - `rules_tree/lln.py` — LNN D 方案可调用实现 + 4 数学不变量
  - `rules_tree/operators.py` — 5 算子 (RUN-THROUGH/DEBUG/EXPLAIN/LEARN/REVIEW) + **RULE-COVER-001 兑底算子 COVER-ALL** (覆盖 R2/R3/R9/R10/R15/R16/R21/R27)
  - `rules_tree/__main__.py` — CLI 入口 (lln/operators/coverage/math-check)
  - `tests/run_rules_tree_tests.py` — 手写 runner (不用 pytest, 规避 Python 3.14 严格模块加载 bug), 29/29 通过
- **文档同步**:
  - RULES-TREE.md 场景 4 漂移修正 (声称 0.39→WARN, 实测 0.310→OK)
  - RULES-TREE.md 加 RULE-COVER-001 沉淀 (8 条闲置准则兑底)
  - AGENTS.md / README.md / README_EN.md “21/24 条”→27 条同步
  - src/core.js 正则修复 `^###` → `^#{3,4}` (原则6: 运行时 bug 自检)
- **不动结构**: 26→27 条准则不变, 4 组不变, 准则编号不变
- **回滚**: `cp _recycle_bin/20260812-1230-rules-v3.3.0/<file> <原路径>`

---

## 一、命名规范:SemVer (MAJOR.MINOR.PATCH)

```
v<MAJOR>.<MINOR>.<PATCH>
  │      │      │
  │      │      └── PATCH: 调优/反哺/同步(不破坏结构,如:算法调优、注记更新)
  │      └────────── MINOR: 新增原则(每条 +1,如:插入"准则 N" → 后续编号全部 +1)
  └─────────────────── MAJOR: 破坏性重构(重新分组、合并/拆分、附录结构变更)
```

### 八荣八耻特定含义

| 版本位 | 触发 | 例子 |
|---|---|---|
| **MAJOR** | 任何破坏 27 条结构的大重构(重新分组 / 拆分 / 合并原则 / 重大语义变更) | v4.0.0(从平铺改分组) |
| **MINOR** | 新增原则(每条 +1,后续编号顺移)| v3.1.0(加准则 9) / v3.2.0(加准则 10) |
| **PATCH** | 调优 / 反哺 / 同步 / 注记更新(不破坏结构) | v3.2.1(算法调优反哺) |

### 禁用格式

- ❌ `v3` / `v3+1` / `v3+2` / `v3+2.1` — 混用不同格式
- ❌ `v2.1` / `v2.2` / `v2.3` 单用 — 这是 **RULES.md 文档版本**,不是八荣八耻版本(虽然数值常冲突,要用上下文区分)
- ❌ `2026-08-11 v2.3` 日期前缀 — 弃用,SemVer 自身按发布顺序天然排序

---

## 二、当前版本对照表

| SemVer | 含义 | 行数 | 状态 |
|---|---|---|---|
| **v3.0.0** | 22→24 条重排 | — | 已发布,保留 |
| **v3.1.0** | + 准则 9 不搞破坏 + 升级准则 6 多头注意力 | 25 条 | 已发布,保留 |
| **v3.2.0** | + 准则 10 不重复犯错 + 同步 RULE-METADATA-EVIDENCE(第二次插入)| 26 条 | 已发布,保留 |
| **v3.2.1** | 算法调优反哺(D 方案加和公式 + 三档阈值)+ 完整三文件版本统一 | 26 条(不变) | 已发布,保留 |
| **v3.2.2** | + 准则 27 稳扎稳打分分层判断 + R25/R26 补齐到精简版 + 语义版本跳 MINOR | 27 条 | 已发布,保留 |
| **v3.2.3** | LNN D 方案 + 5 复合算子代码化为 Python `rules_tree/` 包(覆盖率 70.4%→100%) + COVER-ALL 兑底算子 + 29 测试全过 + 文档漂移修正 | 27 条(不变) | 已发布,保留 |
| **v3.3.0** | R8/R19 互引注记(破除重复度70-80%) + COVER-ALL 兑底算子落地(`rules_tree/operators.py` + `__main__.py` + 8 单测 38/38) + AGENTS.md F 档 hook(强制每轮结尾输出 `[COVER-ALL]` 8 行) + RULE-MR-DIAG-001 沉淀(未来 MR 诊断工作流) + 运行时/主项目版本漂移合并对齐 | 27 条(不变) | 已发布,保留 |
| **v3.3.1** | **RULES.md 第五章 5.1-5.5"防空转循环机制"**(2026-08-13 新增)纳入版本号 + **全局 AGENTS.md 顶部版本号** v3.2.1→v3.3.0 漂移修复 + **多源终止信号**(全局"二点五"段 + F 档 `[COVER-ALL]` hook + 项目根"探针"段)未给优先级冲突显式化;沉淀 **RULE-LOOP-001**(死循环 = 三套结尾格式互不引用优先级 + 第五章未入版本号 + 死循环未沉淀 RULES-TREE) | 27 条(不变) | 已发布,保留 |
| **v3.4.0** | **MINOR: + 准则 28·跨会话沉淀**(R2/R5/R10/R19 子项强化);三文件 + RULES-TREE 同步;沉淀 RULE-V340-001 | **28 条** | 已发布,保留 |
| **v3.4.1** | **PATCH: 本会话沉淀 + 工具化同步**(不新增原则,28 条不变) — RULE-DIRECT-DO-001(v1.0 + v1.1 不漏 meta 标签 + C 子任务粒度);RULE-IMPORT-RULES-TREE-001(沉淀 ↔ 向量 ↔ 语义搜索 端到端打通);向量同步脚本(4 步包装:备份→解析→重建→自动验证,exit 0/1);规则审计脚本(扫描 ## 6+## 7,实测触发率 97%);修复 13 条 ## 6 RULE 被早期 regex 漏入库的缺陷 | **28 条**(不变) | 已发布,保留 |
| **v3.4.2** | **PATCH: RULES.md 新增"## 六、编码操作纪律"板块**(借鉴 super-code + Ponytail:优先级排序 / 简化阶梯 / 反向守护 / 输出模板 / 生成纪律 / guardrail);RULE-CODING-001 沉淀;28 条不变 | **28 条**(不变) | 已归档 |
| **v3.4.3** | **PATCH: 运行时副本三重漂移修复**(`tuomin/eight-honors-shames-runtime/RULES.md` 标题「二十六条」→「二十八条」 + 顶部 v3.3.0→v3.4.3 + 2.1/2.3 索引表 RULE-LOOP-001「❌ 待沉淀」→「✓ 已沉淀 L1175」 + 附录 E/F 24→28);**RULE-LOOP-002 对称检查 5→6 文件**;附录 E「20 字真言」验证闭环(20 个词条);RULE-LOOP-004 沉淀 | **28 条**(不变) | 已归档 |
| **v3.4.4** | **MINOR: 双层 skill 架构 + 反漂移硬话术** — 1 主持续 + 6 子 one-shot skill(`eight-rules` + `-review`/`-audit`/`-acceptance`/`-benchmark`/`-help`/`decision-annotation`);`hooks/index.js` 加 `buildEightRulesHint(mode)` 函数 + 双层注入(`onSessionStart` + `onBeforeAgentStart`);npm test **34/34 PASS**(`buildEightRulesHint` 新 7 + 原 27);jshgd 教程同步(`pi-eight-honors-shames-教程` v1.1.1→**v1.4.4**, 加 §4.9 节 +123 行 + 关键决策 #13/14/15 + 踩坑 8);7 个 skill 文档在 `skills/eight-rules*/`;**RULE-EIGHT-RULES-SKILLS-001** 沉淀于 RULES-TREE.md L3793;Ponytail 5-tag 字典 2 个独有(`drift`/`unsafe`);诚实声明:benchmark 仅设计 + demo(n=1),任何 "省 X%" 断言 = 禁止。 | **28 条**(不变) | 已 revert(错绑 mr.exe) |
| **v3.4.5** | **PATCH: 方法树 skill 套件重新绑定到 RULES-TREE 7 段元工作流沉淀范式** — v3.4.4 首版错绑到 lsx-mp-rust `mr.exe` 工具链(commit bfad0bc,已 revert d6283ea);本版改为 RULES-TREE 7 段沉淀范式:7 个子档 `method-tree` + `-help` + `-pattern` + `-write` + `-show` + `-publish` + `-feedback`(每个 30-140 行);`hooks/index.js` 加 `buildMethodTreeHint(mode)` 函数(`onSessionStart` + `onBeforeAgentStart` 双层与 `buildEightRulesHint` 并列注入);`hooks/method-tree-hint.test.js` 7 用例(off/full/lite/ultra/3 关闭/4 档枚举/未知档兜底);8 个 test 全过(eight-rules 7/7 baseline + method-tree 7/7 新);沉淀 **RULE-METHOD-TREE-001** 于 RULES-TREE.md 末尾(替代 v3.4.4 的 RULE-METHOD-TREE-SKILLS-001);八荣八耻主档"平行体系"段同步指向 C 体系;备份到 `_recycle_bin/20260813-201701-pre-method-tree-rework/`(双保险) | **28 条**(不变) | 已发布,保留 |
| **v3.4.6** | **MINOR: 方法树 daemon 三件套复用 + mtMode 持久化(env > 持久 > 默认)+ RULES-VERSION 同步协议** — `SUBSYSTEMS` 注册表 + `appendLogFor/tailLogFor/logFileFor` 平展 API;`hooks/index.js` `mt_` 字段平行持久化(`mtInstanceId`/`mtStartedAt`/`mtLastHeartbeat`/`mtHeartbeats`/`mtMode`)+ `syncMtMode()` 6 调用点替换(env 实时覆盖 + transition 自动落 `mt_mode_changed` log);`scripts/eight-rules-status.js` 重构为两段式 box(📜 八荣八耻 daemon · 🌳 方法树 daemon 同框);npm test **54/54 PASS**(原 47 + mt 7)。沉淀 **RULE-METHOD-TREE-DAEMON-001 + RULE-MT-MODE-PERSIST-001 + RULE-VERSION-SYNC-V346-001 + RULE-VERSION-DRIFT-CHECK-001** 于 RULES-TREE.md | **28 条**(不变) | 已发布,保留 |
| **v3.4.7** | **PATCH: 沉淀 RULE-LOOP-007 — chat.py 在 Windows bash 跑 stdin 喂中文对话,read 工具读 `chat_log.txt` 看 — 必须 stdin + stdout 双向 reconfigure**; auto-added by `check-version-drift.js --fix`(RULES-TREE.md L4210) | **28 条**(不变) | 已归档 |
| **v3.4.8** | **PATCH: 沉淀 RULE-LOOP-008 — thinking 段规则引用膨胀触发器 + 用户停止后无 termination signal** — 8h 自驱循环量化证据(扇出比 4.78× + 思考段 77 次引用 + 「本轮不是空转」34 次自检失效);`check-version-drift.js` 装好 + `package.json#check` 加 `npm run check:drift` + `.githooks/pre-commit` 阻断 commit;沉淀 **RULE-COMPREHENSIVE-DRIFT-CLOSURE-001**(7 类失守一次补齐 + 22 漂移归零 + 反哺脚本 Bug 修复);npm test **66/66 PASS** | **28 条**(不变) | 已归档 |
| **v3.4.9** | **PATCH: 准则 9「不搞破坏」增补敏感数据保护 sub-clauses(让准则 9 能够使用)** — `RULES.md` L204 + L797 表行 + L851 表行 同步新增「**不显示** / **不写入** / **不在命令里用**」三大块 + 「替代三件套:env 引用名 + `set +o history` + `.env` 加 `.gitignore`」+ 检测反例 r10 沉淀路径;28 条原则数不变;npm test 66/66 PASS;沉淀 **RULE-IX-SENSITIVE-DATA-001** | **28 条**(不变) | 已发布,保留 |
| **v3.4.10** | **PATCH: pre-commit hook 升级(2 段门禁 = 漂移检测 + 敏感数据 grep)+ RULE-IX-SENSITIVE-DATA-001 实战案例沉淀** — `.githooks/pre-commit` 加 secret scan(扫 `git diff --cached`,5 类标准 secret 模式:`sk-` / `pk_live_` / `-----BEGIN` / `[A-Z_]+_API_KEY=[^${ ]+` / `Bearer`)+ 命中即阻断 commit + 列 ≤5 行样本 + 处置清单;npm test 66/66 PASS;备份 `_recycle_bin/20260813-190500/`(RULES-TREE + RULES-VERSION + pre-commit 3 件) | **28 条**(不变) | 已发布,保留 |
| **v3.4.11** | **PATCH: 勘误 — v3.4.9/v3.4.10 误判 OpenAI → 真实是 MiniMax 平台 key(8 家端点探测确认 `api.minimaxi.com` 返回 HTTP 200,模型 MiniMax-M3/M2.7/M2.7-highspeed); + 新增 `docs/minimax-api-usage.md`(使用说明 endpoint/auth/curl/Python/Node.js/故障排查);npm test 66/66 PASS;28 条结构不变;**注:本会话原拟 amend(选项 A),但 rebase 撞 Vim 恢复崩溃,改追加勘误 commit(选项 B 改良),不动 git 历史** | **28 条**(不变) | 已发布,保留 |
| **v3.4.12** | **PATCH: API key 状态标记基础设施** — `.env` 内每条 key 上方加 inline 状态注释(`status=✅ verified_provider / rotate_required / verified_at / next_check`)+ `.env.STATUS.json` sidecar(只含 prefix+suffix + 端点 + 模型,**无 secret**)+ `scripts/probe-env-apis.js`(扫 `_API_KEY/_TOKEN/_SECRET` 等模式 → 8 家 curl 探测 → 只显示 maskValue → 写 sidecar)+ `npm run probe:env` 命令 + `tests/probe-env-apis.test.js` 6 用例;npm test **72/72 PASS**(原 66 + 6);沉淀:**RULE-IX-001 演进** = 不光"不显示 secret",还得"追踪已用 key 的状态" | **28 条**(不变) | 已发布,保留 |
| **v3.4.13** | **MINOR: 双副本追平(运行时副本 v3.4.5 → v3.4.13,7 个 PATCH 一次性真实追平,非纸面追平)** — 真实追平:① 备份 `_recycle_bin/20260814-132552-pre-v3.4.13-runtime/`(12 件)② 6 文件复制 + chmod:`.githooks/pre-commit` / `scripts/eight-rules-status.js` / `scripts/probe-env-apis.js` / `scripts/check-version-drift.js` / `docs/minimax-api-usage.md` / `tests/probe-env-apis.test.js` ③ npm scripts 加 4 个:`status` / `check:drift` / `check:drift:fix` / `probe:env`,`check` 命令末尾追加 `npm run check:drift` ④ `hooks/index.js` 188 行 v3.4.6 版替换(mtInstanceId/mtStartedAt/mtLastHeartbeat/mtHeartbeats/mtMode + syncMtMode + 4 log 事件)⑤ `src/runtime-log.js` 95 行 v3.4.6 版替换(SUBSYSTEMS 注册表 + appendLogFor/tailLogFor/logFileFor + DEFAULT_MT_MODE + resolveMtMode)⑥ 4 文档顶部 + 历史表 + 时间序表 3 处同步:RULES.md / AGENTS.md / RULES-VERSION.md / RULES-TREE.md ⑦ RULES-TREE.md 加 10 条 RULE(LOOP-007/008 + DAEMON/METHOD-TREE-DAEMON/MT-MODE-PERSIST/VERSION-SYNC-V346/VERSION-DRIFT-CHECK/COMPREHENSIVE-DRIFT-CLOSURE/IX-SENSITIVE-DATA + 实战案例)⑧ 沉淀 RULE-DUAL-COPY-CATCH-UP-001⑨ npm test **47/47 PASS** | **28 条**(不变) | 已发布,保留 |
| **v3.4.14** | **PATCH: 输出格式显式标签 RULE** — 招认“沉淀/使用工作方法不见了”根因 = thinking vs output 脱节;4 件强制:每轮 ≥ 2 个 `[按 RULE-XXX]` 标签 + 每次沉淀时 `[沉淀 RULE-XXX-XXX]` 标签 + 末行 `[COVER-ALL]` 8 行兑底 + thinking 触发器自动跳 RULES-TREE;28 条结构不变;**沉淀 RULE-OUTPUT-LABEL-001** 于主 + 副本 RULES-TREE.md 同步 | **28 条**(不变) | 已发布,保留 |
| **v3.5.0** | **MINOR: 28 → 29 条;新增准则 29·用户感知守护** — 把 RULE-OUTPUT-LABEL-001 从 R10 子项升级为独立原则;补全型准则触发器自动跳 RULES-TREE 不被动等指令;28→29 条结构变更;**沉淀 RULE-USER-PERCEPTION-GUARD-001** 于主 + 副本 RULES-TREE.md 同步 | **29 条**(+1) | 已发布,保留 |
| **v3.5.1** | **PATCH: 27 条独立 RULE 沉淀(本批首 5 条 R22/R3/R13/R17/R25)** — 系统性修复 28 条准则全无独立 RULE 段的问题;每条独立段:触发场景/核心纠正/4 件定义/量化证据/下次如何避免/覆盖关系;npm test 47/47 PASS;**沉淀 RULE-22-HELP-NO-PUSHBACK-001 / RULE-3-COMMUNICATION-CONFIRM-001 / RULE-13-CODE-STANDARDS-001 / RULE-17-USER-COMMS-001 / RULE-25-ACCOMPANY-TO-END-001** 于主 + 副本 RULES-TREE.md 同步 | **29 条**(不变) | 已发布,保留 |
| **v3.5.2** | **PATCH: 22 条独立 RULE 沉淀(剩余 22 条全量一次完成)** — R1/R2/R4/R5/R6/R7/R8/R9/R10/R11/R12/R14/R15/R16/R18/R19/R20/R21/R23/R24/R26/R27/R28 全部独立段;系统性补全 28 条准则 7 段标准(触发/纠正/定义/证据/避免/覆盖)+ 触发器自动跳机制;npm test 47/47 PASS;双副本 RULES-TREE.md 同步 | **29 条**(不变) | 已发布,保留 |
| **v3.5.3** | **PATCH: 沉淀 RULE-USER-RAW-KEY-REPEAT-001(防用户重复贴 raw key)** — 5 件强制(masks 显示 / 不擅自写 / 不 echo 完整 / 主动 grep RULES-TREE 已知端点 / 主动补测该端点);本会话触发场景:3 次贴 raw key 误测 3 端点全 401 = 浪费 6 端点 curl + RULES-TREE L4669 minimax 端点未主动查;npm test 47/47 PASS;双副本 RULES-TREE.md 同步 | **29 条**(不变) | 已发布,保留 |
| **v3.5.4** | **PATCH: QClaw/OpenClaw 适配器(第 8 个适配目标)** — `scripts/build-adapters.js` 新增 qclaw 目标生成 always-load skill 模板(metadata.openclaw.always: true + 21 条精简命令式 + 指针);部署 `~/.qclaw/skills/qclaw-eight-honors/` + openclaw.json 注册 main/mr-llm;npm test 48/48 PASS;**沉淀 RULE-QCLAW-ADAPTER-001** | **29 条**(不变) | 已发布,保留 |
| **v3.5.5** | **PATCH: token-slim 001/002(用户报 token 消耗暴涨)** — ① settings.json 排除 `~/.agents/skills`(2022 个 skill description 全量注入 ≈358KB/请求 → 排除后 -87%,pi 0.84.1 `!` 排除语法已验证)② compaction 显式化 + 会话卫生脚本 `scripts/session-health.py` ③ RULES.md 会话首读改前 120 行索引(81KB→~6KB)④ [COVER-ALL] 8 行输出先分级后完全取消(用户指令,防空转由第五章 A 终止标记兑底);三文件 + 全局 AGENTS.md 同步 + README/适配器追平;**沉淀 RULE-TOKEN-SLIM-001/002** 主 + 副本 | **29 条**(不变) | **当前最新** |

---

## 三、升级检查清单

### 升级前必做

- [ ] **备份三个文件**到 `_recycle_bin/<timestamp>-rules-<new-version>/`
- [ ] **备份 .imported_marx.json** / .md 等运行时产物(若升级触发重建)
- [ ] **写**预览/方案给用户确认(不擅自先斩后奏)
- [ ] **git status** + **git diff** 核对无意外修改
- [ ] 明确**新版本位**(MAJOR/MINOR/PATCH)与**变更摘要**

### 升级中必做

- [ ] **RULES.md**:顶部 v 重构说明段 + 准则主体内容(若新增原则)
- [ ] **AGENTS.md**:顶部注记 + 精简版 26 条(若新增原则,需 +1)
- [ ] **RULES-TREE.md**:新增 RULE 段(若新沉淀)
- [ ] **本文件 RULES-VERSION.md**:更新"当前版本对照表" + 新版本号

### 升级后必做

- [ ] **grep -cE** 旧版本号仅在版本历史区可命中(header + 二、当前版本对照表 区不得出现,避免混用)
- [ ] **grep -cE** 新版本号应在主文件 header + 二、当前版本对照表区都出现 ≥1 次
- [ ] **三文件总行数**变化符合预期
- [ ] **回滚命令就绪**:`cp _recycle_bin/<timestamp>/<file> <原路径>`
- [ ] 跑一次 `query.py` 或类似 smoke test,确认八荣八耻加载不破

---

## 四、维护触发

| 触发事件 | 动作 |
|---|---|
| 新增原则(每条) | MAJOR 评审 → 多数情况升 MINOR |
| 调优/反哺/同步(不破坏结构) | 升 PATCH |
| 重新分组/拆分/合并 | 升 MAJOR + 1,MINOR/PATCH 归 0 |
| 用户问"现在八荣八耻到多少版本了" | 先看本文件,再答 |
| 任何`v3+1` / `v3+2` / `v3+2.1` 混用**再次出现** | 必读本文件"禁用格式"段,改回 SemVer |

---

## 五、本文件元信息

- **创建时间**:2026-08-11
- **创建者**:本会话(v3.2.1 升级收尾)
- **创建原因**:本会话升级时发现"v3+2.1 / v2.3 / 2026-08-11 v2.3" 5 种格式混用,违反 RULES.md 准则 11(贴规范)+ 准则 7(精确)
- **下次维护**:任何 v3.3.1 / v4.0.0 升级时

---

## 六、版本历史(完整)

| 版本 | 日期 | 变更摘要 | 备份位置 |
|---|---|---|---|
| v3.0.0 | 2026-08-11 早 | 22→24 条重排(4 组) | git 历史 |
| v3.1.0 | 2026-08-11 | + 准则 9 + 升级准则 6(L2) | `_recycle_bin/20260811-2250-rules-update-v3+1/` |
| v3.2.0 | 2026-08-11 | + 准则 10 + RULE-METADATA-EVIDENCE(L2) | `_recycle_bin/20260811-20260811-2049-rules-update-v3+2/` |
| v3.2.1 | 2026-08-11 | 算法调优反哺 + 三文件版本统一 + SemVer 规范化 | `_recycle_bin/20260811-2126-rules-semver/` |
| v3.2.2 | 2026-08-11 | 新增准则 27(稳扎稳打分分层判断) + R25/R26 补齐到精简版 + 语义版本跳 MINOR | `_backups/RULES-TREE-pre-v3.2.2/` |
| v3.2.3 | 2026-08-12 | PATCH: LNN D 方案 + 算子家族代码化为 Python 包 + COVER-ALL 兑底算子(覆盖率 70.4%→100%) + 29 个单测全过 + 文档漂移修正 | `_recycle_bin/20260812-0130-rules-v3.2.3-pre-push/` |
| **v3.3.0** | **2026-08-12** | **MINOR: R8/R19 互引注记(破除重复度70-80%) + COVER-ALL 兑底算子实装 + AGENTS.md F 档 hook + RULE-MR-DIAG-001 沉淀 + 运行时/主项目版本漂移合并对齐** | **`_recycle_bin/20260812-1230-rules-v3.3.0/`** |
| **v3.4.0** | **2026-08-13** | **MINOR: + 准则 28·跨会话沉淀(R2/R5/R10/R19 子项强化) + 三文件 + RULES-TREE 同步 + 沉淀 RULE-V340-001** | **`_recycle_bin/20260812-145452-rules-v3.4.0/`** |
| **v3.4.1** | **2026-08-12** | **PATCH: 本会话沉淀 + 工具化同步**(RULE-DIRECT-DO-001 v1.1 + RULE-IMPORT-RULES-TREE-001 + sync_rules_to_vector.py + 规则审计脚本 + regex 缺陷修复 + 端到端 4 步自动化) | **`_recycle_bin/20260812-2148-rules-v3.4.1/`**(待归档) |
| **v3.4.2** | **2026-08-12** | **PATCH: RULES.md 新增"## 六、编码操作纪律"板块**(super-code 优先级 + Ponytail 守护清单)+ RULE-CODING-001 沉淀 | **`_recycle_bin/20260812-codingsync-rules-v3.4.2/`**(待归档) |
| **v3.4.3** | **2026-08-13** | **PATCH: 运行时副本条数/版本/沉淀状态三重漂移修复** + RULE-LOOP-002 清单扩到 6 文件 + RULE-LOOP-004 沉淀 | **`_backups/RULES.md.bak-20260813-191245-before-28count-fix`** + **`_backups/RULES-TREE.md.bak-20260813-191245-before-loop004`** |
| **v3.4.4** | **2026-08-13** | **MINOR: 双层 skill 架构(1 主持续 + 6 子)+ 反漂移硬话术 `buildEightRulesHint(mode)`**;npm test 34/34 PASS; **已 revert(错绑 mr.exe)** | commit bfad0bc(已 revert d6283ea) |
| **v3.4.5** | **2026-08-13** | **PATCH: 方法树 skill 套件重新绑定到 RULES-TREE 7 段沉淀范式**(v3.4.4 错绑 revert 后的修复版) + 八荣八耻 daemon 三件套(B1 心跳 state + B2 JSONL log + B3 status CLI);npm test 41/41 PASS;沉淀 RULE-METHOD-TREE-001 + RULE-EIGHT-RULES-DAEMON-001 | **`_recycle_bin/20260813-161935/`** + **`_recycle_bin/20260813-201701-pre-method-tree-rework/`** |
| **v3.4.6** | **2026-08-13** | **MINOR: 方法树 daemon 三件套复用八荣八耻 + mtMode 持久化(env > 持久 > 默认)+ RULES-VERSION 同步协议**;SUBSYSTEMS 注册表 + appendLogFor 等 API;npm test 54/54 PASS;沉淀 RULE-METHOD-TREE-DAEMON-001 + RULE-MT-MODE-PERSIST-001 + RULE-VERSION-SYNC-V346-001 + RULE-VERSION-DRIFT-CHECK-001 | **`_recycle_bin/20260813-162600/`** + **`_recycle_bin/20260813-163300/`** |
| **v3.4.7** | **2026-08-13** | **PATCH: 沉淀 RULE-LOOP-007 — chat.py Windows bash stdin 编码修复**;auto-added by `check-version-drift.js --fix` | (auto-fix) |
| **v3.4.8** | **2026-08-13** | **PATCH: 沉淀 RULE-LOOP-008(thinking 段规则引用膨胀触发器 + 用户停止后无 termination signal)** + 装 `check-version-drift.js` + 装 `.githooks/pre-commit` + 7 类失守一次补齐 + 22 漂移归零;npm test 66/66 PASS;沉淀 RULE-COMPREHENSIVE-DRIFT-CLOSURE-001 | `_recycle_bin/20260813-222233-rule-loop-008-backup/` |
| **v3.4.9** | **2026-08-13** | **PATCH: 准则 9 增补敏感数据保护(让准则 9 能够使用)** — `RULES.md` + 运行时副本 双同步「不显示 / 不写入 / 不在命令里用」 三块 + 替代三件套;npm test 66/66 PASS;沉淀 RULE-IX-SENSITIVE-DATA-001 | **`_recycle_bin/20260813-184500/`** |
| **v3.4.10** | **2026-08-13** | **PATCH: pre-commit hook 升级(2 段门禁 = 漂移检测 + 敏感数据 grep)+ RULE-IX-SENSITIVE-DATA-001 实战案例沉淀** — `.githooks/pre-commit` 加 secret scan(5 类标准模式) + 命中即阻断 commit | `_recycle_bin/20260813-190500/` |
| **v3.4.11** | **2026-08-13** | **PATCH: 勘误 — v3.4.9/v3.4.10 误判 OpenAI → 真实是 MiniMax 平台 key**; + 新增 `docs/minimax-api-usage.md` | _(与 v3.4.10 同 commit / 或追加勘误 commit)_ |
| **v3.4.12** | **2026-08-13** | **PATCH: API key 状态标记 — `scripts/probe-env-apis.js` 8 家探测 + `.env.STATUS.json` sidecar**;npm test 72/72 PASS | _(主线仓库)_ |
| **v3.4.13** | **2026-08-14** | **MINOR: 双副本追平(运行时副本 v3.4.5 → v3.4.13,7 个 PATCH 一次性真实追平)** — 6 文件复制 + 4 npm scripts + hooks/index.js 188 行 v3.4.6 + src/runtime-log.js 95 行 v3.4.6 + 4 文档顶部 + RULES-TREE 加 10 RULE + RULE-DUAL-COPY-CATCH-UP-001 沉淀;npm test 47/47 PASS | **`_recycle_bin/20260814-132552-pre-v3.4.13-runtime/`** |
| **v3.4.14** | **2026-08-14** | **PATCH: 输出格式显式标签 RULE** — 招认“沉淀/使用工作方法不见了”根因 = thinking vs output 脱节;4 件强制 + 触发器自动跳;沉淀 RULE-OUTPUT-LABEL-001 双副本同步 | **`_recycle_bin/20260814-142644-pre-v3.4.14-output-label/`** |
| **v3.5.0** | **2026-08-14** | **MINOR: 28 → 29 条;新增准则 29·用户感知守护** — RULE-OUTPUT-LABEL-001 升级为独立原则;多准则协同保护(R10 + R15 + R22 + R28);沉淀 RULE-USER-PERCEPTION-GUARD-001 双副本同步 | **`_recycle_bin/20260814-144545-pre-v3.5.0-r29/`** |
| **v3.5.1** | **2026-08-14** | **PATCH: 27 条独立 RULE 沉淀(本批首 5 条 R22/R3/R13/R17/R25)** — 系统性修复 28 条准则全无独立 RULE 段;每条独立段 7 段标准(触发/纠正/定义/证据/避免/覆盖);沉淀 5 条独立 RULE 双副本同步 | **`_recycle_bin/20260814-162250-pre-v3.5.1-27rule-sediment/`** |
| **v3.5.2** | **2026-08-14** | **PATCH: 22 条独立 RULE 沉淀(剩余 22 条全量一次完成)** — R1/R2/R4/R5/R6/R7/R8/R9/R10/R11/R12/R14/R15/R16/R18/R19/R20/R21/R23/R24/R26/R27/R28 全部独立段;系统性补全 28 条准则 7 段标准 + 触发器自动跳;双副本 RULES-TREE.md 同步 | **`_recycle_bin/20260814-162636-pre-v3.5.2-22rule-batch/`** |
| **v3.5.3** | **2026-08-14** | **PATCH: 沉淀 RULE-USER-RAW-KEY-REPEAT-001(防用户重复贴 raw key)** — 5 件强制 + 触发器主动跳;本会话 3 次贴 raw key 误测 3 端点全 401 = 浪费 6 端点 curl;双副本 RULES-TREE.md 同步 | **`_recycle_bin/20260814-173248-pre-v3.5.3-rawkey-rule/`** |
| **v3.5.4** | **2026-08-14** | **PATCH: QClaw/OpenClaw 适配器(第 8 个适配目标)** — build-adapters.js qclaw 目标 + 部署 ~/.qclaw/skills;本副本首发 | **`_recycle_bin/`(v3.5.4 发布记录)** |
| **v3.5.5** | **2026-08-14** | **PATCH: token-slim 001/002** — settings.json 排除全局 skills(-87% 注入)+ compaction + 会话卫生脚本 + RULES 首读前 120 行 + [COVER-ALL] 输出取消 + README/README_EN/适配器追平;双副本 RULES-TREE.md 同步 | **`_recycle_bin/pre-v3.5.5-readme-20260814-222158/`** |
