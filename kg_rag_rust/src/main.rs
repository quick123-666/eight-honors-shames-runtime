//! kg_rag_rust — 知识图谱 RAG + 可验证引用(完整 Rust 版,零 Docker)
//!
//! 架构(参考 knowledge_graph_rag_citations,完整复刻):
//!   文档 → MiniMax M3 抽取实体/关系 → Rust 内存图(JSON 持久化,带 Source 出处)
//!   查询 → 语义检索(TF-IDF 余弦)+ 实体匹配 → 多跳图遍历 → MiniMax M3 生成 [N] 引用答案
//!
//! 用法:
//!   kg_rag_rust add-doc <文档名> <文本|文件路径> [--data data/graph.json]
//!   kg_rag_rust ask "<问题>" [--depth 2] [--data data/graph.json]
//!   kg_rag_rust clear [--data data/graph.json]
//!   kg_rag_rust stats [--data data/graph.json]
use kg_rag_rust::{answer, graph, llm, models, semantic};

use anyhow::{Context, Result};

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        print_usage();
        return Ok(());
    }

    // 解析公共参数(--data 图数据文件路径)
    let mut data_path = "data/graph.json".to_string();
    let mut depth: u32 = 2;
    let mut rest: Vec<String> = Vec::new();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--data" => {
                i += 1;
                data_path = args.get(i).cloned().unwrap_or_default();
            }
            "--depth" => {
                i += 1;
                depth = args
                    .get(i)
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(2);
            }
            other => rest.push(other.to_string()),
        }
        i += 1;
    }
    if rest.is_empty() {
        print_usage();
        return Ok(());
    }

    match rest[0].as_str() {
        "add-doc" => {
            if rest.len() < 3 {
                anyhow::bail!("用法: add-doc <文档名> <文本或文件路径>");
            }
            let doc_name = &rest[1];
            let raw = &rest[2];
            let text = if std::path::Path::new(raw).exists() {
                std::fs::read_to_string(raw).with_context(|| format!("读文件 {raw}"))?
            } else {
                raw.clone()
            };
            let chunk = &text[..text.len().min(8000)];
            println!("[1/3] 调 MiniMax M3 抽取实体/关系…");
            let raw_out = llm::generate(&llm::extraction_prompt(chunk))?;
            let extraction = llm::parse_extraction(&raw_out);
            println!(
                "     抽取到 {} 实体 / {} 关系",
                extraction.entities.len(),
                extraction.relationships.len()
            );
            println!("[2/3] 写入知识图谱({data_path})…");
            let mut g = graph::KnowledgeGraph::new(&data_path);
            let ext = process_extraction(&mut g, doc_name, chunk, extraction);
            g.save()?;
            println!("[3/3] 完成。");
            for e in ext.entities.iter().take(20) {
                println!("  · {} ({})", e.name, e.etype);
            }
        }
        "batch" => {
            if rest.len() < 2 {
                anyhow::bail!("用法: batch <目录> [--ext md,txt] [--pattern *]");
            }
            let dir = &rest[1];
            let mut exts: Vec<String> = vec!["md".to_string(), "txt".to_string()];
            let mut pattern = String::new();
            let mut i = 2;
            while i < rest.len() {
                match rest[i].as_str() {
                    "--ext" => {
                        i += 1;
                        exts = rest
                            .get(i)
                            .map(|s| s.split(',').map(|x| x.trim().to_lowercase()).collect())
                            .unwrap_or(exts);
                    }
                    "--pattern" => {
                        i += 1;
                        pattern = rest.get(i).cloned().unwrap_or_default();
                    }
                    _ => {}
                }
                i += 1;
            }
            run_batch(dir, &exts, &pattern, &data_path)?;
        }
        "find-prompt" => {
            if rest.len() < 2 {
                anyhow::bail!("用法: find-prompt \"<查询>\"");
            }
            let mut top: usize = 5;
            let mut query_parts: Vec<String> = Vec::new();
            let mut i = 1;
            while i < rest.len() {
                match rest[i].as_str() {
                    "--top" => {
                        i += 1;
                        top = rest.get(i).and_then(|v| v.parse().ok()).unwrap_or(5);
                    }
                    other => query_parts.push(other.to_string()),
                }
                i += 1;
            }
            let query = query_parts.join(" ");
            let g = graph::KnowledgeGraph::new(&data_path);
            emit_find_prompt(&g, &query, top)?;
        }
        "find" => {
            if rest.len() < 2 {
                anyhow::bail!("用法: find \"<查询>\" [--top 5]");
            }
            let mut top: usize = 5;
            let mut query_parts: Vec<String> = Vec::new();
            let mut i = 1;
            while i < rest.len() {
                match rest[i].as_str() {
                    "--top" => {
                        i += 1;
                        top = rest.get(i).and_then(|v| v.parse().ok()).unwrap_or(5);
                    }
                    other => query_parts.push(other.to_string()),
                }
                i += 1;
            }
            let query = query_parts.join(" ");
            let g = graph::KnowledgeGraph::new(&data_path);
            run_find(&g, &query, top)?;
        }
        "ask" => {
            if rest.len() < 2 {
                anyhow::bail!("用法: ask \"<问题>\"");
            }
            let question = rest[1..].join(" ");
            let g = graph::KnowledgeGraph::new(&data_path);
            let answer = answer::answer_question(&g, &question, depth)?;
            println!("=== Answer ===\n{}", answer.answer);
            println!("\n=== Citations ===");
            for c in &answer.citations {
                println!(
                    "[{}] `{}`\n> {}\n  Path: {}\n",
                    c.number, c.document, c.text, c.path
                );
            }
            println!("=== Reasoning Trace ===");
            for t in &answer.reasoning_trace {
                println!("  {t}");
            }
        }
        "clear" => {
            let mut g = graph::KnowledgeGraph::new(&data_path);
            g.clear()?;
            println!("图谱已清空");
        }
        "stats" => {
            let g = graph::KnowledgeGraph::new(&data_path);
            let entities = g.all_entities();
            println!("实体数: {} / 关系数: {}", entities.len(), g.rels.len());
            for e in entities.iter().take(20) {
                println!("  · {} ({})  ← {}", e.name, e.etype, e.document);
            }
        }
        _ => print_usage(),
    }
    Ok(())
}

