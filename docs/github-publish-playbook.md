# GitHub 发布工作方法(实战版 Playbook)

> 沉淀自八荣八耻 runtime 公开发布实战(2026-08)。覆盖:脱敏打包 → 版本固定 → 安全推送 → 结构演进 → 专业 README → CI 门禁 → 验证。
> 与基础流程 skill(`github-publish`)互补:基础流程见彼,实战进阶见此。

---

## 0. 总原则

1. **推送单元 = 项目目录本身**,不是外层包装目录。若要公开发布某子目录,该子目录就是仓库根(内部文件自成一体,路径引用自洽)。
2. **公开内容不留内部痕迹**:个人路径、内部工具名、凭据路径、"脱敏"等字样一律不进仓库。
3. **单一来源**:规则/配置只在源头维护,分发产物由生成器产出 + 测试防漂移。
4. **不破坏远程**:远程已有内容先 fetch 合并;只有"结构调整"这种明确意图才 force。

---

## 1. 界定推送边界(先做这个)

```bash
# 决定仓库根:是整个项目,还是某个子目录?
# 若推送子目录 → 该目录是根,内部文件必须能自洽(见步骤 6 路径适配)
```

| 场景 | 推送单元 |
|---|---|
| 单项目仓库 | 项目根 |
| 大仓库中的可独立发布子项目 | 子项目目录(作为新仓库根) |

## 2. 脱敏扫描与清理

```bash
# 敏感模式全量扫描(路径/密钥/内部工具/邮箱)
grep -rInE "Administrator|jshgd|qclaw|openclaw|mr-llm|lsx-mp-rust|sk-[A-Za-z0-9]{10,}|Bearer [A-Za-z0-9]{15,}|password\s*[:=]|@[a-z0-9.-]+\.(com|cn)" . \
  --include="*.md" --include="*.js" --include="*.json" --include="*.toml" --include="*.yml"

# 运行时产物排除(node_modules/reports/数据/备份)
gitignore: node_modules/ coverage/ *.log benchmarks/reports/ .env 等
```

**处理原则**:
- 个人路径 → 通用化("来源:社区踩坑总结"而非 `C:\Users\...`)
- 内部工具段 → 整段删除(不属于项目本体)
- 凭据路径说明 → 改为"环境变量 + 平台凭据库"通用描述
- 功能代码里的平台标准凭据路径(如 `~/.pi/agent/auth.json` 这类**生态标准位置**,非个人路径)→ 保留,但文档侧不宣传
- **"脱敏"字样本身不进公开内容**(用户明确要求时)

## 3. 版本固定

```bash
# 同步版本到所有声明点
grep -rn '"version"' package.json mcp/package.json package-lock.json mcp/package-lock.json README.md
# 全部改到目标版本(如 1.0.0)后:
npm test                    # 回归
git tag v1.0.0              # 打 tag
```

**易漏点**:`package-lock.json` 的 version 字段、README 角落的版本标注、子包(如 mcp/)的 package.json。

## 4. 凭据安全(token 一次性 + GCM)

```bash
# 方式 A(一次性,不落盘):URL 内嵌 token,不进 config/reflog
git push "https://oauth2:${TOKEN}@github.com/owner/repo.git" main

# 方式 B(长效):修复 Git Credential Manager 后免 token
git config --global credential.helper manager   # 新版 GCM helper 名是 manager,不是 manager-core!
git push origin main                            # GCM 接管认证
```

**关键坑**:
- 新版 GCM 可执行文件 `git-credential-manager.exe`,helper 名 `manager`;旧配置写 `manager-core` 会报 `'credential-manager-core' is not a git command`
- `-c http.extraHeader="Authorization: Bearer ..."` 在 Windows git 上常被 GCM 拦截 → 直接 URL 内嵌最可靠
- **token 一旦明文出现(对话/命令行),完成推送后必须提醒用户撤销轮换**
- push 完成后检查:`git remote -v` 无 token、`.git/config` 无 token 残留

