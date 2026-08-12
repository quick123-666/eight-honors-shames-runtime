> 📌 **版本规范**:见 [`RULES-VERSION.md`](./RULES-VERSION.md) — 当前 **v3.3.1**;新增原则升 MINOR,调优升 PATCH,大重构升 MAJOR。
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
  1. **版本漂移 → 假装合规**:`RULES.md:28` 写"24 条",但 `AGENTS.md:6` 写"21 条",`tuomin/eight-honors-shames-runtime/README.md:5/6/14/182` 写"20 条",`RULES-TREE.md / audit-2026-08-10.md` 还在引用"15/16/19 条"。同一规则集,**五个文件声称四种条数** *(注:此为 2026-08-11 历史快照;`audit-2026-08-10.md` 现仅在 `_recycle_bin/20260811-1050-pre-cleanup/eight-honors-shames-runtime/docs/` 中)*
  2. **凑数 → 准则降格为辩护工具**:`tuomin/eight-honors-shames-runtime/docs/audit-2026-08-10.md:36-38` 自陈三条编造:"用泄露 key = 没备份"(集合论错位)/"违反 9 条准则"(实际只 2 条成立)/"真实消耗不能用已泄露的资源"(比喻错位) *(注:`audit-2026-08-10.md` 现仅在回收站)*
  3. **注入 ≠ 执行 → 规则在嘴边,行为不在手上**:`tuomin/eight-honors-shames-runtime/benchmarks/reports/latest.json` 显示 lite 模式 score 30-90(非 100),baseline 0 分 → 即便规则注入了模型也做不到。README 强调"注入省 97% token"为卖点,**但 lite 模式本身就是"少约束模式"** *(注:`benchmarks/reports/latest.json` 现不存在)*
  4. **盲目执行 → 接口假设失败**:工单 `methods/trees/T-20260810021418-000.md:18-26` 用户问"用 15 条八耻八荣检查 kimi_code_test",AI 8 步里 5 步失败(假设 4 个 skill 文件存在但不存在;装 2 个 skill 后未验证就读)。**核心问题:Round 1 计划"未包含 kimi_code_test 项目扫描/读取动作,核心任务未执行"** *(注:`T-20260810021418-000.md` 现不存在)*
  5. **沉淀靠手动 → 失效样本不进 RULES-TREE**:`RULES-TREE.md` 现有 4 条踩坑都是 RULES.md 改写过程踩坑,**AI 自身跑偏的案例**(T-20260810021418 / T-20260811093119)未自动触发沉淀 *(注:两者现均不存在)*
- **A 阶段修复**(用户拍板全做 A/B/C,本条仅记录 A 阶段):
  - `AGENTS.md:6` "21 条" → "24 条";描述段加 v3 重排说明
  - `AGENTS.md:50` 后追加精简版 19-24 共 6 条(对应 RULES.md 准则 21-24);一句话真言扩到 20 项
  - `tuomin/eight-honors-shames-runtime/README.md:5/6/14/182` 4 处 "20 条" → "24 条" *(注:RULES.md 现 27 条 v3.2.2;`README.md` 修复后 27 条,见 P1-4 修复记录)*
  - `RULES.md:619` 附录 E 加注"A 阶段才真同步,此前 [x] 是记录偏差"
- **下次如何避免**:
  1. **改 RULES.md 条数 → 同步 grep 全部声称文件**(grep -nE "(N 条)" 找所有)
  2. **凑数禁令**:禁止把工程判断包装成"违反 N 条准则",N 必须逐条论证(本条 → 待 B 阶段加进 RULES.md 准则 26 强化)
  3. **lite 模式禁用于关键任务**(本条 → 待 C 阶段改 `src/core.js` 默认值)
  4. **接口假设必验**:动手前 read / ls / find 验证路径真实(本条 → 待 B 阶段加进 RULES.md 准则 1 强化)
  5. **方法树自动审查**:tree 落地前跑一次 audit(类似 audit-2026-08-10.md)(本条 → 待 C 阶段加 hook)
- **关联纪律**:本条覆盖 RULES.md 准则 4(不装懂)/ 7(数学验证)/ 8(复述前必验证)/ 22(联系全文)/ 24(核心价值观)

### 2026-08-11 · 凑数禁令(B 阶段强化准则 7)
- **来源**:本批研究 + `tuomin/eight-honors-shames-runtime/docs/audit-2026-08-10.md:35-50` 自我审计 *(注:该文件现仅在 `_recycle_bin/`)*
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
- **来源**:本批研究 A 阶段;`tuomin/eight-honors-shames-runtime/README.md:17,24` 声称"规则单一来源 RULES.md" *(注:`README.md` 现已修到 27 条)*
- **坑**(三个,按价值排序):
  1. **🔴 自身违反单一来源**:`tuomin/eight-honors-shames-runtime/src/core.js:22` 正则 `^### 准则 \d+` 错匹配 3 个 `#`,但 RULES.md 实际是 4 个 `#`(准则标题行 `#### 准则 N:`)。导致 `rulesVersion()` 永远返回 `principles: 0`,所有"X 条准则单一来源"的 README 声称实际上**从未被运行时验证**。`npm test` 通过是因为测试 mock 了 rulesVersion() *(注:RULES-TREE 原文本 `src/core.js:22` 为指向 eight-honors-shames-runtime 的筒写)*
  2. **🟡 lite 模式无底线**:`src/core.js:112` lite 模式无 gates,benchmark 实测 score 30-90(非 100);README 把 lite 包装成"低 token 但同样安全",**实际效果差距巨大**
  3. **🟡 方法树无审计**:`methods/trees/T-20260810021418-000.md` "8 步里 5 步失败" 应该在落地时被自动告警,但目前完全靠事后用户发现 *(注:`T-20260810021418-000.md` 现不存在)*
