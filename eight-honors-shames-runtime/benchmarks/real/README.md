# fake-express-app 实验仓库说明

`benchmarks/real/fake-express-app/` 是**独立 git 仓库**，用于 off/full 真实 LLM 对照实验，不嵌入外层仓库（避免 gitlink 丢失内容）。

## 分支结构

```text
* 18d69fe full-task1   (baseline → full 模式 task1)
| * c3fd311 off-task1  (baseline → off 模式 task1)
|/
* 9ddbf22 baseline
```

- `off-task1`：不注入八荣八耻，直接完成任务
- `full-task1`：注入 full 摘要 + 门禁后完成任务
- 两者都是 baseline 的子分支，diff 可精确对比

## 对照结果（task1：复用 filterActive 加 /api/users 过滤）

| 指标 | off (c3fd311) | full (18d69fe) |
|---|---|---|
| 改动行数 | 18 (6+13-1) | 43 (11+33-1) |
| 集成测试 | 1 | 3 |
| 处理分支 | active=true | true/false/未传 |
| 解析函数 | 无 | parseActive |
| 新增依赖 | 0 | 0 |
| 复用 filterActive | 是 | 是 |

## 查看 diff

```bash
git -C benchmarks/real/fake-express-app diff 9ddbf22 c3fd311   # off
git -C benchmarks/real/fake-express-app diff 9ddbf22 18d69fe   # full
```

## 重新初始化（如被删除）

```bash
mkdir -p benchmarks/real/fake-express-app
cd benchmarks/real/fake-express-app
git init
# 按 benchmarks/scenarios/scenarios.json 重建项目骨架并 commit baseline
```

## 安全

- 该仓库仅含虚构演示代码，无任何真实凭据
- 真实 benchmark 报告输出到 `benchmarks/real/reports/`（不进 git）