## 5. 仓库初始化与远程合并策略

```bash
git init -b main
git add -A && git commit -m "feat: ..."

# 远程已有内容(如 GitHub 自动生成的 README):
git fetch <url>
git merge FETCH_HEAD --allow-unrelated-histories   # 独立历史合并
# README 冲突 → 保留本地完整版:git checkout --ours README.md

# 只有明确的结构调整才 force:
git push --force origin main
git push --force origin v1.0.0
```

**判断**:能合并不 force;force 仅当"远程结构过时、必须整体替换"且无他人协作时。

## 6. 结构演进后的路径适配(推送单元变化时)

把规则文件从外层移入新仓库根后,**代码里的相对路径全链路检查**:

```bash
grep -rn "\.\./RULES\|\.\./AGENTS" src scripts tests docs README.md
# core.js 等入口的 rulesPath 从 ../RULES.md 改为 RULES.md(同级)
# 文档里的 ../RULES.md 引用同步改
# 适配文件(CLAUDE.md 等)的单一来源指针同步
```

改完必跑全量测试 + check,确认"规则从新根读到"。

## 7. 专业多语言 README(模板)

参考开源专业 README 结构:

```
badges(版本/许可/测试/Node/AI工具数)+ 多语言入口(README.md / README_EN.md)
标题 + 一句话价值 + 特性痛点
TOC
快速开始(30 秒命令)
安装(多工具安装配置表:工具→文件→位置→命令)
验证方法(问 AI 一句能验证的话)
命令表
实测数据(表格)
架构图(ASCII)
开发/凭据
约束
文档索引
License
```

**多工具安装配置表**(不同 AI 软件配置不同 md,这是发布 AI 类项目的关键):

| 工具 | 文件 | 位置 |
|---|---|---|
| Pi | AGENTS.md + extension | 项目根/~/.pi/agent |
| Claude Code | CLAUDE.md | 项目根 |
| Gemini CLI | GEMINI.md | 项目根或 ~/.gemini/ |
| GitHub Copilot | .github/copilot-instructions.md | 项目根 |
| Cursor | .cursorrules 或 .cursor/rules/*.mdc | 项目根 |
| Windsurf | .windsurfrules | 项目根 |
| Cline/Roo | custom-instructions.md | 设置里 |
| Codex/OpenCode | AGENTS.md | 项目根 |

**单一来源生成器**(推荐):`scripts/build-adapters.js` 从源文件生成各工具适配文件 + 测试断言"与源零漂移/不复制完整正文/无敏感内容"。

## 8. CI 门禁(仓库根生效)

```yaml
# .github/workflows/ci.yml — 注意:GitHub Actions 只认【仓库根】的 .github/
on: [push, pull_request]
jobs:
  test:
    steps: checkout → setup-node → npm ci → npm test → npm run check → benchmark
```

- check 前置"重新生成适配文件",从机制上杜绝"源改了分发产物没跟"
- 依赖锁文件(npm ci)保证可复现

## 9. 推送后验证(闭环)

```bash
git ls-remote origin                 # 分支/tag 都在
# 基于已提交内容做敏感扫描(不是工作区!)
git ls-files | while read f; do git show "HEAD:$f"; done | grep -icE "<敏感模式>"
git log --oneline                    # 提交信息干净
```

**验收清单**:
- [ ] 远程 main 指向最新提交
- [ ] tag 存在且指向正确
- [ ] 已提交内容敏感扫描 0 命中
- [ ] 无"脱敏"等内部字样
- [ ] README 安装表路径真实有效(有测试守护)
- [ ] CI workflow 在仓库根(会真正触发)

---

*来源:eight-honors-shames-runtime 公开发布实战(2026-08-10)· 方法树:发布 GitHub → 脱敏打包 → 安全推送 → 专业 README → CI 门禁*
