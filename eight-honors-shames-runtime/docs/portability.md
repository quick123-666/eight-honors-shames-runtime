# 技术栈和依赖边界

第一版只使用 Node.js 内置模块和 Pi Extension API，不引入外部服务、数据库或重型工作流框架。

后续只有在真实需求出现时才增加：MCP SDK、schema 校验库、SQLite benchmark 存储或 Playwright E2E。每项依赖必须先说明已有能力无法覆盖的原因。
