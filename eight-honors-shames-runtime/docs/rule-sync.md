# 规则同步

运行时不再复制一份八荣八耻正文。`src/config.js` 每次启动从父项目最新版 `../RULES.md` 读取，`full` 和 `ultra` 直接注入全文；`lite` 只注入摘要并显示来源和准则数量。

规则来源：

```text
C:\Users\Administrator\Desktop\kimi_code_test\RULES.md
```

检查：

```bash
npm run check
```

检查失败时，表示规则文件不可读、准则数量不足或核心标题缺失；不得静默使用过期副本。