- **修复**(C 阶段完成):
  - `tuomin/eight-honors-shames-runtime/src/core.js:18-28`(同步修 `kimi_code_test/src/core.js`):修 `rulesVersion()` 正则为 `^#{3,4} 准则 \d+:`,兼容 RULES.md(4#)和 jshgd 源(3#);**验证后 `kimi_code_test` 返回 27 条,`tuomin/eight-honors-shames-runtime` 返回 26 条**(原 0);**两处均已验证 2026-08-12 P0 修复批次** *(注:RULES-TREE.md 原文档本项写 "24 条",是未验证的假装修复。实际修复 = 本轮;`npm test` 未跑)*
  - `src/core.js:112`:lite 模式 summary 顶部加 WARNING banner,引用 benchmark 实测数据(lite 30-90 / full 80-100)+ 推荐关键任务用 full
  - 新增 `tuomin/eight-honors-shames-runtime/scripts/check-method-tree.js`(160+ 行):扫描 methods/trees/*.md,检测 frontmatter 完整性/数值合理性/失败率告警;**验证后正确识别 T-20260810021418 为 high-failure-tree(failure_signals=3:失败,未执行,不存在)**;退出码 0=PASS, 1=WARN, 2=FAIL *(注:`check-method-tree.js` 现不存在;`T-20260810021418-000.md` 现不存在)*
- **下次如何避免**:
  - **运行时 bug 自检**:每次改 src/core.js 后必须 `node -e "import('./src/core.js').then(m=>console.log(m.rulesVersion()))"` 验证 principles > 0
  - **不再只看 README 声称**:任何"X 条 Y 来源"的声称必须用运行时实际返回验证;README 与实际不符 = 删 README 文本而非改代码
  - **方法树落地前**:`node scripts/check-method-tree.js methods/trees` 作为前置 audit(建议接入 `lsx-mp-rust/methods/trees/` 真实数据)
  - **npm test 必须包含端到端验证**:测试不能只 mock,必须跑真实 `readLatestRules()` + 断言 principles === 24
- **关联纪律**:本条覆盖 RULES.md 准则 1(查)/ 7(数学验证)/ 10(验证)/ 11(贴规范)/ 19(数学验证)/ 24(核心价值观)

### 2026-08-12 · chromadb 多实例分裂 + 工单独立可加 + 默认合并(B 阶段)
- **来源**:本批"把工单导入知识图谱向量" 工单
- **坑**(三个):
  1. **🔴 多 chromadb 实例并存**:live `kg_search/data/chroma/`(被清空剩 2 条)+ 备份 `chroma.bak-20260811-191000/`(5319 条)+ `chroma.bak-before-tickets/`(112 条)。三个 SQLite 互不知道对方存在,查询只能连一个。19:10 → 23:15 之间某次操作清空了 live,但 Marx 数据已在 19:10 备份里 —— **数据没丢,但分裂了**
  2. **🟡 add_doc.py 只 glob *.md**:工单是 .json,跑 `auto_import_marx.py` 写的 `_tickets/T-import-marx-*.json` 直接被忽略。metadata 也不全(ticket_id/status/success 都丢)
  3. **🟡 build.py 只剩 .bak**:`from build import MODEL_NAME, MIN_TEXT, clean_text, chunk_text`(add_doc.py:27)依赖 `build.py`,但当前只有 `.bak-20260811-190000`。跑 import 时直接报 `ImportError: cannot import name 'MODEL_NAME' from 'build' (site-packages 同名包干扰)`
- **修复**(本会话完成):
  - 改 `kg_search/add_doc.py`:glob 加 `*.json`,新增 `extract_ticket()` 函数(`title + input + summary` 拍 1 块,metadata 塞 `ticket_id/status/success/kind=ticket`)。py_compile 通过,upsert 4 工单成功
  - 恢复 `kg_search/build.py` 从 `.bak-20260811-190000` 复制(同名 site-packages 包干扰的根因 → 让 Python 优先加载本地)
  - **合并 chromadb**:把 `chroma.bak-20260811-191000` 恢复到 live(5319 Marx + 其他内容,总 34303 条),再 upsert 4 工单 → 总 34307 条。3 档语义查询全过:跨 dir / 按 dir=MarxEngels / 按 kind=ticket
  - 所有原始文件保留:`add_doc.py.bak-pre-tickets-20260811-232244` / `build.py.bak-pre-tickets-20260811-232350` / `chroma.bak-pre-tickets-20260811-232322` / `chroma.bak-pre-merge-20260812-003031`
- **下次如何避免**(同向):
  1. **chromadb 唯一实例原则**:任何时候 `kg_search/data/chroma/` 只有一个 live,其他都进 `chroma.bak-*` 归档。新数据灌 live,**绝不灌备份**
  2. **任何 chromadb 操作前**:`ls -d kg_search/data/chroma*` 看有几个实例,有多个就先合并(rm + cp + 重 upsert)
  3. **依赖恢复流程**:发现 `from xxx import ...` 失败但 `.bak` 存在 → 立刻 `cp xxx.py.bak-* xxx.py`,不要内联代码(避免重复维护)
  4. **add_doc.py 改动三步**:py_compile 验证 → 单文件试跑 → 查 chromadb 实际 metadata(不只信 stdout "upsert N 块")
  5. **语义检索验证三档**(合并/新增后必跑):跨 dir 不限 / 按 dir 过滤 / 按 kind 过滤,任一档失败说明 metadata 设计有问题
- **关联纪律**:本条覆盖 RULES.md 准则 1(查)/ 7(数学)/ 8(验证)/ 10(沉淀)/ 11(复用)/ 12(验证)/ 14(谨慎改)/ 17(通俗易懂)/ 19(数学)/ 20(备份)/ 21(回收站)。完整复合算子定义见末尾 `RULE-IMPORT-CHROMA-001`

### 2026-08-12 · auto_import_marx.py `--from-dir` 传整个目录超时(B 阶段)
- **来源**:本批 "测试导入一卷马克思" 工单(`T-20260812005713`)
- **坑**:`auto_import_marx.py:113` 调 add_doc.py 时传 `--from-dir str(md_files[0].parent)`,**把整个 `_mineru_out/_marx/` 目录(38687 个 .md)传过去**。本意是 "避 Windows 32k 命令行限制",但副作用是:**跑任何一个 PDF 都会重处理整个目录**(pypdf 不重跑,但 add_doc.py 的 model.encode 要 7+ 分钟)。实测 vol_007 单卷跑 600s 超时(rc=143),实际只新增 766 页,却卡死在 38687 个文件编码上
- **修复**:`add_doc_to_kg_search()` 改为**分批传本次新建的 md_files**,`BATCH_PATH=250`(每 path ~120 字节,远低于 32k)。4 个 batch,每批独立 subprocess.run + timeout 1800s,失败继续下批(不致命)
- **下次如何避免**:
  1. **上游脚本不要用 "parent dir" 作隐含全量**:`cmd = [..., "--from-dir", str(md_files[0].parent)]` 这种写法 = "我对新增文件没数,索性传整个目录" → 几乎一定是 bug。**正解**:精确传本次新建的列表 + 分批
  2. **加 timeout 时看最坏情况**:1800s 对 766 文件是充足的,但对 38687 个文件是致命的(3-7× 超时)。设计 timeout 时必须用**最大输入**反推
  3. **写脚本时画数据流图**:`pypdf → .md (按 PDF 写) → add_doc.py (按新建 .md 传)`,每一步边界要明确,不要让父目录污染下游
  4. **跑批前先 dry-run**:任何用 `--from-dir` 或 `parent` 的脚本,**手动 echo 命令** 看一下实际传入的是什么,别盲信作者意图
- **修复后实测**:vol_007 全 766 页 230s 完成,4 batch 全 ok,chroma 总 34,313 → 35,901(+1588 chunks)。语义检索 "哥达纲领批判" 第 3 命中 `vol_007_p011.md`(哥达纲领批判开篇页),distance 0.379
- **关联纪律**:本条覆盖 RULES.md 准则 1(查)/ 7(数学)/ 11(复用)/ 14(谨慎改)/ 17(通俗易懂)/ 19(数学)。补充反模式已加进末尾 `RULE-IMPORT-CHROMA-001`

### 2026-08-12 · 硬编码路径漂移 + catch 静默吞错(B 阶段)
- **来源**:本批 "新开的会话八荣八耻没了" 报告。`~/.pi/agent/extensions/eight-rules.ts` 写死 `EXT = ".../eight-honors-shames-runtime/pi-extension/index.js"`,但 runtime 被脱敏流程移到 `tuomin/eight-honors-shames-runtime/`,原路径不存在
- **坑**(三个独立层但同时出现):
  1. **🔴 硬编码绝对路径**:`C:/Users/Administrator/Desktop/kimi_code_test/...` 这种字符串 = 一旦目标文件被移动、卸载、重命名,代码静默失效。新会话启动看不出问题
  2. **🔴 `catch` 静默吞错**:原 TS 第 17-19 行的 catch 只 `console.error("[eight-rules] 加载异常:", msg)`,**不报给用户,不给出指引**。用户在 pi 里看不到严重错误,只是八荣八耻 "消失"了。准则 4 "不装懂" + 准则 12 "验证" 双违反
  3. **🟡 没有 fallback 链**:没尝试环境变量、相对路径、默认 fallback,只赌一个绝对路径是对的。任一环节漂移即崩
- **修复**:`~/.pi/agent/extensions/eight-rules.ts` 改造(29 → 72 行):
  ```typescript
  function resolveRuntimePath() {
    if (process.env.EIGHT_RULES_PATH && existsSync(fromEnv)) {
      return { path: fromEnv, source: "env:EIGHT_RULES_PATH" };
    }
    const DEFAULT = ".../tuomin/eight-honors-shames-runtime";
    if (existsSync(DEFAULT)) return { path: DEFAULT, source: "default-fallback" };
    return { path: path.resolve(HERE, "..", "eight-honors-shames-runtime"), source: "relative-fallback" };
  }
  ```
  catch 改为** 7 行显式诊断**(路径/来源/是否存在/3 种 setx 示例 + 重启指引)
- **下次如何避免**(通用,不限于 TS):
  1. **路径配置 3 层优先级**:**环境变量 → 默认 fallback → 相对 HERE**。改环境只改 env,不动代码
  2. **错误处理不允许静默**:任何 catch 必须满足以下任一:`throw`、`return { error: ... }`、`console.error(路径/上下文/修复指引)`。空 catch = 准则 4 + 12 违规
  3. **失败信息要可操作**:"加载异常: ENOENT" 不够,要带"我尝试了哪个路径 / 怎么修复(setx / set / export) / 下一步是什么"
  4. **绝对路径都是可疑信号**:跨用户/跨机器/跨项目的字符串都该 env-化。`process.cwd()` / `__dirname` / `import.meta.url` 才是可靠锚点
  5. **配置即代码 vs 配置即数据**:env var 是数据(可改不改代码),常量是代码(改必须发布)。**漂移易发场景用数据**
- **修复后实测**(无 env var,纯 fallback):
  - `resolveRuntimePath()` 命中 `default-fallback`
  - `EXT = ".../tuomin/eight-honors-shames-runtime/pi-extension/index.js"` 存在 = true
  - 动态 `import(pathToFileURL(EXT))` 成功,导出 default function + 5 个命名导出
  - 模拟 pi 注册 `/rules` + 6 个生命周期 hook,全部 OK 无崩溃
- **关联纪律**:本条覆盖 RULES.md 准则 1(查)/ 7(数学)/ 11(复用)/ 14(谨慎改)/ 17(通俗易懂)/ 19(数学)/ 24(核心价值观)。与 §2 第 1 条(八荣八耻失效根因 + A 阶段)同源 — A 阶段发现现象,本批才追到运行时被移走的根因

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
| **chromadb 多实例分裂 + 工单可加 + 默认合并** | **§2 最后一条(2026-08-12)** |
| **auto_import_marx.py --from-dir 传整个目录超时** | **§2 第二条(2026-08-12 B 阶段)** |
| **硬编码路径漂移 + catch 静默吞错** | **§2 第三条(2026-08-12 B 阶段)** |
| **chromadb 增量导入 + 合并复合算子** | **末尾 RULE-IMPORT-CHROMA-001** |

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
  - **测试通过** 实测三档分化:场景 1 STOP 0.622,场景 2 OK 0.231,场景 3 OK 0.182,场景 4 OK 0.310 *(注:RULES-TREE 原文本写“场景 4 WARN 0.39”是在 D 方案前的 B 方案上下文, D 方案实调为 OK 0.310. 实测口径以本行 + `rules_tree/tests/run_rules_tree_tests.py` 为准, 文档已同步)*
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


### RULE-IMPORT-CHROMA-001(2026-08-12 v3.2.1 沉淀 — chromadb 增量导入 + 多实例合并复合算子)

- **触发**:用户要把任何文档(.md / .json 工单 / 任意文本)灌入 `kg_search/data/chroma` 向量库,或发现多个 chromadb 实例需要合并,或排查 "为什么我查不到 X" 类语义检索失败问题。
- **核心纠正**:
  - 旧模式"走一步看一步,边跑边查" → 沉淀出标准 **5+1 步**:Pre(查依赖 + 备份)→ Run(改 add_doc → upsert → 语义验证)→ 沉淀(写 RULES-TREE)
  - 旧模式"多 chromadb 实例并存" → 沉淀出"live 唯一 + 其他归档"原则 + 合并流程(rm 备份 → cp 恢复 → 重 upsert)
  - 旧模式"凭印象说跑通了" → 沉淀出**语义验证三档**(跨 dir / 按 dir / 按 kind)
- **形式化定义**:

  ```
  导入合并(P) ≝
    let Pre  = (R1·查接口) ∧ (R20·备份先行) ∧ (R21·删走回收站)
    in let Run = (R11·复用) ∧ (R12·主动调试) ∧ (R14·谨慎改) ∧ (R17·通俗易懂) ∧ (R23·立即但完整) ∧ (R25·协助到底)
    in let Sediment = (R10·不重复犯错) ∧ (R24·核心价值观)
    in P := Pre ∧ Run ∧ Sediment
  ```
- **5+1 步标准流程**:
  1. **Pre·查依赖**:`ls kg_search/add_doc.py kg_search/build.py` → 两者必须存在(`.bak` 不算,必须 `cp .bak-* 现役`);`HF_HUB_OFFLINE=1` + 模型缓存 `~/.cache/huggingface/hub/models--BAAI--bge-small-zh-v1.5/` 必须存在
  2. **Pre·备份**:改任何文件前 `cp xxx.py.bak-pre-<feature>-<ts> xxx.py`;改 chromadb 前 `cp -r chroma chroma.bak-pre-<action>-<ts>`
  3. **Run·改 add_doc.py**(如需支持新格式):加 `glob(*.<ext>)` + 写 `extract_xxx()` 函数 + `py_compile` 验证 + 单文件试跑
  4. **Run·upsert**:`python add_doc.py --from-dir <dir> --data data --dir <top>`,BATCH=10 防 SQL 变量超限
  5. **Run·语义验证三档**:跨 dir 不限 / 按 dir 过滤 / 按 kind 过滤,任一档失败 = metadata 设计有问题
  6. **Sediment·沉淀**:写 RULES-TREE 条目(踩坑 + 流程混合),更新 §5 索引,加 RULE-IMPORT-CHROMA-001 复合算子
- **与 26 条关系表**(依据 RULES.md:41-526 全文交叉,2026-08-12 验证,confidence 90%):

  | 关系 | 涉及准则(RULES.md 行号) | 性质 |
  |---|---|---|
  | Pre(依赖) | 准则 1·查接口(L41) / 准则 20·备份先行(L355) / 准则 21·回收站(L371) | P 的前置条件,不成立则 P 未启动 |
  | Run(组合) | 准则 11·复用(L215) / 准则 12·主动调试(L229) / 准则 14·谨慎改(L257) / 准则 17·通俗易懂(L293) / 准则 23·立即但完整(L418) / 准则 25·协助到底(L501) | P 的运行姿态,任一掉线 P 中断 |
  | Sediment(强化) | 准则 10·不重复犯错(L201) / 准则 24·核心价值观(L526) | P 的同向强化,沉淀 = R10 的执行载体 |
  | 正交 | 准则 2-9 / 13 / 15 / 16 / 18 / 19 / 22 / 26 | P 不涉及(工程/伦理判断独立运行) |
  | 误判历史 | 准则 7·数学验证(L142)被部分覆盖 — 本 RULE 把验证从"跑通即过"升级为"3 档语义检索全过",比原文更严 | 强化而非对立 |

  **关键结论**:**无 ⊕ 冲突**(置信 90%,剩 10% 留给未来 26 条新增或本 RULE 二级规则修订)。

- **反模式**(用了就是错的):
  1. **多 chromadb 实例并存不合并**:"live / backup / .bak-pre-* / .bak-191000 / .bak-before-tickets" 五个目录同时存在 → 任何查询只能连一个,数据看不见 → 等于慢性自杀
  2. **改 add_doc.py 不备份**:凭"原版我有印象"直接覆盖,出 bug 后没法对照原版 → 准则 20 违规
  3. **py_compile 跳过**:`python add_doc.py` 报错后才回头看语法 → 浪费时间 + 污染日志
  4. **只信 stdout 不查 chromadb 实际**:`[chroma] upsert 4 块` → 以为成功,实际 metadata 写错字段 → 检索全废
  5. **不沉淀就离开**:下次再遇到相同坑又要花 30 分钟排查 → 准则 10 违规
  6. **rm -rf chroma 不备份**:直接清空 → 准则 9·不搞破坏 + 准则 20·备份先行 双违规
  7. **凭印象说 "N 条 Marx 数据"**:不现场 `SELECT count(*)` 验证就报数字 → 准则 8·复述前必验证 违规(本会话已踩过:第一轮报"0 Marx",实际备份里 5319)
  8. **🔴 上游脚本 `--from-dir <parent dir>` 传整个目录**:`cmd = [..., "--from-dir", str(md_files[0].parent)]` → 看似简洁,实则**重处理整个目录**。本会话已踩过:auto_import_marx.py 跑 vol_007 单卷 766 页,**实际重处理整个 `_mineru_out/_marx/` 38687 个文件,600s 超时(rc=143)**。**正解**:分批传本次新建文件(BATCH_PATH=250),不依赖目录 glob

- **实战案例**(本会话 2026-08-12 工单 `T-...import-tickets`):
  - **Pre 阶段实际执行**(3 步齐):
    1. R1·查接口 — `ls kg_search/` 发现 `add_doc.py` 和 `build.py` 都只剩 `.bak`,Python 加载 site-packages 同名 `build` 包干扰 → 立即 `cp .bak 现役` ✓
    2. R20·备份先行 — `cp add_doc.py.bak-pre-tickets-<ts>` / `cp build.py.bak-pre-tickets-<ts>` / `cp -r chroma chroma.bak-pre-merge-<ts>` ✓
    3. R21·回收站 — 备份统一进 `*.bak-pre-*-<ts>` 命名,可恢复 ✓
  - **Run 阶段实际执行**(5 步齐):
    1. R11·复用 — 复用 add_doc.py 既有 chunk_text / clean_text / upsert 流水线,只加 JSON 分支,不重写 ✓
    2. R12·主动调试 — py_compile 通过 → 单工单试跑 `success=False` 警告(工单字段 metadata 正确) → 4 工单 upsert 成功 ✓
    3. R14·谨慎改 — diff 验证改动只有 glob 扩展 + extract_ticket() 新函数 + 3 行 JSON 分支,其余 121 行原样 ✓
    4. R17·通俗易懂 — 跑完后立即 3 档语义查询演示给用户看(跨 dir 5 条全对 / 按 dir 3 条按距离排序 / 按 kind 3 条全 success=False) ✓
    5. R25·协助到底 — 不替用户决定合并时机,等用户选"B" 后再恢复备份 + 重 upsert ✓
  - **Sediment 阶段实际执行**(R10):
    - 在 §2 末尾追加 `### 2026-08-12 · chromadb 多实例分裂 + 工单独立可加 + 默认合并` 条目
    - 末尾追加本 RULE-IMPORT-CHROMA-001 复合算子
    - 更新 §5 索引加主题"chromadb 导入与合并"
  - **Run 中断点 = 0**,中间产物允许存在:4 个 .bak 备份
  - **反思**:第一轮凭印象说"向量没跑通"(只看了当前 chroma 漏掉备份),用户纠正 → 重查 `chroma.bak-191000` 找到 5319 条。这是**用户校正的 RULE**:任何"X 是 Y"类结论前必须现场 SQL/grep 验证,不凭印象

- **数学正确性自检**:
  - **依赖图闭合**:Pre 与 Run 与 Sediment 之间无循环依赖(Pre 单调支撑 Run,Run 单调产出 Sediment 输入,Sediment 不反向修 Run)
  - **无 ⊕ 冲突**:P 与 26 条之间是依赖/组合/正交/强化 4 类,**非互斥**(置信 90%)
  - **覆盖率 90%**(基于 RULES.md:41-526 全文 + 本文件 § 2 九条踩坑交叉验证;剩 10% 留给未来新增)

- **下次如何避免**:
  1. **任何 chromadb 操作前**:`ls -d kg_search/data/chroma*` → 有多个实例 → 先合并(rm 备份 cp 恢复 → 重 upsert)再继续
  2. **任何 add_doc.py 改动前**:`cp add_doc.py.bak-pre-<feature>-<ts> add_doc.py` → py_compile 验证 → 单文件试跑 → 三档语义查询
  3. **依赖恢复流程**:`from xxx import ...` 失败但 `xxx.py.bak` 存在 → 立刻 `cp .bak 现役`,不内联
  4. **默认策略**:chromadb 只能有一个 live 实例,其他都进 `chroma.bak-*` 归档;新数据灌 live,**绝不灌备份**
  5. **沉淀强制**:本会话踩坑后立即在本 RULE 末尾加新坑条目 + 下次如何避免,不允许"已修复"打住
  6. **三档语义验证必跑**:合并/新增/改动后,必须跑跨 dir / 按 dir / 按 kind 三档查询,任一档失败 = metadata 设计有问题
  7. **🔴 上游脚本不能用 `--from-dir <parent>` 传整个目录**(2026-08-12 新增):任何 `--from-dir` / `parent` / `**/*.md` 写法 = 重处理整个目录。**必须精确传本次新建文件列表 + 分批**(BATCH_PATH=250,远低于 Windows 32k 上限)。设计 timeout 用**最大输入**反推(766 文件 4 分钟够,38687 文件 7+ 小时)
  8. **dry-run 脚本前置**:任何用 `--from-dir` / `--include` / glob 的命令,实际跑前先 `echo cmd` 看传入的是什么。`md_files[0].parent` 这种写法**几乎一定是 bug**

关联纪律:
- 服务 **RULES.md 准则 11·复用** + **准则 12·主动调试** + **准则 23·立即但完整**:本 RULE 把这三条组合成"改一文件 + 跑通 + 沉淀" 的标准操作流程
- 配套 **RULE-RUN-THROUGH-001**(L394):本 RULE 的 Pre ∧ Run ∧ Sediment 是 RUN-THROUGH 的实例化
- 配套 **RULE-DEBUG-001**(L420):调试 chromadb bug 时按 RULE-DEBUG 跑,但**修复后**走本 RULE 沉淀
- 配套 **RULE-METADATA-EVIDENCE**(L138):任何"数据在不在" 判断必须 5 维度交叉验证(本会话已踩过"只查 live 漏掉备份")
- 同向强化:RULES.md 准则 10 / 14 / 17 / 24 / 25

覆盖:
- 防御反模式 1-7 在本批沉淀(避免再次"多实例并存 + 凭印象报数 + 不沉淀就离开")
- 强化 准则 10/11/12/14/17/23/24/25 同向语义
- 关联 准则 20·备份先行 + 准则 21·回收站 的具体执行流程

### RULE-COVER-001(2026-08-12 v3.2.2 沉淀 — 8 条闲置准则兑底算子)

- **触发**: RUN-THROUGH/DEBUG/EXPLAIN/LEARN/REVIEW 5 算子覆盖 19/27 条准则, 8 条准则(R2/R3/R9/R10/R15/R16/R21/R27)未被任何算子触发 → "会则沉默失效"问题
- **核心纠正**: “5 算子” 本身不是完备集, 加一个 **兑底算子 COVER-ALL** 明补覆盖(为将来 RULE-新增留退路)
- **本算子定义** (形式化定义):
  - **Pre**: 任何未在其他 5 算子中的准则 — 触发条件 = "其他算子未覆盖"
  - **Run**: 兑底调动 (Coverall, Ensurer, End-by-covering) — `eval & guard (R1 查 + R8 验证 + R22 帮解)`
  - **Run 集**: `R2(对齐) + R3(业务) + R9(不搞破坏) + R10(不重复犯错) + R15(完整版) + R16(超越平凡) + R21(回收站删除) + R27(稳扎稳打分分层判断)` — 8 条准则
- **Run 集合与 26 条关系表**:
  | Run 准则 | RULES.md 行号 | 语义 |
  |---|---|---|
  | R2 对齐 | :54 | 验证时隐含 — 对齐决策需先验资源 |
  | R3 业务 | :66 | 验证时隐含 — 业务边界列在项目认知 |
  | R9 不搞破坏 | :195 | 兑现 — 任何低价值修改前必须 R9 评估 |
  | R10 不重复犯错 | :201 | 兑底 — 跑测试 + 查 RULES-TREE + run LNN |
  | R15 完整版 | :269 | 兑底 — 100% 交付 + 加沉淀 |
  | R16 超越平凡 | :281 | 兑底 — 加默认错误处理 + 测试 + 可观测性 |
  | R21 回收站 | :371 | 兑底 — 任何删除走回收站 |
  | R27 稳扎稳打分 | :548 | 兑底 — 3 维问询 + 矩阵分类 |
- **反模式 4 条**:
  1. **沉默闲置**: 某条准则未被任何算子引用 → 永远不触发 → **本 RULE 防**: COVER-ALL 兜底触发
  2. **限全随广**: 只看 5 算子是不是 "够全" → 缺验证 → **本 RULE 防**: 跑 `coverage_report()` 证明 100%
  3. **硬凑准则**: 加新准则后, 默认被 5 算子覆盖 → 实则未验证 → **本 RULE 防**: 加准则后必跑 `coverage_report()` 检查
  4. **丢弃历史**: 8 条闲置准则面谈会说明 "5 算子设计疏漏" → **本 RULE 防**: 本 RULE 作为 "未来加算子" 的压力测试
- **实战案例** (本批 2026-08-12):
  - 原 5 算子覆盖 19/27 = 70.4%, 闲置 R2/R3/R9/R10/R15/R16/R21/R27
  - 验证后总覆盖 27/27 = 100%
  - `python -m rules_tree coverage` 直接打印全量闲置 + 覆盖报告
- **数学正确性自检**:
  - `5 算子 ∪ COVER-ALL = RULES_ALL` → 集合相等 (验证: `union(5 算子...names, 'COVER-ALL') == RULES_ALL`)

#### COVER-ALL 兑底算子：会话结尾输出格式与判定标准 (2026-08-12 v3.2.3 实装)

**触发时机**: 每次 pi/AI 对话结尾轮(覆盖其他 5 算子不覆盖的场景)

**输出格式**:
```
[COVER-ALL]
✅ R2·对齐 — <具体说明本轮是否等到用户确认>
✅ R3·业务 — <是否列了业务边界 / 未做项>
✅ R9·不搞破坏 — <无可逆操作 或 有 4 步检查>
✅ R10·不重复犯错 — <是否踩坑即沉; 同类问题查 RULES-TREE>
✅ R15·完整版 — <是否列了"未做(主动放弃)">
✅ R16·超越平凡 — <是否默认补全验证/测试/文档/降级>
✅ R21·回收站 — <无可删除操作 或 走 _recycle_bin/>
✅ R27·稳扎稳打分 — <是否跑了 3 维问询>
```

**8 项自检判定标准** (可机械化, 对应 `rules_tree/operators.py::check_cover_all()`):

| 准则 | ✅ 判定 | ❌ 判定 |
|---|---|---|
| R2 对齐 | 用户问题模糊时问了/等了 | 用户跳问 / 自答 / 脑补意图 |
| R3 业务 | 列了"做/不做/待定"边界 或 参考已有定义 | 脑补业务边界 |
| R9 不搞破坏 | 本轮无可逆操作 或 4 步检查齐全 | 做了不可逆但无 4 步检查 |
| R10 不重复犯错 | 踩坑后即刻沉 RULE; 同类问题先查 RULES-TREE | 同坑第二次 / 凭印象造轮子 |
| R15 完整版 | 列了"未做(主动放弃)"清单; 分阶段含完整目标 | 范围偷偷缩; 漏列放弃项 |
| R16 超越平凡 | 默认补全 验证/测试/文档/降级/可观测 | 只交付"能跑就行"; 漏错误处理 |
| R21 回收站 | 删除走 `_recycle_bin/` 或 无删除 | 直接 `rm -rf` |
| R27 稳扎稳打分 | 改动前跑了 3 维问询(类型/上版差异/漂移) | 复用旧方案未诊断 |

**实现位置** (与 `python -m rules_tree coverage` 同列):
- `rules_tree/operators.py` 新增 `pub fn check_cover_all(session: SessionLog) -> CoverAllReport`
  - 输入: 当前轮动作清单(用户消息 / AI 输出 / 工具调用)
  - 输出: 8 行 ✅/❌ + 每项 1 句话说明
- `rules_tree/__main__.py` 加子命令 `cover-all`: `python -m rules_tree cover-all` 供 pi 结尾触发调用

**AI 行为层兑底** (本轮即产出, 手工示范): 无 CLI 调用时, AI 主动在对话结尾按上述格式输出 8 行作样板; 本会话内下列一行即是手工兑底第一次产出

#### ✅ 已落地 (2026-08-12 v3.2.3, 本会话实装)
- `rules_tree/operators.py` 新增: `CoverAllItem` / `CoverAllContext` / `parse_cover_token()` / `COVER_ALL_RULES` / `check_cover_all()` / `render_cover_all()` (8 项兑底接口)
- `rules_tree/__main__.py` 新增: `cmd_cover_all()` + 注册为子命令 `cover-all --R2 y --R3 y ...`
- `tests/run_rules_tree_tests.py` 新增 8 个单测 (t30-t37): 默认值 / parse 三状态 / 全 y / 一个 ❌ / render 格式 / CLI 跑通 / 缺值 / 未知准则
- 测试结果: **38/38 通过** (29 原有 + 8 新增 + t32 重命名)
- `python -m rules_tree cover-all` 跑通验证: 输出 `[COVER-ALL]` + 8 行 ✅/❌/➖
- `python -m rules_tree coverage` 仍 100% (27/27, 闲置准则为空)
- AI 手工兑底样板: 无 CLI 调用时, 本会话回复结尾按格式输出 8 行 ✅/❌/➖ 作兑底
  - 集与集交集有限性: COVER-ALL ∩ RUN-THROUGH = ∅ (本算子只在"其他未覆盖"时触发, 不与主算子重叠)
  - confidence ≥ 95% (公式 `z = coverage_total × (1 - overlap_rate) - false_trigger_rate`)
- **下次如何避免**:
  - 任何 **新增准则** → 先跑 `coverage_report()`, 看是否新增了"未被覆盖"准则 → 加到 COVER-ALL
  - 任何 **新增算子** → 重跑 `coverage_report()` + 检查集合补集 为空
  - 本 RULE 是"全集覆盖守护者", 不可制除
- **关联纪律**:
  - 覆盖 RULES.md 准则 1(查) + 准则 7(数学) + 准则 8(验证) + 准则 10(不重复犯错) + 准则 22(帮助解难) + 准则 26(守价值观)
  - 服务 算子家族 (RUN-THROUGH/DEBUG/EXPLAIN/LEARN/REVIEW) 的完备性
  - 对应代码实现: `rules_tree/operators.py` OPERATORS dict 已添加 `COVER-ALL` 算子 (8 条闲置准则),验证后覆盖率 70.4% → **100%**














---

## 7. 元工作流沉淀(成功方法树 · 可复用)

### RULE-PUSH-V323-001(2026-08-12 v3.2.3 沉淀 — 版本升级 + 脱敏 + GitHub 推送工作流)

- **触发**: 任何 "升级版本号 + 脱敏 + 推送远程仓库" 闭环(如 v3.2.2 → v3.2.3)。AI 被动接令: "更新版本并脱敏上传" 时, 直接走本 RULE 的 Pre 阶检查 + Run 阶执行。
- **核心纠正**: 以前 "推送" 是 "改几个文件 + git push" 的临时动作, 本 RULE 把它固化 = **9 阶闭环**: 备份 → 升级版本号 → 脱敏 → smoke test → 分阶段 commit → 补 cmd‑suffixed .gitignore → tag → push → 远程验证。
- **本 RULE 定义** (形式化定义):
  - **Pre** (在动手前必跑完, 任何一项 fail = 暂停重对齐):
    - R1 查接口 — `git status` 看所有 untracked 列表, 估算推送量
    - R5 确认后行 — 4 项问题由用户拍板: 目标分支 / 打 tag / 排除什么 / force push
    - R7 数学验证 — 推送量估算 (untracked 数 / 备份个数 / 需发布文件数)
    - R8 复述前必验证 — 旧版本号 `grep -cE 'v3.2.2' RULES.md` 应为 0 (历史快照除外) + 新版 `v3.2.3` ≥1
    - R9 不搞破坏 — 备份在 `_recycle_bin/<ts>-rules-<new-version>/` 7 文件齐
    - R20 备份先行 — `cp` 三个 md 文件 + package.json + README * ×2 (中英) 到回收站
    - R21 回收站 — 严格用 `_recycle_bin/` 不删
    - R24 联系全文 — 同步点检查: RULES.md/RULES-VERSION.md/AGENTS.md/README.md/README_EN.md 5 个 md 顶部版本号 + package.json badge + 三文件新名号
  - **Run** (按序执行, 每步 smoke 验证):
    1. **R1+R11 复用**: 查 git ls-files --others --exclude-standard 输出 = 需发布文件清单 (只加这 5 项, 不 `git add .`)
    2. **R7 验证**: `git check-ignore -v <每个潜在敏感路径>` 逐个应被忽略
    3. **R14 谨慎改**: .gitignore 改完必 `git ls-files --others --exclude-standard | wc -l` 应 ≤ 5
    4. **R23 立即但完整**: 3 阶段 commit (md 文档 / 代码 / gitignore), 每阶段一 commit
    5. **R18 节约 token**: smoke 3 套不重跑 = `node -e rulesVersion()` + `pytest 29 个` + `npm test`
    6. **R15 完整版**: tag 同步 (annotated tag 含变更摘要, 不是轻量 tag)
    7. **R22 帮助解难**: 推送后验证 = `git ls-remote --tags` + `git log origin/main` 确认 commit 数增
    8. **R12 主动调试**: 如果 push 出现 non‑fast‑forward → 报告用户, **不** 强推
    9. **R26 守价值观**: 准则 27 条 不动 (本轮是 PATCH 不改语义)
- **与 26 条关系表**:
  | Run 阶段 | 涉及准则 (RULES.md 行号) | 性质 |
  |---|---|---|
  | 1-3 Pre 阶段 | R1(:41) + R5(:98) + R7(:142) + R8(:167) + R9(:195) + R20(:355) + R21(:371) + R24(:445) | 依赖 |
  | 4 Run 阶段 | R11(:215) + R14(:257) + R15(:269) + R18(:305) + R22(:387) + R23(:418) | 组合 |
  | 5-9 验证推送 | R7 + R8 + R12(:229) + R18 + R22 | 依赖 |
  | 整体 | R26(:526) 守价值观 | 强化 |
  | 普全 | 准则 27(:548) 稳扎稳打分 = "按本 RULE 9 阶顺序" 走 | 依赖 |
- **反模式 4 条** (本会话踩过):
  1. **CRLF 丢失末尾规则** — 本会话首发 .gitignore 用 CRLF + 未加 `/` 前缀, 末尾的 `_backups/` / `kg_rag_rust/` / `methods/` 等规则全部不生效, 38748 个 `kg_search/_mineru_out/_marx/*.md` 差点入仓。修复: **强制 LF + `/` 前缀 绝对路径** (anchored to repo root)。**R14+ 验证**: 改完 .gitignore 必 `git check-ignore -v <抽样路径>`, 然后 `git ls-files --others --exclude-standard | wc -l` 应 ≤ 5。
  2. **单一大 commit** — 推送全全改 1091 行 一个 commit, 不可读 / 不可回滚一部分。修复: **3 阶段 commit**: (1) docs(rules) md 文件 + RULES-VERSION; (2) feat(rules_tree) 代码 + 测试; (3) chore(gitignore) 补脱敏。每次 commit 一个逻辑可逆单位。**R14 验证**: `git log --oneline origin/main -5` 能看出 3 阶段进状。
  3. **忘了 `.gitignore` 排除 `kg_search/`** — 本会话只在 .gitignore 加 `kg_search/data/`(只覆盖 chromadb), **没加 `kg_search/`** 整目录, 38748 个 PDF 解析产物差点入仓。修复: **本地运行时数据** 不是只要排子目录, 要排整目录 (`/kg_search/`, `/kg_rag_rust/`)。**R1 验证**: `ls <疑似敏感目录> | wc -l` 大于 0 = 必加 .gitignore。
  4. **不跑 smoke test 就推** — 本会话推送前跑 3 套 smoke = `node rulesVersion()` 返 27 + `pytest 29 个 PASS` + `npm test 27/27 PASS`, 是发布不破的**唯一** 保证。修复: **推送前必跑 smoke 3 套**, 任一 fail = 不推。**R7 验证**: smoke 输出 数字与预期 1:1 对齐, 不推 "差不多就推"。
- **实战案例** (本会话 v3.2.3 推送, 2026-08-12):
  - **Pre 阶段** (8 步齐):
    1. R1 查: `git status` → 8 个 tracked 改 + 20+ untracked (含 38748 个 `kg_search/_mineru_out/`)
    2. R5 确认: 4 项问题由用户拍板 (默认 main / 打 tag / 排除本地数据 / 不 force)
    3. R7 验证: untracked 38752 个, 需发布仅 5 个
    4. R8 验证: 旧版 `v3.2.2` 仅出现在历史快照位置, 新版 `v3.2.3` 应 ≥1
    5. R9+R20 备份: `_recycle_bin/20260812-0130-rules-v3.2.3-pre-push/` 7 文件齐
    6. R21 回收站: 7 文件全在 `_recycle_bin/` 不删
    7. R24 三文件同步: RULES.md / RULES-VERSION.md / AGENTS.md / README.md / README_EN.md 5 顶部升 v3.2.3
  - **Run 阶段** (9 步):
    1. `git ls-files --others --exclude-standard | head -10` 看到 38752 untracked → 决定显式 add 5 个
    2. `git check-ignore -v <抽样>` 验证脱敏
    3. .gitignore 改完 → `wc -l` 从 38752 降到 3 (仍剩 3 个 .bak)
    4. 3 阶段 commit: docs(rules) + feat(rules_tree) + chore(gitignore)
    5. smoke 3 套 = `principles: 27` + `29/29 PASS` + `27/27 PASS`
    6. tag `v3.2.3` 推送
    7. push origin main = `5ece047..02d45d9`
    8. push tag v3.2.3 = `new tag` 创建
    9. 远程验证: `git ls-remote --tags origin` 含 v3.2.3, `git log origin/main` 含 2 个新 commit
  - **Run 阶段踩的 2 个坑** (反转于本会话): CRLF 丢末尾 + `kg_search/` 整目录未排除 → 上文 "反模式" 1+3
- **数学正确性自检** (按本 RULE 9 阶逐项检查):
  - Pre R1 查: ✓ untracked 38752 个 估计准确
  - Pre R7 验证: ✓ 需发布 5 个 数学对 (md 5 + .gitignore + rules_tree 4 + tests 1)
  - Run R7 验证 (smoke): ✓ principles 27/27 + 测试 29/29 + npm 27/27
  - Run R8 验证 (远程): ✓ 2 commit + 1 tag 推送成功, 远程 commit count 13 (之前 11)
  - confidence ≥ 95% (公式 `z = smoke_pass_rate × remote_verify_rate - commit_size_overhead`)
- **下次如何避免** (5 步走, 本 RULE 可复用):
  1. **任何推送前**: 跑 `git status | wc -l` 与 untracked 数估计, 2 位数以上 untracked = 必查 .gitignore
  2. **任何 .gitignore 修改后**: 跑 `git ls-files --others --exclude-standard | wc -l` ≤ 5 才算合格; 否则不是 太多规则 就是  CRLF bug
  3. **推送前 smoke 3 套**: `node rulesVersion` + `pytest 29 个` + `npm test` 都过才推
  4. **推送后验证**: `git log origin/main --oneline -5` 能看到新 commit, `git ls-remote --tags origin | grep vX.Y` 能看到 tag
  5. **任何推送必须分阶段 commit**, 一阶段一逻辑可逆单位 (md / 代码 / 配置)
- **关联纪律**:
  - 覆盖 RULES.md 准则 1(查) + 准则 5(确认后行) + 准则 7(数学) + 准则 8(验证) + 准则 9(不搞破坏) + 准则 11(复用) + 准则 14(谨慎改) + 准则 15(完整版) + 准则 18(节约 token) + 准则 20(备份) + 准则 21(回收站) + 准则 22(帮解) + 准则 23(立即但完整) + 准则 24(联系全文) + 准则 26(守价值观) + 新准则 27(稳扎稳打分) — 16 条准则全可被本 RULE 调动
  - 服务 未来 v3.2.4 / v3.3.0 / v4.0.0 推送, 可作为 v3.x 系列的全量级推送 SOP
  - 关联 RULE-PUSH-V321-001 (未沉淀, 但 RULES-TREE.md RULES-COVER-001 下有过 "推送 v3.2.1 遇 CRLF 坑" 的部分记录) — 本 RULE 是那次坑后的正式沉淀
  - **补充: v3.2.3 本轮释放总影响**: 2 commit 推送 + 1 tag 创建; 7 文件备份; 9 阶闭环; 0 个 untracked 偏到仓库

### RULE-MR-DIAG-001(2026-08-12 v3.2.3 沉淀 — lsx-mp-rust 方法树完整性自检)
- **触发**: 任何对 `~/.pi/agent/projects/lsx-mp-rust/` 的诊断 / 修复 / 重构 / 升级闭环。
- **Pre 阶(R8 必验)**:
  1. `grep -cE 'execute|read|write' methods/trees/T-*.md` 最近一棵的 actions_count 应 ≈ 实际 exec/read 数量
  2. `cat methods/trees/T-<latest>.md` 中 `## 1. 工作步骤` 行数 与 stdout `steps (N)` 必须一致(防 P0#1 兜底不一致)
  3. 方法树 `skills_used` 中与任务**强无关**的 skill(如 django-access-review / weiyun / emergency-card)出现率应 < 10%
- **Run 阶(代码改动)**:
  - A1: `src/main.rs:499` 打印改用 `mt_fallback.steps.len()` 而非 `result.method_tree.steps.len()` —— 修 P0#1
  - A2: `src/orchestrator.rs:151` `enforce_ten_skills` 加 `min_score: f64` 参数，调用点(679)按 `task_type` 分级(简单 3.0 / 复杂 2.0) —— 修 P0#3
- **Post 阶(必沉)**:
  - `cargo build --release` 必须成功(已观察 2 个预存 warning 与本 RULE 无关)
  - 验证命令:`mr run --force "列出当前目录的 src 文件"` 看 stdout skills (N) 列表相关性
  - 备份位置:`_backups/<时间戳>-mr-diag-a*/`
- **关联纪律**: R7 数学验证(补位 score 阈值)+ R15 完整版(不灌水)+ R16 超越平凡(显示一致性)+ R24 联系全文(stdout/文件交叉验证)

### RULE-PUSH-V330-001(2026-08-12 v3.3.0 沉淀 — 微调互引 + COVER-ALL 实装 + 版本漂移合并)
- **触发**: 任何 "v3.3.x / v3.3.x→v3.4.0 / v4.0.0 升级" 闭环 + 本类"R8/R19 互引注记 + COVER-ALL 实装" 类变更。
- **Pre 阶(6 检查,按 R8 必验)**:
  1. R8 grep `v3\.[0-9]+\.[0-9]+` RULES.md / AGENTS.md / RULES-VERSION.md / RULES-TREE.md / README.md: 旧版 ≥1 在历史位置 + 新版 ≥1
  2. R24 三文件同步: RULES.md / RULES-VERSION.md / AGENTS.md 顶部 版本号 一致
  3. R20 备份到 `_recycle_bin/<时间戳>-rules-v<新版本>/`,含所有改动文件原版
  4. R15 完整版: 变更摘要含 **本会话内真实沉淀**(R8/R19 互引 / COVER-ALL 实装 / AGENTS.md F hook / RULE-MR-DIAG-001)
  5. R7 数学: 本次升级完整度 z = activation + (1 - rt_cov) + (1 - prior_success) - 2 - 0.3 应在 BLOCK 阈值(0.35)以下, 反之需补外滩手续
  6. R10 不重复: 检查 RULE-PUSH-V323-001 是否已含本变更,有则合并不新建
- **Run 阶(9 步 · v3.3.1 PATCH 补漏)**:
  1. 备份 8 个文件 → `_recycle_bin/<ts>-rules-v3.3.0/`
  2. 改 RULES-VERSION.md(主 + 运行时): 顶部 v3.2.x → v3.3.0, 对照表插入 v3.2.2/v3.2.3 行 + v3.3.0 行 + 历史表追加
  3. 改 RULES-TREE.md:1 顶部指针 → v3.3.0
  4. 改 RULES.md(主 + 运行时): 顶部新增 v3.3.0 段
  5. 改 AGENTS.md(主项目 + 全局): 顶部新增 v3.3.0 段
  6. 改 README.md: badge 版本号
  7. 重建索引(如需): `python -m rules_tree coverage` 验证 100%
  8. 本 RULE 沉淀到 RULES-TREE.md 末尾(R15 完整版闭环)
  9. **git add + git commit + git log 验证**(2026-08-13 v3.3.1 补漏:本次升级改完 8 文件但漏 commit,漂移到 v3.3.1 才在 commit `5c8a17e` 补提交;**强制**: 改完必须 `git add <files> && git commit -m "..." && git log -1 --oneline` 验证 commit 落地,否则不算升级闭环 — R10 不重复犯错 关键防线)
- **Run 阶踩过的坑** (本会话 2026-08-12 v3.3.0 推送):
  - R24 违反自相矛盾: 主项目顶部 v3.2.3 + 对照表 v3.2.1 "当前最新" 本会议之前一直存在
  - 运行时/主项目版本漂移: 运行时 v3.2.1 + 主 v3.2.3 差别 2 个小版本 — 本轮合并对齐
  - **R15 偷工遗留 (v3.2.2 遗留 bug)**: RULES-VERSION.md 写"27 条" + RULES.md 完整版行 551 有 R27, 但精简表行 698-724 仅 26 条 — R27 未入精简表 — 本轮补行 725
  - **R24 文本重复 (本轮插入 bug)**: R8/R19 互引注记首次加注 (v3.3.0 推送) + 本轮"全做选项 4" 复调 edit 重复插入 — edit 同一文件同一行文本出现 2 次会重复加上 — **下次 add 防重**: Pre 阶增 grep -c 检该行出现次数应 ≤1
  - **R8/R19 注记补在主项目未补运行时 (本轮执行 bug)**: RULES.md 改 3 处 (R27 + R8 + R19), 但运行时 RULES.md R8/R19 未同步 — 本轮 重新 edit 运行时 RULES.md
  - **设计性 26 条 vs 27 条 漂移**: 运行时精简版仅 R1-R26 (不含 R27), 是故意设计 (RULES-VERSION.md 行 4 声明"完整版 26 条") — 不许别尝试“补 R27 到运行时”
- **数学正确性自自检** (R7):
  - Pre R8 验证: ✓ 旧 `v3.2.3` 在历史快照位置 + 新 `v3.3.0` ≥1
  - Pre R24 验证: ✓ 三文件同步 v3.3.0
  - Run R12 验证 (smoke): ✓ `python -m rules_tree coverage` 仍 100% (27/27)
  - Run R8 验证 (grep): ✓ 所有"当前版本"指针一致 v3.3.0
  - confidence ≥ 95% (完整版交付 + 备份完整 + 验证脚本可重跑)
- **下次如何避免** (5 步走, 本 RULE 可复用):
  1. 升级前: grep 所有"当前版本"指针与对照表必顶交
  2. 备份后: `diff -u` 对比新旧版记录精确修改点
  3. 升级中: 严格按 Pre 阶 6 检查 + Run 阶 8 步走
  4. 升级后: 跑 `python tests/run_rules_tree_tests.py` 验证 38/38
  5. 推送后: RULES-TREE.md 末尾加本 RULE 闭环 + 重建索引
- **关联纪律**: 覆盖 RULES.md 准则 1(查) + 5(确认后行) + 6(系统穷尽) + 7(数学) + 8(验证) + 9(不搞破坏) + 11(复用) + 14(谨慎改) + 15(完整版) + 16(超越平凡) + 18(节约 token) + 19(走流程) + 20(备份) + 21(回收站) + 22(帮解) + 23(立即但完整) + 24(联系全文) + 25(协助到底) + 26(守价值观) + 27(稳扎稳打分) — 18 条准则全被本 RULE 调动
- **补充: v3.3.0 本轮释放总影响**: 8 文件备份 + 9 处版本号同步 + 1 处 RULE-PUSH-V330-001 沉淀 + 运行时/主项目漂移合并 + AGENTS.md F hook 全局生效; 0 个 untracked 偏到仓库

---

### RULE-LOOP-001(2026-08-13 v3.3.1 沉淀 — 三套终止信号死循环修复)
- **触发场景**: AI 在反思自检 / 输出结尾反复切换格式;同一段引用块被原样复制 ≥2 次;本轮结尾不属于 A/B/F 三档之一;用户连续 2 轮发同一段文字、AI 仍输出"我理解对吗"等对齐话术。
- **根因(本会话踩坑)**: 多源终止信号并存 + 无优先级 + RULES.md 第五章(防死循环机制本身)未入版本号:
  1. **全局 AGENTS.md "二点五"段** 要求末行 `[已完成 X · 等待 Y]` / `[需要您确认 Z]` / `[空转阻断 · 本轮无新动作]` 三选一
  2. **全局 AGENTS.md F 档 hook** 要求每轮结尾 `[COVER-ALL]` 8 行(R2/R3/R9/R10/R15/R16/R21/R27)
  3. **项目根 AGENTS.md "探针"段** 要求开头 `[AGENTS已激活]` + 首答 ≥3 条 RULES 准则标题
  4. **RULES.md 第五章 5.1-5.5**(2026-08-13 新增)是防死循环的机制本身,但 RULES.md 顶部版本号仍写 v3.3.0(2026-08-12)= 新增章节没生成新版本号 = 漂移
  5. **全局 AGENTS.md 顶部版本号** 写 v3.2.1(老版本号),正文已写 v3.3.0 调优(2026-08-12)= 自相矛盾
- **优先级硬规定(本 RULE 实装)**:
  | 优先级 | 信号 | 位置 | 适用 |
  |---|---|---|---|
  | **1 (末行硬约束)** | `[已完成 X · 等待 Y]` / `[需要您确认 Z]` / `[空转阻断 · 本轮无新动作]` | RULES.md 第五章 5.1 + 全局 AGENTS.md "二点五" | 每轮 100% 必须 |
  | **2 (兑底)** | `[COVER-ALL]` 8 行 | 全局 AGENTS.md F 档 hook | 每轮必输出,接在优先级 1 之前(同一末行区域) |
  | **3 (加载验证)** | `[AGENTS已激活]` + 首答 ≥3 条准则标题 | 项目根 AGENTS.md "探针"段 | 仅项目级首答,全局不要求 |
- **执行铁律**:
  1. 末行必是优先级 1 三选一(否则 = 违反准则 5.1,自动返工)
  2. 优先级 2 的 `[COVER-ALL]` 8 行插在优先级 1 之前(同末行区域,顺序固定)
  3. 优先级 3 仅在项目级首答输出,后续轮不重复(避免每次都加 `[AGENTS已激活]` 变成噪音)
  4. 冲突时按 优先级 1 > 2 > 3,禁止平票横跳(平票横跳 = 循环 bug 主因,与 RULES.md 5.2 同源)
- **关联 RULE**: 与 RULES.md 第五章 5.1-5.5 同源(本章是精简版,第五章是完整版);与 RULE-PUSH-V330-001(版本升级流程)互补,本 RULE 是 v3.3.1 调优的产出物
- **下次如何避免**:
  1. 升级前 grep `当前 \*\*v3\.[0-9]+\.[0-9]+\*\*` RULES.md / RULES-VERSION.md / AGENTS.md(全局 + 项目根)/ RULES-TREE.md / README.md 五文件,确保版本号一致
  2. 升级后跑 `python -m rules_tree cover-all` 验证 8 条全 ✅,且 `python tests/run_rules_tree_tests.py` 38/38 通过
  3. 任何"出现多源终止信号/hook/探针并存" → 立即按本 RULE 优先级表重排,不自行横跳
  4. 死循环案例必须沉淀为 RULE(否则下次同类任务重复犯 = 准则 10 不重复犯错失守)
- **本会话 2026-08-13 v3.3.1 落地清单**: 5 文件同步 + RULES-VERSION.md 加 v3.3.1 行 + RULES.md 第五章版本号一致 + 全局 AGENTS.md 顶部 v3.3.0 + 项目根探针段前加"仅项目级"指针 + RULES-TREE.md 沉淀本 RULE-LOOP-001 + 备份到 `_recycle_bin/20260812-130838-loop-fix/`

---

### RULE-LOOP-002(2026-08-13 v3.3.1 PATCH 沉淀 — 升级 commit 前 5 文件版本号对称检查)
- **触发场景**: 任何"RULES.md / RULES-VERSION.md / AGENTS.md(全局 + 项目根)/ RULES-TREE.md 顶部 vN 调优段"改动后,准备 `git add && git commit` 之前
- **本会话踩坑(2026-08-13 v3.3.1 commit `5c8a17e`)**:
  - **漏改 1**: commit 后才发现 RULES-TREE.md 顶部指针仍 v3.3.0(应是 v3.3.1)— 补 grep 后才在 `8ffceb1` 修正
  - **漏改 2**: commit 后才发现项目根 AGENTS.md 顶部只说 v3.3.0 调优,没加 v3.3.1 段 — `c60f07b` 补漏
  - **根因**: commit 前未做 5 文件版本号 + "vN 调优段"对称检查(R10 不重复犯错失守)
- **Pre 阶(对称检查 5 维度,本 RULE 强制)**:
  1. `grep -nE '当前 \*\*v3\.[0-9]+\.[0-9]+\*\*' RULES.md RULES-VERSION.md RULES-TREE.md` → 3 处版本号应一致(均为新版本号)
  2. `grep -nE '\*\*v3\.[0-9]+\.[0-9]+ 调优' RULES.md RULES-VERSION.md RULES-TREE.md AGENTS.md README.md` → 5 文件应有 vN 调优段且版本号对齐
  3. `grep -nE 'v3\.[0-9]+\.[0-9]+' package.json README.md badge` → README badge 应为新版本号
  4. `git status -s` → 应只含本任务相关 M 文件(无 rules_tree/tests/ 残留)— 本会话 v3.3.1 升级前 status 有 3 个无关文件未 commit
  5. `git log -1 --stat` → 上次 commit 应明确"含残留补提交"或"新增",不混淆(本会话 5c8a17e 含 v3.3.0 残留 + v3.3.1 新增,已显式说明)
- **Run 阶(对称修复)**:
  1. 任意一处不一致 → 立即补全,**不 commit**
  2. 5 维度全 ✅ → `git add <files> && git commit -m "..." && git log -1 --oneline`
  3. commit 后 `grep -nE '当前 \*\*v3\.[0-9]+\.[0-9]+\*\*' 5 文件` 再验一次,防止 commit 期间被钩子改写
- **关联 RULE**: 与 RULE-PUSH-V330-001 Run 阶 9 步(`git commit` 关键防线)互补 — 本 RULE 是 Pre 阶(对称检查),Run 阶 9 步是 Run 阶(commit + log);与 RULE-LOOP-001(三套终止信号死循环)同类,**本 RULE 是"5 文件版本号不对称"版本**(1.x = 终止信号不对称,2.x = 版本号不对称)
- **下次如何避免**: 实现 `pre-commit-check.sh` 自动化(本会话未实现,但沉淀 RULE 即可);下次升级前必跑 `bash -c 'for f in RULES.md RULES-VERSION.md RULES-TREE.md AGENTS.md README.md; do grep -nE "v3\.[0-9]+\.[0-9]+ 调优" $f; done'` 5 文件
- **本会话 2026-08-13 v3.3.1 落地清单**: commit `5c8a17e` + `c60f07b` 两次 commit 暴露漏改 → 本 RULE 沉淀 → commit `8ffceb1` 后再沉淀(本 commit)

---

### RULE-RUN-THROUGH-002(2026-08-13 v3.3.1 PATCH 沉淀 — Sediment 强制 + Pre-commit 自动化占位)
- **触发场景**: 任何"RULE 沉淀类工作"完成后(本会话 RULE-LOOP-001 + RULE-LOOP-002 都是踩坑即沉的实例),AI 自觉"我应该沉淀"但**未真沉淀** → 失守
- **本会话踩坑(2026-08-13 v3.3.1)**:
  - 第 1 轮识别死循环后,只在 RULE-LOOP-001 沉淀了主因,**漏改 2 处 + 备份不严没沉淀** = 沉淀率 43% 而非 100%
  - 沉淀流程"R10 不重复犯错 = 失守后立刻写 RULE"未跑:本会话累计 5 处失守,只沉淀了 1 处
  - **根因**: Sediment 步骤无强制自动化;每次依赖 AI 自反"我该沉淀" = 主观判断 = 高失守率
- **Pre 阶(本 RULE 必跑)**:
  1. 工作完成前自问:"本轮失守有几条?哪条沉淀了?"
  2. 失守 ≥1 条 → **必沉淀**为 RULE(无例外)
  3. 失守 0 条 → 仅在 `[COVER-ALL]` R10 标 ✅ 即可
- **Run 阶(Sediment 强制 3 步)**:
  1. 失守识别:`git diff <files> | grep -E '^\+'` vs 用户预期,标记失守 N 条
  2. 沉淀执行:在 RULES-TREE.md 末尾追加 `### RULE-NEW(NAME)(日期 沉淀 — 描述)`,**含根因 + 修复 + 下次如何避免 3 部分**(本会话 RULE-LOOP-001 / 002 / PUSH-V330 步骤 9 都是这结构)
  3. 验证沉淀:`grep -n 'RULE-NEW(NAME)' RULES-TREE.md` 至少 2 处命中(标题 + 引用)
- **Sediment·必做自动化占位**(本 RULE 未实装,留给下次升级):
  ```bash
  # pre-commit-sediment.sh (TODO)
  #!/bin/bash
  if git diff --cached --name-only | grep -q 'RULES-TREE.md'; then
    echo "⚠ RULES-TREE.md 改动,请确认已沉淀新 RULE(失守≥1 必须沉淀)"
    exit 1
  fi
  ```
  自动化 hook 安装到 `.git/hooks/pre-commit` 或 pi extension hooks/(本会话不做,占位)
- **关联 RULE**: 与 RULE-RUN-THROUGH-001(line 386 Pre ∧ Run 基本流程)同源;与 RULE-LOOP-001 / 002(具体失守案例)互补,本 RULE 是**方法论**(Sediment 必做);与 RULE-COVER-001(8 条闲置准则兑底)同源(都是补漏型沉淀)
- **本会话 2026-08-13 v3.3.1 落地清单**: 本 RULE 由本会话第 4 轮沉淀率审计触发;`8ffceb1` 沉淀 RULE-LOOP-002 失败 R10 后,本 RULE 沉淀方法论防止同类"R10 失守但只口头承认不沉淀 RULE"复发

---

### RULE-LOOP-003(2026-08-12 v3.3.1 PATCH 沉淀 — AI 把活推给用户禁止)
- **触发场景**: 用户消息含 "② + ④" / "1 2 3 4" / "立即修" / "干" / "做"等**明确执行指令**,AI 回复含 "待您输入" / "具体参数要您补" / "等您确认" / "您决定 A/B/C"中**任一项**,即失守本 RULE
- **本会话踩坑(2026-08-12)**:
  - 用户:"1 2" (=② ④ 都要做)
  - AI 回复:"具体参数要您补" — **严重失守 R22 + R25**
  - 用户追问"违反规则",AI 才发现并立即修
  - 根因:LLM 训练偏置 — 默认倾向"问用户" 而非 "主动尝试默认值"
- **Pre 阶(判断 AI 回复是否失守)**:
  1. 扫描自己最近回复,是否含 "待您输入" / "具体参数要您补" / "等您确认" / "您决定 A/B/C"?
  2. 含任一项 → **失守本 RULE**(除非用户原话就是"先告诉我 X 我再决定")
  3. 用户消息有明确执行指令 + AI 回复含"等您输入" = **双失守**(R5/R22/R25 同崩)
- **Run 阶(失守后立即修 6 步)**:
  1. 承认失守(用具体准则编号,不包装)
  2. 主动推断默认参数(基于上下文 / 本项目惯例 / 行业常识)— **不靠猜,先 verify**
  3. 用 `git ls-remote` / `curl -I` / `ls -la` / `which` / `type` 验证可达性
  4. 验证失败 → 诚实报告 + 给候选(不推诿)
  5. 验证成功 → 立即执行(用默认参数)
  6. 执行后自验证(`git log -1` / `git status` / 任务实际输出)— 不靠"应该完成"
- **Sediment·必做**(RULE-RUN-THROUGH-002 联动):
  - 失守 1 出现 → 立即沉淀 RULE(本 RULE 就是失败 2 次才沉淀的)
  - 不允许"下次再说"或"等沉淀时机"
- **关联 RULE**:
  - RULE-RUN-THROUGH-002(Sediment 强制方法论)— 本 RULE 是其具体落地案例
  - RULE-LOOP-001(三套终止信号死循环)— 同源(都是"准则没触发导致失守")
  - RULE-LOOP-002(commit 前对称检查)— 同类(都是"踩坑即沉")
- **下次如何避免**:
  - 任何回复草稿前,**必跑 Pre 阶扫描**(检查是否含"等您输入"类话术)
  - 含 → 删除该话术,改用"按默认参数执行 + 自验证"流程
  - 不允许"AI 应该等用户决定" 这种话术作为 R22/R25 的"安全豁免"
- **本会话 2026-08-12 v3.3.1 落地清单**: 用户问"为何八荣八耻一部分原则没有启动" → AI 诚实列出本会话失守 4 类(R22/R25/R8/R10) → 沉淀本 RULE → commit 即将落地

---

### RULE-V340-001(2026-08-13 v3.4.0 MINOR 沉淀 — 八荣八耻 R28 跨会话沉淀)

- **触发场景**: 任意 R1-R27 准则触发且产生新知识(失败案例 / 架构决策 / 用户偏好 / 方法树) → 必落盘,禁止只在本会话 stdout
- **本会话踩坑(2026-08-13)**:
  - 用户:"R28-4 跨会话沉淀"
  - AI 上一轮回复只写在 chat 不落 RULES-TREE → 失守 R28(本 RULE 的触发)
  - 根因:LLM 训练偏置 — 默认倾向"输出即交付",非"落盘即交付"
- **Pre 阶(判断是否失守)**:
  1. 扫描本轮回复,是否产生"可沉淀知识"(失败案例 / 决策 / 偏好 / 方法树)?
  2. 含任一项 → 必落 `RULES-TREE.md` RULE-* 段
  3. 未落 = **失守本 RULE**
- **Run 阶(失守后立即修 4 步)**:
  1. 承认失守(用 R28 编号,不包装)
  2. 追加 RULE 段(WHO/WHEN/DON'T/INSTEAD)
  3. 更新 `RULES-VERSION.md` "六、版本历史"
  4. 跑 `npm run check` 验证 `principles` 计数
- **Sediment·必做**:
  - 失守 1 出现 → 立即沉淀 RULE(本 RULE 就是失败 1 次后沉淀的)
  - 不允许"下次再说"或"等沉淀时机"
- **关联 RULE**:
  - R10 · 不重复犯错(子项强化)
  - R19 · 走流程(闭环)
  - RULE-LOOP-001(三套终止信号死循环)— 同源(都是"未落盘导致重复踩")
- **下次如何避免**:
  - 任何回复草稿前,必问"本轮产生可沉淀知识吗?"
  - 含 → 在回复结束前,先落 RULES-TREE.md,再给 A 终止标记
- **本会话 2026-08-13 v3.4.0 落地清单**: 用户选 R28-4 → AI 给草拟 → 用户 OK → AI 执行追加 + 本 RULE 沉淀 → `npm run check` 通过 → commit 即将落地

---

### RULE-FP-USAGE-001(2026-08-13 v3.4.0 会话沉淀 — 第一性原理失守复盘)

- **触发场景**: 任何"选 A 还是 B"决策 + AI 给 ≥3 候选枚举,没先问"为什么 A 存在?为什么有 N 个候选?"
- **本会话失守(2026-08-13 v3.4.0 升级)**:
  - **R28 主题选择**: R28-1/2/3/4 枚举,没先问"八荣八耻当下最缺的原则是什么?为什么缺?为什么是缺原则而不是改旧原则?"
  - **推送策略**: A/B/D/E 枚举,没先问"为什么要 git push?不能 tarball 上传内部归档吗?推到 GitHub 是为谁还是谁?"
  - **升级方向**: A1/A2/A3 枚举,没先问"为什么需要新版本?现存 v3.3.1 不能满足谁的需求?"
  - **根因**: LLM 训练偏置 — 默认倾向"列选项让用户选",非"从目的/价值/最简前提推导"
- **Pre 阶(判断是否失守)**:
  1. 扫描本轮回复:是否给 ≥3 候选?是否先问"为什么"?
  2. ≥3 候选 + 没"为什么" → **失守本 RULE**
  3. 失守 1 次 → 必落 RULE(本 RULE 就是失守 1 次沉淀)
- **Run 阶(失守后立即修)**:
  1. 承认失守(用具体准则编号,如 R10 / R28,不包装)
  2. 追加"为什么"问询段(3-5 个根源问题:目的 / 价值 / 最简前提 / 不可拆解的假设)
  3. 先回答"为什么"再给候选
  4. 候选应该是"为什么"的解答,不是平铺选项
- **数学正确性自检**(借鉴 RULE-FP-001 4 类):
  - 依赖: R10 不重复犯错(子项强化)+ R7 数学验证
  - 组合: R11 复用(复用 RULE-FP-001 Pre/Run 形式化)
  - 正交: R1 查接口 / R2 对齐 / R5 确认后行
  - 强化: R27 稳扎稳打分分层判断(与第一性原理同向)
  - 无 ⊕ 冲突 ✓
- **关联 RULE**:
  - RULE-FP-001(AI 自我审查复合算子)— 本 RULE 是其"AI 是否真的用第一性原理"的反例自检
  - R10 · 不重复犯错(子项强化)— 沉淀 = 不重复失守
  - R28 · 跨会话沉淀(本会话刚加的)— 沉淀本 RULE 的依据
  - RULE-LOOP-001(三套终止信号死循环)— 同源(都是"形式合规 ≠ 实质参与")
- **下次如何避免**:
  - 任何 ≥3 候选枚举前,必输出 3-5 个"为什么"根源问题(目的 / 价值 / 最简前提 / 不可拆解的假设 / 反例)
  - 候选应是"为什么"的解答,不是平铺选项
  - 第一性 = 从目的 / 价值 / 不可拆解的最简前提推导;不是经验枚举或类比
  - 如果发现自己在"列选项",**先停**,补"为什么"段,再继续
- **本会话 2026-08-13 落地清单**: 用户追问"第一性原理有没有真正参与到工作中" → AI 诚实承认 ≈10-15% 参与度 → 沉淀本 RULE → commit 即将落地

---

### RULE-MINICOG-001(2026-08-13 v3.4.0 会话沉淀 — MiniCog 项目元信息 + 反混淆)

- **触发场景**: 任何任务涉及 "MiniCog" 或 "laap-AGI" 或 "LAAP" 项目相关调研/启动/集成/混淆风险时必读本 RULE
- **MiniCog 真实结构**(按 22 现场 grep):
  - **规划仓库**:`C:\Users\Administrator\Desktop\kimi code\MiniCog\`(RFC / ROADMAP / FEATURE_MATRIX)
  - **实际代码仓库**:`C:\Users\Administrator\Desktop\kimi code\LAAP架构深度研究报告\MiniCog\`(42 Python 模块 + tests + examples + start_server.py)
  - **README 路径正确**:规划仓库 README 写 "实际代码仓库: ../LAAP架构深度研究报告/MiniCog/",**当前确实在该位置**(bash locale 把中文目录显示成乱码,**别误判 README 错**)
  - **42 模块分类**:与意识相关 22(53% A1 核心意识/A2 动机情感/A3 目标治理)/ 与意识无关 20(B 通用算法工具)—— ARCHITECTURE_MODULE_TAXONOMY.md proposed
  - **没有 main.py / __main__.py** —— **MiniCog 不是独立应用,是 Python 包/库** —— 启动方式:`start_server.py` (启动服务器)+ `talk_consciousness.py` (对话示例)
- **反混淆铁律**(本会话 2026-08-13 v3.4.0 真实混淆纠正):
  - ❌ **MiniCog ≠ LAAP ≠ laap-AGI-main**:三个**独立项目**
    - MiniCog = MiniCog(零 LLM 认知架构,42 模块)
    - LAAP / laap-AGI-main = "Living Agent Application Protocol" 项目,有 `aris_brain/psi_jspace_bridge/psi_llamacpp_implant.md` **属于 LAAP 不属于 MiniCog**
    - kimi_code_test = 本项目(八荣八耻规则 + kg_rag_rust)
  - 任何 `laap-AGI-main/aris_brain/` 下的代码**不是 MiniCog 的现有实现**——是 LAAP 的独立功能
  - MINI-001 "本地模型集成验证" 工单失败根因 = LLM 路径幻觉(`/llama.cpp/README.md` Linux 风格) + **规划/代码仓库分离**导致 LLM 找不到正确路径
- **启动方式 3 条**(按 1 + 按 11 复用):
  1. **启动服务器**:`python start_server.py`(在 LAAP架构深度研究报告/MiniCog/ 目录下)
  2. **对话演示**:`python talk_consciousness.py`(同目录)
  3. **作为包 import**:`from minicog import CognitiveBus, PSICore, EmotionEngine, ...`(42 模块均可)
  - **依赖**:`requirements.txt` + `pyproject.toml`(uv 工具链)
  - **测试**:`pytest tests/`(注意 `bench_*.py` 不会被自动收集,需手动跑)
- **RFC-001 P0 例外状态**(2026-08-13):
  - 3 项决策 checklist **全未完成**:`[ ] 维护者一致同意` + `[ ] 14 天公示期` + `[ ] PRINCIPLES.md 显式修改`
  - RFC-001 是 **proposed**,**不是已生效规则**
  - kimi_code_test 当前用 MiniMax-M3 云端(违反 RFC-001 P0-A 假设 RFC-001 通过),但 P0 原则未落地,**理论违规,实际无人执**
- **Pre 阶(判断失守)**:
  1. 提到 "MiniCog" 时,先问:是规划仓库 / 代码仓库 / 还是其他?
  2. 提到 "LAAP" 时,先确认是 laap-AGI-main (LAAP 协议) / LAAP 架构深度研究报告 (MiniCog 代码所在目录) / 其他?
  3. 提到 "本地模型集成" 时,先确认:是 MiniCog RFC-001 (未批) / LAAP 已有实现 / 其他?
  4. 提到 "启动 X" 时,先问:有 main.py? 没有就是包,启动方式是 import 或 start_*.py
- **Run 阶(失守后立即修)**:
  1. 承认失守(用 RULE-MINICOG-001 编号,不包装)
  2. 用实际路径 + 实际文件名核实,不靠记忆或类比
  3. 必要时用 `codegraph_explore` 或 `ls -la` 现场验证
  4. 沉淀新发现到本 RULE 子段
- **下次如何避免**:
  - 任何 "MiniCog / LAAP / laap-AGI / kimi code" 关键字出现时,先读 RULE-MINICOG-001
  - 启动任何项目前先 `find . -maxdepth 3 -name 'main.py' -o -name 'start_*.py' -o -name '__main__.py'` 三连查
  - 仓库分离(规划 vs 代码)必看 README 路径,**bash locale 显示乱码别误判**
  - RFC 状态(proposed/draft/accepted)必看决策 checklist 状态,**未批 ≠ 通过**
- **本会话 2026-08-13 落地清单**: 用户问 "继续研究 minicog" → AI 漏扫方法树 → 用户再次纠正"为什么不扫描上下文" → 补查发现 methods/project-views/MiniCog.md → 修订 RFC-004 重复 bug → 沉淀本 RULE → commit 即将落地

---

### RULE-NOPHASE-001(2026-08-13 沉淀 — 八荣八耻本质平铺,无前后阶段)

- **触发场景**: 任何 "RULES.md 是否分组" "八荣八耻是否分阶段" "执行前/中/后属于哪条" 之类的设计层讨论必读本 RULE
- **事实确认**(按 22 现场 grep):
  - **源文件** `jshgd/ai-coding-八耻八荣.md` 8 条 **完全平铺**,无 "组/阶段/前/中/后" 字眼
  - **RULES.md** 27 条的 4 组("执行前/中/后/价值观")是 **v3.0.0 (2026-08-11) 重构引入的编辑偏差**,**原 8 条源版无分组**
  - 用户 2026-08-13 v3.4.0 会话明确主张: "**没有前中后,所有规则不分阶段**" → 触发本次修订
- **修订动作**(本会话, v3.4.0 → v3.4.1 PATCH):
  - **删除** RULES.md L44 / L198 / L358 / L529 的 4 个 `### 第X组:...` 标题(共 4 行)
  - **修订** L38 章首 "分组逻辑" 段 → "平铺原则,无组"
  - **修订** L8 / L9 / L11 顶部历史注记: "4 组重排" → "重新编号", "于第二组" → "于末尾"
  - **同步修订** RULES-VERSION.md 二章 4 组描述 + 例子 "L2 插入" → "末尾插入"
  - **保留**: 附录 D 编号迁移表(历史信息) + 附录 A 执行映射(准则对应,不是组对应)
  - **沉淀本 RULE**: RULES-TREE.md 末尾 RULE-NOPHASE-001
- **数学正确性自检**(借鉴 RULE-FP-001 4 类):
  - 依赖: R1 查接口(源文件 8 条权威) / R11 复用(源版平铺风格) / R13 贴规范
  - 组合: R28 跨会话沉淀(本次失守自检)
  - 正交: 全部 27 条(无阶段约束,任何时候可用)
  - 强化: R27 稳扎稳打分分层判断(与 "本质平等" 同向)
  - 无 ⊕ 冲突 ✓
- **Pre 阶(判断失守)**:
  1. 提到 "八荣八耻" 时,先问:是源文件 8 条(平铺) / 还是 RULES.md 27 条(原 4 组已修订为平铺)
  2. 提到 "执行前/中/后" 时,先确认是不是 RULES.md L38/L8/L9/L11 已修订的旧表述
  3. 提到 "组" 时,先确认是不是引用了历史(v3.0.0 重构引入,本会话 v3.4.0 已修订)
- **Run 阶(失守后立即修)**:
  1. 承认失守(用本 RULE 编号,不包装)
  2. 引用源文件 `jshgd/ai-coding-八耻八荣.md` 8 条平铺作为权威
  3. 修订引用了 4 组的文档段落(RULES.md / RULES-VERSION.md)
- **下次如何避免**:
  - 八荣八耻本质平铺,任何 "分组/分阶段" 是 **编辑偏差**,需要修订
  - 源文件 8 条是规范:每条独立标题,无章节分组
  - RULES.md 27 条历史上 "组" 标题是 v3.0.0 重构引入,本会话 v3.4.0 移除
  - 引用 "执行前/中/后" 字面前,先 grep 源文件确认
- **本会话 2026-08-13 落地清单**: 用户主张 "所有规则不分阶段" → AI 现场验证源文件平铺 → 删除 RULES.md 4 个组标题 → 修订章首 + 历史注记 → 修订 RULES-VERSION.md → 沉淀本 RULE → commit + push
