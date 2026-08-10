# 决策注释规范

代码中的简化、复用、边界和延期决策可写为：

```js
// eight-rules: reuse
// reason: 复用现有 UserRepository
// evidence: src/user/UserRepository.js
// ceiling: 跨服务事务出现时需要协调器
// upgrade: 事务需求确认后再升级
```

允许标签：`reuse`、`stdlib`、`native`、`dependency`、`minimal`、`security`、`rollback`、`deferred`、`assumption`、`boundary`。

`eight-rules:` 不是跳过安全或测试的许可证；它只记录有意的工程决策。
