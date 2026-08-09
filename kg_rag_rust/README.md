# kg_rag_rust — 知识图谱 RAG + 可验证引用(完整 Rust 版,零 Docker)

基于知识图谱的多跳 RAG,支持**可验证引用**([N] 标注 + 源文档/原文/推理路径)。完整复刻 awesome-llm-apps 的 `knowledge_graph_rag_citations` 模式,纯 Rust 实现(RULE-RUST-001),**无 Docker、无 Neo4j、无本地模型** — 推理用 **MiniMax M3 API**,图存储用 Rust 内存图 + JSON 持久化。

## 架构

```
文档 → MiniMax M3 抽取实体/关系(JSON)→ Rust 内存图(JSON 持久化,带 Source 出处)
查询 → 语义检索(TF-IDF 余弦)+ 词匹配 → 多跳图遍历(depth=2)→ MiniMax M3 生成 [N] 引用答案
```

图模型(每条事实带来源,可验证):

```
Entity {name, type, mentions:[Source]}              ← 实体出现出处
Rel {src, rel, dst, evidence:[Source]}              ← 关系 + 证据出处
Source {document, text}                             ← 源文档 + 原文片段
```

## 功能清单(完整版)

| 功能 | 实现 | 文件 |
|---|---|---|
| 文档 → 实体/关系抽取 | MiniMax M3 JSON 三元组 + 容错解析 | `llm.rs` |
| 图存储 + 来源溯源 | 纯 Rust 内存图(mentions/evidence) | `graph.rs` |
| semantic_search 语义检索 | 本地 TF-IDF 余弦(零向量库依赖) | `semantic.rs` |
| 实体匹配 | 查询词 → 起始实体 | `graph.rs find_start_entities` |
| 多跳遍历 | BFS 可变深 + 推理路径 + 证据回溯 | `graph.rs traverse` |
| 强制 [N] 引用 | 答案 prompt 强制引用 + 引用详情(文档/原文/路径) | `llm.rs`/`answer.rs` |
| 持久化 | 图 JSON 自动存 `data/graph.json` | `graph.rs save/load` |
| 交互 | CLI:add-doc / ask / clear / stats | `main.rs` |

## 快速启动

```bash
# 1. 配置 MiniMax M3 key
#    .env 文件:MINIMAX_API_KEY=sk-cp-...(优先)
#    或环境变量 export MINIMAX_API_KEY=sk-...

# 2. 编译
cargo build --release

# 3. 存入文档(文本或文件路径)
./target/release/kg_rag_rust add-doc sample "GraphRAG was developed by Microsoft Research. Darren Edge led the project."

# 4. 提问(带引用)
./target/release/kg_rag_rust ask "Who developed GraphRAG?"
```

## 实测输出(MiniMax M3,端到端跑通)

```
=== Answer ===
According to the evidence, GraphRAG was developed by Microsoft Research,
with Darren Edge leading the project [1][2][3].

=== Citations ===
[1] `sample`
> GraphRAG was developed by Microsoft Research. Darren Edge led the project...
  Path: GraphRAG <-[developed]- Microsoft Research
[2] `sample`   Path: GraphRAG <-[led]- Darren Edge
[3] `sample`   Path: Microsoft Research -[developed]-> GraphRAG

=== Reasoning Trace ===
  🔍 语义检索知识图谱: 'Who developed GraphRAG?'
  📊 语义检索命中 3 个实体
  🎯 起始实体: ["GraphRAG", "Microsoft Research", "Darren Edge"]
  🔗 从起始实体做 2 跳遍历
```

## 命令速查

| 命令 | 说明 |
|---|---|
| `add-doc <名> <文本\|路径>` | MiniMax M3 抽取并存储文档到图谱 |
| `batch <目录> [--ext md,txt] [--pattern <子串>]` | 批量扫描目录导入(顺序抽取) |
| `ask "<问题>" [--depth N]` | 语义检索 + 多跳遍历 + 引用答案 |
| `clear` | 清空图谱 |
| `stats` | 查看实体/关系统计 |

通用参数:`--data data/graph.json`(图数据文件路径)

## 配置

| 设置 | 默认 |
|---|---|
| MiniMax 端点 | `https://api.minimaxi.com/anthropic/v1/messages` |
| 模型 | `MiniMax-M3` |
| key | `.env` 的 `MINIMAX_API_KEY`(优先)或环境变量 |
| 图数据 | `data/graph.json`(自动持久化) |

> 安全:.env 已入 .gitignore,key 不进版本库。
