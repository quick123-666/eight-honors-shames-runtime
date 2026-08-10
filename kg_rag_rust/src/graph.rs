//! 纯 Rust 知识图谱(无 Neo4j/Docker):内存图 + JSON 持久化
//! 图模型与 Neo4j 版一致:
//!   Entity {etype, mentions: [Source]}          ← MENTIONED_IN
//!   Rel {src, rel, dst, evidence: [Source]}     ← REL + EVIDENCE
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Source {
    pub document: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GraphNode {
    pub etype: String,
    pub mentions: Vec<Source>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphRel {
    pub src: String,
    pub rel: String,
    pub dst: String,
    pub evidence: Vec<Source>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct KnowledgeGraph {
    pub nodes: HashMap<String, GraphNode>,
    pub rels: Vec<GraphRel>,
    #[serde(skip)]
    pub path: String,
}

impl KnowledgeGraph {
    pub fn new(path: &str) -> Self {
        let mut g = Self {
            nodes: HashMap::new(),
            rels: Vec::new(),
            path: path.to_string(),
        };
        // 尝试加载已有持久化
        if Path::new(path).exists() {
            if let Ok(content) = std::fs::read_to_string(path) {
                if let Ok(loaded) = serde_json::from_str::<KnowledgeGraph>(&content) {
                    g.nodes = loaded.nodes;
                    g.rels = loaded.rels;
                }
            }
        }
        g
    }

    pub fn save(&self) -> Result<()> {
        if let Some(dir) = Path::new(&self.path).parent() {
            if !dir.as_os_str().is_empty() {
                std::fs::create_dir_all(dir)?;
            }
        }
        let mut g = self.clone();
        g.path = String::new(); // 不序列化 path
        std::fs::write(&self.path, serde_json::to_string_pretty(&g)?)
            .with_context(|| format!("写图数据 {}", self.path))?;
        Ok(())
    }

    pub fn clear(&mut self) -> Result<()> {
        self.nodes.clear();
        self.rels.clear();
        self.save()
    }

    pub fn add_entity(&mut self, name: &str, etype: &str, doc: &str, chunk: &str) {
        let node = self.nodes.entry(name.to_string()).or_default();
        if node.etype.is_empty() {
            node.etype = etype.to_string();
        }
        node.mentions.push(Source {
            document: doc.to_string(),
            text: chunk.to_string(),
        });
    }

    pub fn add_relationship(&mut self, src: &str, rel: &str, dst: &str, doc: &str, chunk: &str) {
        self.rels.push(GraphRel {
            src: src.to_string(),
            rel: rel.to_string(),
            dst: dst.to_string(),
            evidence: vec![Source {
                document: doc.to_string(),
                text: chunk.to_string(),
            }],
        });
    }

    /// 词匹配起始实体(与 find_start_entities 一致)
    pub fn find_start_entities(&self, words: &[String]) -> Vec<String> {
        let mut out = Vec::new();
        for name in self.nodes.keys() {
            let lower = name.to_lowercase();
            if words.iter().any(|w| lower.contains(w)) {
                out.push(name.clone());
                if out.len() >= 10 {
                    break;
                }
            }
        }
        out
    }

    /// 全部实体(供语义检索)
    pub fn all_entities(&self) -> Vec<EntityLite> {
        self.nodes
            .iter()
            .map(|(name, node)| EntityLite {
                name: name.clone(),
                etype: node.etype.clone(),
                text: node
                    .mentions
                    .first()
                    .map(|s| s.text.clone())
                    .unwrap_or_default(),
                document: node
                    .mentions
                    .first()
                    .map(|s| s.document.clone())
                    .unwrap_or_default(),
            })
            .collect()
    }

    /// BFS 多跳遍历:从起始实体扩展 depth 跳,返回推理路径 + 证据
    pub fn traverse(&self, start: &[String], depth: u32) -> Vec<TraversalHop> {
        let mut out = Vec::new();
        // 起点预标记 visited:起点是遍历出发点而非“新发现”节点,
        // 避免成环图无意义回跳起点(与参考实现:起点不算路径节点一致)
        let mut visited: std::collections::HashSet<String> = start.iter().cloned().collect();
        let mut frontier: Vec<(String, String)> = start // (node, path_so_far)
            .iter()
            .map(|n| (n.clone(), n.clone()))
            .collect();
        let mut hop = 0;
        while !frontier.is_empty() && hop < depth {
            let mut next: Vec<(String, String)> = Vec::new();
            for (node, path) in &frontier {
                for r in &self.rels {
                    let neighbor: Option<&str> = if r.src == *node {
                        Some(&r.dst)
                    } else if r.dst == *node {
                        Some(&r.src)
                    } else {
                        None
                    };
                    if let Some(nei) = neighbor {
                        let rel_label = if r.src == *node {
                            format!("-[{}]->", r.rel)
                        } else {
                            format!("<-[{}]-", r.rel)
                        };
                        let new_path = format!("{} {} {}", path, rel_label, nei);
                        if visited.insert(nei.to_string()) {
                            let evidence = r
                                .evidence
                                .first()
                                .cloned()
                                .or_else(|| self.nodes.get(nei).and_then(|n| n.mentions.first().cloned()))
                                .unwrap_or_default();
                            if evidence.text.len() > 20 {
                                out.push(TraversalHop {
                                    trace: new_path.clone(),
                                    target: nei.to_string(),
                                    ttype: self
                                        .nodes
                                        .get(nei)
                                        .map(|n| n.etype.clone())
                                        .unwrap_or_default(),
                                    evidence_text: evidence.text,
                                    evidence_doc: evidence.document,
                                });
                            }
                            next.push((nei.to_string(), new_path));
                        }
                    }
                }
            }
            frontier = next;
            hop += 1;
        }
        out
    }
}

#[derive(Debug, Clone)]
pub struct EntityLite {
    pub name: String,
    pub etype: String,
    pub text: String,
    pub document: String,
}

#[derive(Debug, Clone)]
pub struct TraversalHop {
    pub trace: String,
    pub target: String,
    #[allow(dead_code)] // 保留:实体类型,后续引用详情可用
    pub ttype: String,
    pub evidence_text: String,
    pub evidence_doc: String,
}
