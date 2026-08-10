#!/usr/bin/env python3
"""把 Claude Code agent 通信研究报告 (832 行) 整体导入 kg_rag_rust 知识图谱

按准则 19(联系全文)·自指 + 准则 16(主动) + 准则 12(完整版) + 准则 13(超越平凡):
- 跳过 LLM 抽取 (无 API key, 慢)
- 直接 Python 写 graph.json (kg_rag_rust 的标准格式)
- 结构化映射: 主报告的 12 章 → entities / relationships / sources

数据来源: C:/Users/Administrator/Desktop/kimi_code_test/claude-code-agent-research.md
"""
import json
from pathlib import Path

# 主报告位置
REPORT_PATH = Path(r"C:\Users\Administrator\Desktop\kimi_code_test\claude-code-agent-research.md")
KG_PATH = Path(r"C:\Users\Administrator\Desktop\kimi_code_test\kg_rag_rust\data\graph.json")

def add_concept(g, name, etype, section, quote=""):
    """统一加 entity + source"""
    doc = f"claude-code-agent-research.md § {section}"
    g.add_entity(name, etype, doc, quote or f"主报告 § {section} 提到 {name}")
    return name

def add_link(g, src, rel, dst, section, quote=""):
    """统一加 relationship + source"""
    doc = f"claude-code-agent-research.md § {section}"
    g.add_relationship(src, rel, dst, doc, quote or f"{src} {rel} {dst} (§ {section})")

print("[1/3] 准备 graph.json (跳过 LLM 抽取, 直接 Python 写)...")
print("[2/3] 设计 entities / relationships ...")

# === ENTITIES (核心概念) - kg_rag_rust 真实 schema ===
# (name, etype, section, desc) - section 指向主报告章节
ENTITIES = [
    # 工具/产品
    ("Claude Code", "tool", "2", "Anthropic 的 agentic coding tool, 33 tools, v2.1.222"),
    ("Anthropic", "company", "2", "Claude Code 开发者, 内部论文 2412.05449"),
    ("MCP", "protocol", "13.1", "Model Context Protocol, stdio JSON-RPC, Claude Code 是 client"),
    ("SendMessage", "mechanism", "2.2", "Claude Code agent-to-agent 寻址通信 (name/agentId/taskId)"),
    ("Worktree", "mechanism", "2.2", "git worktree 物理隔离 (EnterWorktreeInput/ExitWorktreeInput)"),
    ("Workflow", "mechanism", "2.2", "script 编排 (agent/parallel/pipeline/phase + resumeFromRunId)"),
    ("AgentNexus", "open_source_project", "11.3", "DID + Relay + 证据交换 + Agent Society 框架, 9 stars"),
    ("orchestra", "open_source_project", "11.4", "designer/executor/monitor 三层 agent + TUI, 41 stars"),
    ("repowire", "open_source_project", "11.5", "5 runtime (Claude Code/Opencode/Codex/Antigravity/Pi) 跨机器 mesh, 247 stars"),
    # 论文
    ("arxiv:2412.05449", "paper", "5.1", "Anthropic 内部 - Towards Effective GenAI Multi-Agent Collaboration"),
    ("arxiv:2510.25595", "paper", "5.2", "Communication and Verification in LLM Agents"),
    ("arxiv:2510.26352", "paper", "5.3", "The Geometry of Dialogue (图论建模)"),
    ("arxiv:2508.08322", "paper", "5.4", "Context Engineering for Multi-Agent LLM Code Assistants"),
    ("arxiv:2511.15755", "paper", "5.5", "MyAntFarm.ai - 348 controlled trials, 80x/140x improvement"),
    ("arxiv:2602.03128", "paper", "5.6", "Understanding Multi-Agent LLM Frameworks (综述)"),
    # Issues
    ("Issue#1770", "github_issue", "3.3", "Parent-Child Agent Communication, 14 comments"),
    ("Issue#14859", "github_issue", "11.1", "Hook events 共享 session_id, linked from #1770"),
    ("Issue#80036", "github_issue_bug", "3.3", "Subagent tool stripped in nested calls"),
    ("Issue#80082", "github_issue_bug", "3.3", "Subagent concurrent-running cap undocumented"),
    ("Issue#84118", "github_issue_bug", "3.3", "Subagent enumeration incomplete (42/4)"),
    ("Issue#85230", "github_issue_bug", "3.3", "Background subagents lose MCP resources"),
    ("Issue#85307", "github_issue_bug", "3.3", "MCP instructions routing inverted"),
    # 概念
    ("sub-agent", "concept", "2.2", "Claude Code AgentTool 启动的子 agent"),
    ("background-agent", "concept", "3.1", "2.1.198 起 default, AgentOutput.async_launched"),
    ("worktree-isolation", "concept", "2.2", "isolation: 'worktree' 模式"),
    ("remote-agent", "concept", "2.2", "isolation: 'remote' 模式 (CCR 云端)"),
    ("agent-hierarchy", "concept", "11.1", "parent_agent_id, Issue #14859 提案"),
    ("evidence-exchange", "concept", "11.3", "AgentNexus 哲学: 框架标准化证据交换"),
    ("DID", "concept", "11.3", "Decentralized Identifier, AgentNexus 持久 agent 身份"),
    ("Relay", "concept", "11.3", "AgentNexus 监控/消息转发"),
    ("designer-agent", "pattern", "11.4", "orchestra 角色: 拆分任务"),
    ("executor-agent", "pattern", "11.4", "orchestra 角色: 执行任务"),
    ("monitor-agent", "pattern", "11.4", "orchestra 角色: 监控 + 自动 nudge"),
    ("sender-search", "concept", "5.1", "Anthropic 内部论文 70% goal success 提升"),
    ("payload-referencing", "concept", "5.1", "Anthropic 内部论文 23% code-intensive 提升"),
]