/// 输出 find-prompt 块:lsx 可直接拼进 Round 1 prompt
fn emit_find_prompt(g: &graph::KnowledgeGraph, query: &str, top: usize) -> Result<()> {
    let entities = g.all_entities();
    if entities.is_empty() {
        println!("[WORKFLOW-KG]\n(empty graph)\n[/WORKFLOW-KG]");
        return Ok(());
    }
    let scored = semantic::rank_entities(query, &entities, entities.len());
    let mut doc_scores: std::collections::HashMap<String, f64> = std::collections::HashMap::new();
    let mut doc_top_entity: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    for (score, name) in scored {
        let doc = entities.iter().find(|e| e.name == name).map(|e| e.document.clone()).unwrap_or_default();
        if doc.is_empty() { continue; }
        let cur = doc_scores.entry(doc.clone()).or_insert(0.0);
        if *cur < score {
            *cur = score;
            doc_top_entity.insert(doc.clone(), name);
        }
    }
    let mut vec: Vec<(String, f64, String)> = doc_scores.into_iter().map(|(d, s)| {
        let top_ent = doc_top_entity.get(&d).cloned().unwrap_or_default();
        (d, s, top_ent)
    }).collect();
    vec.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    println!("[WORKFLOW-KG] query=\"{}\" top={}", query, top);
    for (doc, score, top_ent) in vec.iter().take(top) {
        println!("  · score={:.3}  doc={}  best_entity={}", score, doc, top_ent);
    }
    println!("[/WORKFLOW-KG]");
    Ok(())
}

/// 语义检索(供 find 子命令):按文档(方法树)聚合得分,返回 top-k
fn run_find(g: &graph::KnowledgeGraph, query: &str, top: usize) -> Result<()> {
    let entities = g.all_entities();
    if entities.is_empty() {
        println!("图谱为空,先 batch 导入");
        return Ok(());
    }
    // entity-level TF-IDF 排序,再按 document 聚合(同一 doc 的实体取最高分,避免长文档堆词虚高)
    let scored_entities = semantic::rank_entities(query, &entities, entities.len());
    let mut doc_scores: std::collections::HashMap<String, f64> = std::collections::HashMap::new();
    let mut doc_top_entity: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    for (score, name) in scored_entities {
        let doc = entities.iter().find(|e| e.name == name).map(|e| e.document.clone()).unwrap_or_default();
        if doc.is_empty() {
            continue;
        }
        let cur = doc_scores.entry(doc.clone()).or_insert(0.0);
        if *cur < score {
            *cur = score;
            doc_top_entity.insert(doc.clone(), name);
        }
    }
    let mut vec: Vec<(String, f64, String)> = doc_scores.into_iter().map(|(d, s)| {
        let top_ent = doc_top_entity.get(&d).cloned().unwrap_or_default();
        (d, s, top_ent)
    }).collect();
    vec.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    println!("find: query='{query}' top={top}");
    for (doc, score, top_ent) in vec.iter().take(top) {
        println!("  · {:>4.3}  doc=`{}`  best_entity={}", score, doc, top_ent);
    }
    Ok(())
}

