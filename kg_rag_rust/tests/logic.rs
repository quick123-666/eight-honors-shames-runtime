//! 纯逻辑单元测试(不调 LLM API):
//! 图构建 / 词匹配 / BFS 多跳遍历 / 持久化 / TF-IDF 语义检索 / 空图兜底 / JSON 解析
use kg_rag_rust::answer::answer_question;
use kg_rag_rust::graph::{EntityLite, KnowledgeGraph};
use kg_rag_rust::models::Extraction;
use kg_rag_rust::semantic::rank_entities;
use std::path::PathBuf;

/// 唯一临时图文件路径(每测例独立,避免互相污染)
fn tmp_graph(tag: &str) -> String {
    let mut p = std::env::temp_dir();
    p.push(format!(
        "kg_rag_test_{}_{}.json",
        tag,
        std::process::id()
    ));
    let s = p.to_string_lossy().to_string();
    // 确保起点干净
    let _ = std::fs::remove_file(&s);
    s
}

/// 构造一个 3 实体 2 关系的迷你图:
///   A -[likes]-> B -[works_at]-> C
/// 证据文本统一 > 20 字符(满足 traverse 的 evidence 阈值)
fn build_mini_graph() -> KnowledgeGraph {
    let mut g = KnowledgeGraph::new(&tmp_graph("mini"));
    g.add_entity("Alice", "person", "doc1", "Alice is a software engineer at the company.");
    g.add_entity("Bob", "person", "doc1", "Bob likes to play chess every weekend morning.");
    g.add_entity("Corp", "company", "doc2", "Corp is a technology company based in the city.");
    g.add_relationship("Alice", "likes", "Bob", "doc1", "Alice likes Bob because of his coding skill.");
    g.add_relationship("Bob", "works_at", "Corp", "doc2", "Bob works at Corp as a senior developer now.");
    g
}

// ───────────────────────── 图构建 ─────────────────────────

#[test]
fn add_entity_accumulates_mentions() {
    let mut g = KnowledgeGraph::new(&tmp_graph("ent"));
    g.add_entity("Alice", "person", "doc1", "Alice is a developer.");
    g.add_entity("Alice", "person", "doc2", "Alice joined the team.");
    let node = &g.nodes["Alice"];
    assert_eq!(node.mentions.len(), 2, "同一实体多次出现应累积 mentions");
    assert_eq!(node.mentions[0].document, "doc1");
    assert_eq!(node.mentions[1].document, "doc2");
}

#[test]
fn add_entity_keeps_first_etype() {
    let mut g = KnowledgeGraph::new(&tmp_graph("etype"));
    g.add_entity("Alice", "person", "doc1", "Alice is a developer.");
    g.add_entity("Alice", "animal", "doc2", "Alice the cat.");
    assert_eq!(g.nodes["Alice"].etype, "person", "etype 只取第一次出现的值");
}

#[test]
fn add_relationship_records_evidence() {
    let mut g = KnowledgeGraph::new(&tmp_graph("rel"));
    g.add_relationship("Alice", "likes", "Bob", "doc1", "Alice likes Bob.");
    assert_eq!(g.rels.len(), 1);
    assert_eq!(g.rels[0].evidence[0].document, "doc1");
    assert_eq!(g.rels[0].evidence[0].text, "Alice likes Bob.");
}

// ───────────────────────── 词匹配起始实体 ─────────────────────────

#[test]
fn find_start_entities_matches_case_insensitive() {
    let g = build_mini_graph();
    let found = g.find_start_entities(&["alice".to_string()]);
    assert!(found.contains(&"Alice".to_string()), "大小写不敏感应命中: {found:?}");
}

#[test]
fn find_start_entities_partial_word_match() {
    let g = build_mini_graph();
    // "corp" 是 "Corp" 的子串
    let found = g.find_start_entities(&["corp".to_string()]);
    assert!(found.contains(&"Corp".to_string()), "部分词匹配应命中: {found:?}");
}

#[test]
fn find_start_entities_no_match_returns_empty() {
    let g = build_mini_graph();
    assert!(g.find_start_entities(&["zzz_nonexistent".to_string()]).is_empty());
}

#[test]
fn find_start_entities_dedupes_overlapping_words() {
    let g = build_mini_graph();
    // 两个词都命中同一实体,应只出现一次(遍历节点去重,由 HashMap keys 天然保证)
    let found = g.find_start_entities(&["ali".to_string(), "alice".to_string()]);
    let count = found.iter().filter(|n| n.as_str() == "Alice").count();
    assert_eq!(count, 1, "重叠词不应产生重复起始实体");
}

#[test]
fn find_start_entities_limited_to_ten() {
    let mut g = KnowledgeGraph::new(&tmp_graph("limit"));
    for i in 0..15 {
        g.add_entity(&format!("Topic{i}"), "topic", "doc", "Some interesting topic content here.");
    }
    let found = g.find_start_entities(&["topic".to_string()]);
    assert!(found.len() <= 10, "起始实体最多 10 个,实际 {}", found.len());
}

// ───────────────────────── 多跳遍历 ─────────────────────────

