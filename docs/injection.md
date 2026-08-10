# 规则注入设计

为避免每轮重复塞 279 行规则，运行时按事件分层注入：

## session_start

- 注入完整规则全文
- 只发生一次
- 写入 `state.rulesInjected`

## before_agent_start

- 注入短摘要
- 注入当前模式门禁
- 提示"如需完整规则，使用 /rules audit 主动拉取"

## 用户执行 /rules audit

- 由命令路径返回完整规则文本
- 只在该次命令中追加，不重复注入历史

## 用户执行 /rules accept / benchmark

- 不注入额外规则
- 只走质量门禁和基准

## off 模式

- 不注入任何规则
- 仅保留安全底线

## 收益

`full` 模式下，每轮系统提示从 ~16KB 降为约 ~500B 摘要 + 门禁；`ultra` 同理。完整规则只在 session 启动时和按需 `audit` 时出现。