/// 抽取结果写入图(不负责 save,供 add-doc 与 batch 共用)
fn process_extraction(
    g: &mut graph::KnowledgeGraph,
    doc_name: &str,
    chunk: &str,
    extraction: crate::models::Extraction,
) -> crate::models::Extraction {
    for e in &extraction.entities {
        g.add_entity(&e.name, &e.etype, doc_name, chunk);
    }
    for r in &extraction.relationships {
        g.add_relationship(&r.source, &r.relation, &r.target, doc_name, chunk);
    }
    extraction
}

/// 批量导入目录下的文档文件(顺序调用 MiniMax 抽取)
fn run_batch(dir: &str, exts: &[String], pattern: &str, data_path: &str) -> Result<()> {
    let dir_path = std::path::Path::new(dir);
    if !dir_path.is_dir() {
        anyhow::bail!("目录不存在: {dir}");
    }
    // 收集文件(.ext 默认 md/txt,或 --pattern 过滤)
    let mut files: Vec<std::path::PathBuf> = Vec::new();
    for entry in std::fs::read_dir(dir_path)? {
        let entry = entry?;
        let p = entry.path();
        if !p.is_file() {
            continue;
        }
        let ext_ok = if let Some(ext) = p.extension().and_then(|s| s.to_str()) {
            exts.iter().any(|e| e == &ext.to_lowercase())
        } else {
            false
        };
        if !ext_ok {
            continue;
        }
        if !pattern.is_empty() {
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("");
            if !name.contains(pattern) {
                continue;
            }
        }
        files.push(p);
    }
    files.sort();
    println!("batch: 发现 {} 个文件(.{} / 目录 {dir})", files.len(), exts.join(",."));
    let mut g = graph::KnowledgeGraph::new(data_path);
    let mut ok = 0usize;
    let mut fail = 0usize;
    for (i, p) in files.iter().enumerate() {
        let doc_name = p.file_stem().and_then(|s| s.to_str()).unwrap_or("doc");
        println!("[{}/{}] {} ({} bytes)...", i + 1, files.len(), doc_name, p.metadata().map(|m| m.len()).unwrap_or(0));
        let text = match std::fs::read_to_string(p) {
            Ok(t) => t,
            Err(e) => {
                println!("  ✗ 读取失败: {e}");
                fail += 1;
                continue;
            }
        };
        let chunk = &text[..text.len().min(8000)];
        let raw_out = match llm::generate(&llm::extraction_prompt(chunk)) {
            Ok(s) => s,
            Err(e) => {
                println!("  ✗ 抽取失败: {e}");
                fail += 1;
                continue;
            }
        };
        let extraction = llm::parse_extraction(&raw_out);
        println!(
            "  · {} 实体 / {} 关系",
            extraction.entities.len(),
            extraction.relationships.len()
        );
        let _ = process_extraction(&mut g, doc_name, chunk, extraction);
        ok += 1;
    }
    g.save()?;
    println!("完成: 成功 {ok} / 失败 {fail} / 总计 {}\n图谱: {}(实体 {} / 关系 {})", files.len(), data_path, g.nodes.len(), g.rels.len());
    Ok(())
}

fn print_usage() {
    println!(
        r#"kg_rag_rust — 知识图谱 RAG + 可验证引用(零 Docker,MiniMax M3 推理)

用法:
  kg_rag_rust add-doc <文档名> <文本或文件路径> [--data data/graph.json]
  kg_rag_rust batch <目录> [--ext md,txt] [--pattern <子串>] [--data data/graph.json]
  kg_rag_rust find "<查询>" [--top 5] [--data data/graph.json]
  kg_rag_rust find-prompt "<查询>" [--top 5] [--data data/graph.json]  # 输出可直接注入 prompt 的块
  kg_rag_rust ask "<问题>" [--depth 2] [--data data/graph.json]
  kg_rag_rust clear [--data data/graph.json]
  kg_rag_rust stats [--data data/graph.json]

前置:
  1. 配置 MiniMax M3 key:.env 文件(或环境变量 MINIMAX_API_KEY)
  2. 图数据自动持久化到 data/graph.json(纯 Rust,无需 Neo4j/Docker)
"#
    );
}