#[test]
fn traverse_single_hop_forward() {
    let g = build_mini_graph();
    let hops = g.traverse(&["Alice".to_string()], 1);
    assert_eq!(hops.len(), 1, "Alice 一跳应只到 Bob");
    assert_eq!(hops[0].target, "Bob");
    assert_eq!(hops[0].trace, "Alice -[likes]-> Bob");
}

#[test]
fn traverse_single_hop_backward() {
    let g = build_mini_graph();
    // 从 Corp 反向往回走:Corp <-[works_at]- Bob
    let hops = g.traverse(&["Corp".to_string()], 1);
    assert_eq!(hops.len(), 1);
    assert_eq!(hops[0].target, "Bob");
    assert_eq!(hops[0].trace, "Corp <-[works_at]- Bob");
}

#[test]
fn traverse_two_hops_chain() {
    let g = build_mini_graph();
    // Alice -> Bob -> Corp,2 跳
    let hops = g.traverse(&["Alice".to_string()], 2);
    let targets: Vec<&str> = hops.iter().map(|h| h.target.as_str()).collect();
    assert!(targets.contains(&"Bob"), "第一跳应到 Bob: {targets:?}");
    assert!(targets.contains(&"Corp"), "第二跳应到 Corp: {targets:?}");
    let corp = hops.iter().find(|h| h.target == "Corp").unwrap();
    assert_eq!(corp.trace, "Alice -[likes]-> Bob -[works_at]-> Corp", "推理路径应串起整条链");
}

#[test]
fn traverse_depth_zero_returns_empty() {
    let g = build_mini_graph();
    assert!(g.traverse(&["Alice".to_string()], 0).is_empty());
}

#[test]
fn traverse_no_relationships_returns_empty() {
    let mut g = KnowledgeGraph::new(&tmp_graph("norel"));
    g.add_entity("Alice", "person", "doc1", "Alice is a developer at the company.");
    assert!(g.traverse(&["Alice".to_string()], 3).is_empty(), "无关系时遍历应为空");
}

#[test]
fn traverse_cycle_terminates() {
    // A -> B -> A 成环,必须能终止(visited 去重),且不无限扩展
    let mut g = KnowledgeGraph::new(&tmp_graph("cycle"));
    g.add_entity("A", "node", "doc", "Node A has some long descriptive text content.");
    g.add_entity("B", "node", "doc", "Node B has some long descriptive text content.");
    g.add_relationship("A", "knows", "B", "doc", "A knows B very well indeed.");
    g.add_relationship("B", "knows", "A", "doc", "B knows A very well indeed.");
    let hops = g.traverse(&["A".to_string()], 10);
    assert_eq!(hops.len(), 1, "成环时每个新节点只记录一次,实际 {}", hops.len());
    assert_eq!(hops[0].target, "B");
}

#[test]
fn traverse_short_evidence_filtered() {
    // evidence 文本 ≤20 字符的 hop 不应出现在结果里(与实现证据阈值一致)
    let mut g = KnowledgeGraph::new(&tmp_graph("short"));
    g.add_entity("A", "node", "doc", "Node A long enough evidence text here.");
    g.add_entity("B", "node", "doc", "Node B long enough evidence text here.");
    g.add_relationship("A", "links", "B", "doc", "short");
    let hops = g.traverse(&["A".to_string()], 1);
    assert!(hops.is_empty(), "短证据应被过滤: {hops:?}");
}

#[test]
fn traverse_multiple_starts_dedupe_target() {
    let g = build_mini_graph();
    // 从 Alice 和 Bob 同时出发,Bob 只应出现一次
    let hops = g.traverse(&["Alice".to_string(), "Bob".to_string()], 1);
    let count = hops.iter().filter(|h| h.target == "Corp").count();
    assert_eq!(count, 1, "多起点到达同一节点应去重");
}

// ───────────────────────── 持久化 ─────────────────────────

#[test]
fn save_then_load_roundtrip() {
    let path = tmp_graph("roundtrip");
    let mut g = KnowledgeGraph::new(&path);
    g.add_entity("Alice", "person", "doc1", "Alice is a developer.");
    g.add_relationship("Alice", "likes", "Bob", "doc1", "Alice likes Bob.");
    g.save().expect("保存应成功");

    let loaded = KnowledgeGraph::new(&path);
    assert!(loaded.nodes.contains_key("Alice"), "重载后实体应存在");
    assert_eq!(loaded.rels.len(), 1);
    assert_eq!(loaded.rels[0].rel, "likes");
    // path 字段 #[serde(skip)]:JSON 文件里不得出现 path 字段
    let content = std::fs::read_to_string(&path).unwrap();
    assert!(
        !content.contains("\"path\""),
        "path 不应序列化进 JSON,实际内容含 path 字段"
    );
    let _ = std::fs::remove_file(&path);
}

#[test]
fn clear_empties_graph() {
    let path = tmp_graph("clear");
    let mut g = KnowledgeGraph::new(&path);
    g.add_entity("Alice", "person", "doc1", "Alice is a developer.");
    g.add_relationship("Alice", "likes", "Bob", "doc1", "Alice likes Bob.");
    g.clear().expect("clear 应成功");
    assert!(g.nodes.is_empty());
    assert!(g.rels.is_empty());
    let _ = std::fs::remove_file(&path);
}

