"""
精确分析 QClaw 真实 token 消耗
- toolResult 是独立 role(content 为 text 块的 JSON)
- 估算: 中英混合按 3 char/token
"""
import sqlite3, json
from collections import Counter, defaultdict

DB = r'C:/Users/Administrator/.openclaw/agents/main/agent/openclaw-agent.sqlite'
conn = sqlite3.connect(DB)
cur = conn.cursor()
rows = cur.execute('SELECT session_id, seq, event_json, created_at FROM transcript_events ORDER BY created_at').fetchall()

def est_tokens(text: str) -> int:
    if not text: return 0
    return max(1, len(text) // 3)

def extract_text(content):
    """提取 content(字符串或 block 列表)的纯文本"""
    if content is None: return ''
    if isinstance(content, str): return content
    if isinstance(content, list):
        parts = []
        for c in content:
            if isinstance(c, dict):
                if c.get('type') == 'text':
                    parts.append(c.get('text', ''))
                elif c.get('type') == 'tool_use':
                    parts.append(json.dumps(c.get('input', {}), ensure_ascii=False))
                else:
                    parts.append(json.dumps(c, ensure_ascii=False))
        return '\n'.join(parts)
    return str(content)

# 按会话 + 角色统计
sessions = defaultdict(lambda: defaultdict(int))  # sid -> role -> tokens
role_total = Counter()
tool_total = Counter()
grand = 0
msg_count = Counter()

for sid, seq, ej, ts in rows:
    try: ev = json.loads(ej)
    except: continue
    if ev['type'] != 'message': continue
    msg = ev['message']
    role = msg.get('role', '?')
    text = extract_text(msg.get('content'))
    t = est_tokens(text)
    grand += t
    sessions[sid][role] += t
    role_total[role] += t
    msg_count[role] += 1

    # 工具名(从 assistant 的 tool_use 提取)
    if role == 'assistant' and isinstance(msg.get('content'), list):
        for c in msg['content']:
            if isinstance(c, dict) and c.get('type') == 'tool_use':
                tool_total[c.get('name', '?')] += 1

print("=" * 55)
print("QClaw 真实 token 消耗分析(估算)")
print("=" * 55)
print(f"时间范围: 2026-08-03 ~ 08-09 (7 天)")
print(f"总估算: {grand:,} tokens / {sum(msg_count.values())} 条消息 / {len(sessions)} 个会话")
print()

print("--- 按角色 ---")
for role, cnt in role_total.most_common():
    print(f"  {role:12s} {cnt:>8,} tok ({cnt/max(grand,1)*100:5.1f}%)  {msg_count[role]} 条")
print()

# tool 输出占比(toolResult 角色)
tool_out = role_total.get('toolResult', 0)
asst = role_total.get('assistant', 0)
user = role_total.get('user', 0)
print(f"  tool 输出(toolResult): {tool_out:,} tok = {tool_out/max(grand,1)*100:.1f}%  ← 压缩可省的部分")
print(f"  助手回复(assistant):   {asst:,} tok = {asst/max(grand,1)*100:.1f}%  ← 输出 token(压缩不可省)")
print(f"  用户输入(user):        {user:,} tok = {user/max(grand,1)*100:.1f}%")
print()

print("--- 按会话 ---")
for sid, roles in sorted(sessions.items(), key=lambda x: -sum(x[1].values())):
    total = sum(roles.values())
    print(f"  [{sid[:8]}] {total:>8,} tok  {dict(roles)}")
print()

print("--- 工具调用频率 Top 20 ---")
for tool, cnt in tool_total.most_common(20):
    print(f"  {tool}: {cnt}")
print()

# tool 输出大小分布(找大输出)
print("--- tool 输出大小分布(找大块) ---")
big_tools = []
for sid, seq, ej, ts in rows:
    try: ev = json.loads(ej)
    except: continue
    if ev['type'] != 'message': continue
    msg = ev['message']
    if msg.get('role') != 'toolResult': continue
    text = extract_text(msg.get('content'))
    t = est_tokens(text)
    big_tools.append((t, sid[:8], seq, text[:80]))
big_tools.sort(reverse=True)
print(f"tool 输出总数: {len(big_tools)} 条, 平均 {sum(x[0] for x in big_tools)/max(len(big_tools),1):.0f} tok")
print("Top 10 最大 tool 输出:")
for t, sid, seq, prev in big_tools[:10]:
    print(f"  {t:>7,} tok  [{sid}] seq={seq}: {prev!r}")
conn.close()