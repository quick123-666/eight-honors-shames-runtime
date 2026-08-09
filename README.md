# kimi_code_test

> 项目目录 · 当前活跃项目:**知识图谱 RAG + 可验证引用**(纯 Rust 版,无需 Neo4j/Ollama/Docker)

## 项目

### 📚 `kg_rag_rust/` — 知识图谱 RAG + 可验证引用(**当前版本**)

基于知识图谱的多跳 RAG,支持**可验证引用**([N] 标注 + 源文档/原文/推理路径)。完整 Rust 实现,无任何外部服务依赖(零 Neo4j / 零 Ollama / 零 Docker)。

- **推理**:`MiniMax M3` API(anthropic-messages 协议,环境变量配置)
- **图存储**:纯 Rust 内存图 + JSON 持久化(`data/<name>.graph.json`)
- **语义检索**:本地 TF-IDF 余弦(零向量库依赖)
- **多跳遍历**:BFS 可变深 + 推理路径 + 证据回溯
- **持久化**:图 JSON 自动写入指定文件
- **批量导入**:`batch <dir>` 子命令(目录扫描)

**快速启动**:
```bash
cd kg_rag_rust
# 配置 MiniMax M3 key(.env 或环境变量 MINIMAX_API_KEY)
cargo build --release
./target/release/kg_rag_rust.exe add-doc mydoc "GraphRAG was developed by Microsoft Research..."
./target/release/kg_rag_rust.exe batch notes/ --ext md
./target/release/kg_rag_rust.exe ask "Who developed GraphRAG?"
./target/release/kg_rag_rust.exe find "<query>"        # 语义检索最相似文档
```

详细文档见 [`kg_rag_rust/README.md`](./kg_rag_rust/README.md)。

### 📦 `TokenThrottle/` — token 统计工具(Rust,历史项目)

历史项目,详见 [`TokenThrottle/README.md`](./TokenThrottle/README.md)。

### 📊 `analyze_tokens.py` — token 分析脚本

旧版 Python 工具,统计 LLM 调用 token。

---

## 项目结构

```
kimi_code_test/
├── AGENTS.md           # 工作纪律(八耻八荣)
├── RULES.md            # 完整纪律
├── analyze_tokens.py   # 旧 token 工具
├── TokenThrottle/      # Rust token 工具(历史)
├── TokenThrottle.zip
└── kg_rag_rust/        # ⭐ 当前主项目:知识图谱 RAG
    ├── Cargo.toml
    ├── src/
    │   ├── main.rs        # CLI:add-doc / batch / find / find-prompt / ask / clear / stats
    │   ├── llm.rs         # MiniMax M3 HTTP 客户端
    │   ├── graph.rs       # 纯 Rust 知识图谱(内存 + JSON 持久化)
    │   ├── semantic.rs    # TF-IDF 余弦语义检索
    │   ├── answer.rs      # 检索 → 遍历 → 引用答案主流程
    │   └── models.rs      # 数据模型
    ├── .env              # MiniMax API key(本地,不入 git)
    ├── README.md
    └── data/             # 图数据持久化目录(运行时生成)
```

## 已被替代的旧版本(已清理)

- ~~`knowledge_graph_rag.py` + `requirements.txt` + `docker-compose.yml`~~(Python 精简版,166 行)
- ~~Neo4j + Ollama + Streamlit 依赖~~(需 Docker)

**原因**:RULE-COMPLETE-001(禁止精简版)+ RULE-RUST-001(Rust 优先)。kg_rag_rust 是完整 Rust 版,功能覆盖原版全部(实体抽取/图存储/语义检索/多跳遍历/强制引用),且零外部服务依赖。

> **原则【准则 12 完整版 + 准则 13 超越平凡 + 准则 14 通俗易懂】**:`RULES.md` § 三 准则 12-14 — 12 保证不缩范围,13 保证做出彩,14 保证面对用户表达通俗易懂(不堆砌代码/术语淹没用户)。

---

> 当前活跃项目:**kg_rag_rust**。其余子项目(TokenThrottle/analyze_tokens.py)仅作历史归档。