#[test]
fn all_entities_returns_lite_info() {
    let g = build_mini_graph();
    let es = g.all_entities();
    assert_eq!(es.len(), 3);
    let alice = es.iter().find(|e| e.name == "Alice").unwrap();
    assert_eq!(alice.etype, "person");
    assert_eq!(alice.document, "doc1");
    assert!(!alice.text.is_empty());
}

// ───────────────────────── TF-IDF 语义检索 ─────────────────────────

fn lite(name: &str, etype: &str, text: &str, doc: &str) -> EntityLite {
    EntityLite {
        name: name.to_string(),
        etype: etype.to_string(),
        text: text.to_string(),
        document: doc.to_string(),
    }
}

#[test]
fn rank_entities_puts_relevant_first() {
    let entities = vec![
        lite("Apple", "company", "Apple makes phones and laptops devices.", "d1"),
        lite("Banana", "fruit", "Banana is a yellow tropical fruit food.", "d2"),
        lite("Cherry", "fruit", "Cherry is a small red fruit berry.", "d3"),
    ];
    let ranked = rank_entities("banana fruit", &entities, 5);
    assert!(!ranked.is_empty());
    assert_eq!(ranked[0].1, "Banana", "查询相关实体应排第一,实际 {ranked:?}");
    // 注意:无词干化,查询词需与实体文本形态一致(phones/devices)
    let ranked = rank_entities("phones devices", &entities, 5);
    assert_eq!(ranked[0].1, "Apple", "查询相关实体应排第一,实际 {ranked:?}");
}

#[test]
fn rank_entities_empty_input_returns_empty() {
    let entities = vec![lite("Apple", "company", "Apple makes phones.", "d1")];
    assert!(rank_entities("", &entities, 5).is_empty());
    assert!(rank_entities("   ", &entities, 5).is_empty());
    assert!(rank_entities("phone", &[], 5).is_empty());
}

#[test]
fn rank_entities_stopwords_only_query_returns_empty() {
    let entities = vec![lite("Apple", "company", "Apple makes phones.", "d1")];
    // "the" 是停用词,查询只剩停用词 → tokenize 为空 → 返回空
    assert!(rank_entities("the of and", &entities, 5).is_empty());
}

#[test]
fn rank_entities_top_k_truncates() {
    let entities = vec![
        lite("A", "t", "Alpha alpha alpha content here.", "d1"),
        lite("B", "t", "Alpha alpha content here too.", "d2"),
        lite("C", "t", "Alpha content appears as well.", "d3"),
    ];
    let ranked = rank_entities("alpha", &entities, 2);
    assert_eq!(ranked.len(), 2, "top_k=2 应截断,实际 {}", ranked.len());
}

#[test]
fn rank_entities_no_overlap_returns_empty() {
    let entities = vec![lite("Apple", "company", "Apple makes phones.", "d1")];
    assert!(rank_entities("quantum physics", &entities, 5).is_empty());
}

// ───────────────────────── 空图兜底(不调 LLM) ─────────────────────────

#[test]
fn answer_question_empty_graph_returns_graceful() {
    let g = KnowledgeGraph::new(&tmp_graph("empty"));
    // 空图 → 无起始实体 → 直接返回兜底答案,不调 LLM(无 panic、无网络)
    let ans = answer_question(&g, "Who developed GraphRAG?", 2).expect("空图应正常返回");
    assert!(ans.answer.contains("找不到"), "应返回兜底文案,实际: {}", ans.answer);
    assert!(ans.citations.is_empty());
    assert!(!ans.reasoning_trace.is_empty());
}

// ───────────────────────── 抽取 JSON 解析 ─────────────────────────

#[test]
fn extraction_json_maps_type_and_defaults() {
    // 字段别名 type→etype,缺字段用默认值
    let json = r#"{
        "entities": [{"name": "GraphRAG", "type": "project"}],
        "relationships": [{"source": "GraphRAG", "relation": "developed_by", "target": "Microsoft"}]
    }"#;
    let ex: Extraction = serde_json::from_str(json).expect("应能解析");
    assert_eq!(ex.entities.len(), 1);
    assert_eq!(ex.entities[0].etype, "project", "type 字段应映射到 etype");
    assert_eq!(ex.relationships[0].relation, "developed_by");
}

#[test]
fn extraction_json_missing_fields_default() {
    // LLM 可能省略空数组/relation 字段,必须容错
    let json = r#"{"entities": [{"name": "X"}]}"#;
    let ex: Extraction = serde_json::from_str(json).expect("缺字段应容错");
    assert_eq!(ex.entities[0].etype, "");
    assert!(ex.relationships.is_empty());
}

#[test]
fn extraction_json_empty_object_ok() {
    let ex: Extraction = serde_json::from_str("{}").expect("空对象应解析为默认");
    assert!(ex.entities.is_empty());
    assert!(ex.relationships.is_empty());
}
