//! 本地语义检索:TF-IDF 余弦相似度(纯 Rust,零外部向量库)
//! 作为 semantic_search 的本地实现:查询词 vs 实体上下文,稀有词 IDF 加权
use std::collections::HashMap;

/// 词频统计
fn tokenize(text: &str) -> HashMap<String, usize> {
    let mut tf: HashMap<String, usize> = HashMap::new();
    for w in text.split(|c: char| !c.is_alphanumeric() && c != '_') {
        let wl = w.to_lowercase();
        if wl.len() >= 2 && !STOPWORDS.contains(&wl.as_str()) {
            *tf.entry(wl).or_insert(0) += 1;
        }
    }
    tf
}

const STOPWORDS: &[&str] = &[
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "at", "for", "with", "is", "are",
    "was", "were", "be", "been", "it", "this", "that", "these", "those", "from", "by", "as",
    "into", "about", "after", "before", "between", "under", "over", "using", "used", "use",
    "has", "have", "had", "do", "does", "did", "not", "no", "yes", "all", "any", "each",
    "some", "such", "only", "own", "same", "too", "very", "just", "can", "could", "will",
    "would", "should", "may", "might", "must", "please", "help", "make", "get", "want",
];

/// TF-IDF 余弦排序:返回 (得分, 排序后的实体引用)
pub fn rank_entities(
    query: &str,
    entities: &[crate::graph::EntityLite],
    top_k: usize,
) -> Vec<(f64, String)> {
    let q = tokenize(query);
    if q.is_empty() || entities.is_empty() {
        return Vec::new();
    }
    let n = entities.len() as f64;

    // 文档词频 + 文档频率(用 名称+类型+文本 作为实体文档)
    let mut dfs: HashMap<String, usize> = HashMap::new();
    for e in entities {
        let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
        for w in tokenize(&format!("{} {} {}", e.name, e.etype, e.text)).keys() {
            if seen.insert(w.clone()) {
                *dfs.entry(w.clone()).or_insert(0) += 1;
            }
        }
    }

    let idf = |w: &str| -> f64 {
        let d = dfs.get(w).copied().unwrap_or(1) as f64;
        (1.0 + n / d.max(1.0)).ln()
    };

    let mut scored: Vec<(f64, String)> = entities
        .iter()
        .map(|e| {
            let doc = tokenize(&format!("{} {} {}", e.name, e.etype, e.text));
            let mut dot = 0.0;
            let mut q_norm = 0.0;
            let mut d_norm = 0.0;
            for (w, qtf) in &q {
                let wq = (*qtf as f64).sqrt() * idf(w);
                q_norm += wq * wq;
                if let Some(dtf) = doc.get(w) {
                    let wd = (*dtf as f64).sqrt() * idf(w);
                    dot += wq * wd;
                }
            }
            for (w, dtf) in &doc {
                let wd = (*dtf as f64).sqrt() * idf(w);
                d_norm += wd * wd;
            }
            if q_norm > 0.0 && d_norm > 0.0 {
                (dot / (q_norm.sqrt() * d_norm.sqrt()), e.name.clone())
            } else {
                (0.0, e.name.clone())
            }
        })
        .filter(|(s, _)| *s > 0.001)
        .collect();
    scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));
    scored.truncate(top_k);
    scored
}
