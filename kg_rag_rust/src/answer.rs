//! 答案生成:语义检索 → 实体匹配 → 多跳遍历 → 强制 [N] 引用
use crate::graph::KnowledgeGraph;
use crate::llm;
use crate::models::{Answer, Citation};
use anyhow::Result;

/// 主流程(与参考实现 generate_answer_with_citations 完整对应)
pub fn answer_question(g: &KnowledgeGraph, question: &str, depth: u32) -> Result<Answer> {
    let mut trace: Vec<String> = Vec::new();
    let mut citations: Vec<Citation> = Vec::new();

    // Step 1: 语义检索(本地 TF-IDF 余弦)找候选实体
    trace.push(format!("🔍 语义检索知识图谱: '{question}'"));
    let entities = g.all_entities();
    let ranked = crate::semantic::rank_entities(question, &entities, 5);
    let mut start_entities: Vec<String> = ranked.iter().map(|(_, n)| n.clone()).collect();
    trace.push(format!("📊 语义检索命中 {} 个实体", start_entities.len()));

    // Step 2: 词匹配补充起始实体(与参考实现 find_start_entities 一致)
    let words: Vec<String> = question
        .split(|c: char| !c.is_alphanumeric() && c != '_')
        .filter(|w| w.len() > 1)
        .map(|w| w.to_lowercase())
        .collect();
    let matched = g.find_start_entities(&words);
    for m in matched {
        if !start_entities.contains(&m) {
            start_entities.push(m);
        }
    }
    trace.push(format!("🎯 起始实体: {:?}", start_entities));
    if start_entities.is_empty() {
        return Ok(Answer {
            answer: "知识图谱中找不到相关信息(先 add-doc 存入文档)".to_string(),
            citations: vec![],
            reasoning_trace: trace,
        });
    }

    // Step 3: 多跳遍历(带推理路径 + 来源)
    trace.push(format!("🔗 从起始实体做 {depth} 跳遍历"));
    let hops = g.traverse(&start_entities, depth);
    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut ctx: Vec<(String, String, String)> = Vec::new(); // (text, doc, path)
    for h in hops {
        if h.evidence_text.len() > 20 && seen.insert(h.target.clone()) {
            ctx.push((h.evidence_text.clone(), h.evidence_doc.clone(), h.trace.clone()));
        }
    }
    trace.push(format!("📝 构建 {} 条证据上下文", ctx.len()));

    // Step 4: 生成带 [N] 引用的答案
    for (i, (text, doc, path)) in ctx.iter().enumerate() {
        citations.push(Citation {
            number: i + 1,
            text: text.clone(),
            document: doc.clone(),
            path: path.clone(),
        });
    }
    let prompt = llm::answer_prompt(question, &citations);
    trace.push("🤖 调 MiniMax M3 生成带引用答案".to_string());
    let answer_text = llm::generate(&prompt)?;

    Ok(Answer {
        answer: answer_text,
        citations,
        reasoning_trace: trace,
    })
}
