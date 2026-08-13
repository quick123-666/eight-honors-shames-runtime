# MiniMax API 使用说明

> 沉淀:RULE-IX-SENSITIVE-DATA-001 实战案例 v3.4.10
>
> 适用:本会话 .env 中 `OPENAI_API_KEY=sk-cp-VbAr...` 实际为 **MiniMax platform API key**(前缀误判已校)

## 1. 端点与认证

| 项 | 值 |
|---|---|
| Base URL | `https://api.minimaxi.com/v1` |
| Auth header | `Authorization: Bearer $OPENAI_API_KEY` |
| Content-Type | `application/json` |
| 模型 | `MiniMax-M3`、`MiniMax-M2.7`、`MiniMax-M2.7-highspeed`(probe 实测) |
| Token-plan 文档 | <https://platform.minimaxi.com/docs/token-plan/intro> |
| Key 管理后台 | <https://platform.minimaxi.com/user-center/basic-information/interface-key> |

⚠ **环境变量名沿用 `OPENAI_API_KEY`**(因 MiniMax API 与 OpenAI 兼容 + 现有 .env 已固定),后续若用 Vault / 多 key 池再拆分。

## 2. 快速 verify(0 token 消耗)

```bash
set +o history                       # 关 shell 历史,防 token 残留
read OPENAI_API_KEY < <(grep -E '^OPENAI_API_KEY=' .env | sed 's/^OPENAI_API_KEY=//')
curl -s -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.minimaxi.com/v1/models | head -c 400
unset OPENAI_API_KEY
```

期望:`HTTP 200` + JSON `{"object":"list","data":[{"id":"MiniMax-M3",...}, ...]}`。

## 3. Chat completion(三选一)

### 3.1 curl

```bash
set +o history
read OPENAI_API_KEY < <(grep -E '^OPENAI_API_KEY=' .env | sed 's/^OPENAI_API_KEY=//')

curl -s -X POST https://api.minimaxi.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MiniMax-M3",
    "messages": [{"role":"user","content":"用 30 字介绍八荣八耻"}],
    "max_tokens": 80,
    "temperature": 0.5
  }'
unset OPENAI_API_KEY
```

### 3.2 Python(OpenAI SDK)

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url="https://api.minimaxi.com/v1",
)

resp = client.chat.completions.create(
    model="MiniMax-M3",
    messages=[{"role": "user", "content": "hi"}],
    max_tokens=20,
)
print(resp.choices[0].message.content)
```

### 3.3 Node.js(openai 包)

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.minimaxi.com/v1",
});

const r = await client.chat.completions.create({
  model: "MiniMax-M3",
  messages: [{ role: "user", content: "hi" }],
  max_tokens: 20,
});
console.log(r.choices[0].message.content);
```

## 4. Token 计数 & 计费

- `/v1/models` 返回的每个模型自带 `created`(Unix timestamp)+ `owned_by`(vendor 标识,如 `minimax` / `system` / `custom`)
- 计费按 token 量(输入 + 输出 分开计)
- token-plan:`https://platform.minimaxi.com/user-center/balance/token-plan-record` 查看余额与消耗
- 速率限制:实测前先用 `max_tokens=5` 的小请求探一下返回时间,根据 429 响应调整

## 5. 故障排查

| 错误 | 可能原因 |
|---|---|
| `HTTP 401 / login fail: Please carry the API secret key` | header 漏 `Bearer ` 前缀 / env 变量没读到 / shell 转义丢失 |
| `HTTP 401 / 令牌已过期` (中文) | ⚠ **key 失效** — 立刻去后台轮换(原 key 已在会话日志暴露,本就需 rotate) |
| `HTTP 403 / Request not allowed` | 用了 OpenAI 端点或模型名 |
| `HTTP 429` | 限速 / 配额用尽 → 等 60s 后重试 / 升级 token-plan |
| `request_id` | 报错返回的 `request_id` 字段贴给 MiniMax 客服可快速定位日志 |

## 6. 安全(SECURITY)

- **不**在代码 / commit / 公开场合出现完整 key — 走 `$OPENAI_API_KEY` 引用
- **不**用 `echo $KEY` / `cat .env` 在共享屏幕演示
- .env 已加 `.gitignore`(本会话 v3.4.10 已验证)
- pre-commit hook v3.4.10 已实装(2 段门禁),自动扫描 staged diff 不出现 raw secret
- 启用:`git config core.hooksPath .githooks`

## 7. 切换到 MiniMax SDK(可选)

虽然 OpenAI SDK 兼容 MiniMax 端点,MiniMax 官方也提供原生 SDK(若有优先使用,误差更低):

```bash
pip install minimax-python-sdk  # 占位 SDK 名(以官方为准)
```

本会话暂用 OpenAI SDK + base_url 替换,与 MiniMax 原生等价。

---

> **生成**:2026-08-13 v3.4.10 commit 配套
> **勘误历史**:本会话初始把 `sk-cp-VbAr...` 误判为 OpenAI key(commit v3.4.10 amend 后已修正 + 8 家端点探测确认归属)
> **下次如何避免**:陌生 prefix 时,先看 8 家常见 provider 的开放 pattern,再做 `curl /v1/models` 探测(HTTP 200 = 该家)
