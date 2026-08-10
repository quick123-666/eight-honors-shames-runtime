# .env

复制 `.env.example` 并填入真实值。`src/dotenv.js` 会按以下顺序加载：

```text
EIGHT_RULES_LLM=openai
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
OPENAI_API_KEY=...
EIGHT_RULES_DEFAULT_MODE=full
```

安全：

- `.env` 已被 `.gitignore` 忽略
- 仅本机进程可见，不会进入 git
- 不要把 `.env` 内容贴到聊天/issue/wiki
- key 泄露后请立刻在对应平台轮换
