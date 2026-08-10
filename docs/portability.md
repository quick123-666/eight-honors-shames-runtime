# 多平台适配（Agent Portability）

八荣八耻运行时可在多个宿主上使用。核心规则单一来源：`RULES.md`，各平台只做适配副本/注入，不复制规则正文。

| 宿主 | 集成方式 | 注入策略 | 命令 |
|---|---|---|---|
| **Pi** | `pi-extension/`（扩展）+ `skills/` | session 全文 + 每轮摘要 | `/rules` 全套 |
| **MCP 宿主** | `mcp/server.js`（stdio, 只读） | 按需拉取 `rules_summary/full/status` | MCP 工具 |
| **Claude Code** | `hooks/` + `commands/`（转 .md） | 生命周期钩子 | `/rules` 映射 |
| **Codex** | `hooks/` + 技能 | 每轮注入摘要 | `/rules` 转技能 |
| **OpenCode** | `hooks/` + `commands/` | 插件每轮注入 | `/rules` |
| **Gemini CLI** | 扩展 + `hooks/` | 会话级注入 | `/rules` |
| **OpenClaw** | `skills/`（复制） | 任务级激活 | 技能触发 |
| **指令型（Cursor/Windsurf/Cline/Copilot）** | 复制 `AGENTS.md` 到项目 | 静态规则 | 无命令 |

## 注入成本（实测）

| 模式 | 每轮注入 | 与全文比 |
|---|---|---:|---:|
| full | ~252 B（摘要+门禁）| 全文的 2% |
| ultra | ~293 B | 全文的 2.3% |
| off | 0 | — |

> 完整规则只在 session_start 注入一次 + `/rules audit` 按需拉取。避免每轮重复塞全文。

## 关键约束

```text
1. 禁止精简系统（用户硬约束）
2. 规则单一来源 = RULES.md，任何适配不得内嵌规则副本
3. 凭据只走环境变量/平台凭据库，不落 .env 明文（除非用户明确配置）
```

## Pi 接入记录（2026-08-10）

- 接入方式：`pi-extension/index.js` 作为扩展桥接 + `skills/` 技能注册（5 个技能）
- 注入策略：session 全文一次 + 每轮摘要；`/rules` 命令全套
- 生效方式：重启 Pi 后 `/rules` 可用；已加载旧扩展的会话需重启生效
