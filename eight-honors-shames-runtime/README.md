# 八荣八耻 Runtime

把项目级八荣八耻从静态规则升级为可运行、可查询、可审计、可基准测试的 Pi 扩展。

## 当前能力

- 规则模式：`lite`、`full`、`ultra`、`off`
- 默认配置和 session 状态恢复
- `/rules` 命令：状态、审计、验收、基准、帮助
- 生命周期事件注入与任务验收记录
- `eight-rules:` 决策注释规范检查
- 不依赖外部服务的 Node 测试、规则检查和质量门禁
- 基准场景骨架，避免只用代码行数评价“优秀”

## 安装 / 开发

```bash
npm test
npm run check
npm run benchmark
npm run accept
```

Pi 中安装本地项目后可使用：

```text
/rules status
/rules lite
/rules full
/rules ultra
/rules off
/rules audit
/rules accept
/rules benchmark
```

## 设计原则

本项目补充 Ponytail 风格能力，但不把“少写代码”作为唯一目标。正确性、安全、验证、回滚、可访问性和用户原意优先；精简只能发生在理解上下文之后。

详细设计见 `docs/`。