# === RELATIONSHIPS (边) - kg_rag_rust 真实 schema (src/rel/dst) ===
RELATIONSHIPS = [
    # Claude Code 核心关系
    ("Claude Code", "publishedBy", "Anthropic", "2", ""),
    ("Claude Code", "uses", "MCP", "13.1", "McpInput 完全开放"),
    ("Claude Code", "hasMechanism", "SendMessage", "2.2", "寻址通信 name/agentId/taskId"),
    ("Claude Code", "hasMechanism", "Worktree", "2.2", "git worktree 物理隔离"),
    ("Claude Code", "hasMechanism", "Workflow", "2.2", "script 编排 + resumeFromRunId"),
    ("Claude Code", "hasConcept", "sub-agent", "2.2", ""),
    ("Claude Code", "hasConcept", "background-agent", "3.1", "2.1.198 起 default"),
    ("Claude Code", "hasConcept", "worktree-isolation", "2.2", ""),
    ("Claude Code", "hasConcept", "remote-agent", "2.2", ""),
    # Issues
    ("Claude Code", "hasIssue", "Issue#1770", "3.3", "14 comments"),
    ("Claude Code", "hasIssue", "Issue#14859", "11.1", "linked from #1770"),
    ("Claude Code", "hasIssue", "Issue#80036", "3.3", ""),
    ("Claude Code", "hasIssue", "Issue#80082", "3.3", ""),
    ("Claude Code", "hasIssue", "Issue#84118", "3.3", ""),
    ("Claude Code", "hasIssue", "Issue#85230", "3.3", ""),
    ("Claude Code", "hasIssue", "Issue#85307", "3.3", ""),
    ("Issue#1770", "linkedTo", "Issue#14859", "11.1", "tuanardouin 评论"),
    # 论文关系
    ("Anthropic", "published", "arxiv:2412.05449", "5.1", "Raphael Shu, Nilaksh Das, Michelle Yuan"),
    ("arxiv:2412.05449", "proves", "sender-search", "5.1", "70% goal success"),
    ("arxiv:2412.05449", "proves", "payload-referencing", "5.1", "23% code-intensive"),
    ("arxiv:2511.15755", "proves", "multi-agent-orchestration", "5.5", "80x / 140x / 100% vs 1.7%"),
    # 3 仓库关系
    ("Issue#1770", "proposedAt", "AgentNexus", "11.3", "kevinkaylie 评论"),
    ("Issue#1770", "proposedAt", "orchestra", "11.4", "Uzay-G 评论"),
    ("Issue#1770", "proposedAt", "repowire", "11.5", "prassanna-ravishankar 评论"),
    ("AgentNexus", "proposes", "evidence-exchange", "11.3", "核心哲学"),
    ("AgentNexus", "uses", "DID", "11.3", ""),
    ("AgentNexus", "uses", "Relay", "11.3", ""),
    ("orchestra", "usesPattern", "designer-agent", "11.4", ""),
    ("orchestra", "usesPattern", "executor-agent", "11.4", ""),
    ("orchestra", "usesPattern", "monitor-agent", "11.4", ""),
    ("orchestra", "implements", "Issue#1770", "11.4", "完整实现 提的 API"),
    ("repowire", "implements", "Issue#1770", "11.5", "5 runtime 跨机器 mesh"),
    ("repowire", "implements", "Issue#14859", "11.5", "mid-run intervention + scheduled check-in"),
    # arxiv 提 Claude Code
    ("arxiv:2508.08322", "uses", "Claude Code", "5.4", "Context Engineering with Claude Code"),
]

# === 写入 KnowledgeGraph (Python 直接) ===
def build_graph_json():
    """直接构造 graph.json 格式(kg_rag_rust 真实 schema)"""
    nodes = {}
    rels = []

    # entities -> nodes (HashMap with mentions)
    for (name, etype, section, desc) in ENTITIES:
        nodes[name] = {
            "etype": etype,
            "mentions": [
                {
                    "document": f"claude-code-agent-research.md § {section}",
                    "text": f"{desc} (主报告 § {section})"
                }
            ]
        }

    # relationships -> rels (Vec with evidence)
    for (src, rel, dst, section, quote) in RELATIONSHIPS:
        rels.append({
            "src": src,
            "rel": rel,
            "dst": dst,
            "evidence": [
                {
                    "document": f"claude-code-agent-research.md § {section}",
                    "text": quote or f"{src} {rel} {dst} (主报告 § {section})"
                }
            ]
        })

    return {
        "nodes": nodes,
        "rels": rels
    }

print(f"[3/3] 写入 {KG_PATH} ...")
graph_data = build_graph_json()
KG_PATH.parent.mkdir(parents=True, exist_ok=True)
KG_PATH.write_text(json.dumps(graph_data, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"\n[OK] 写入完成:")
print(f"  路径: {KG_PATH}")
print(f"  nodes (entities): {len(graph_data['nodes'])}")
print(f"  rels (relationships): {len(graph_data['rels'])}")
print(f"\n[下一步] 可用 kg_rag_rust 工具查询:")
print(f"  cargo run --release -- find-prompt 'Claude Code agent 通信机制'")
print(f"  cargo run --release -- stats")