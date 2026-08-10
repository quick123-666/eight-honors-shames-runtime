# Hooks 生命周期层

第一版定义统一事件协议：`session_start`、`before_agent_start`、`before_tool_call`、`after_tool_call`、`after_agent_stop`、`session_end`。

当前 Pi 扩展已实现 session 恢复和 before-agent 注入；其余事件保留为后续适配点，不能假设宿主 API 已提供。
