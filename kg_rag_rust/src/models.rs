//! 数据模型:实体 / 关系 / 引用 / 答案
use serde::{Deserialize, Serialize};

/// 实体(LLM 从文档抽取)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub name: String,
    #[serde(rename = "type", default)]
    pub etype: String,
}

/// 关系三元组(LLM 从文档抽取)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    pub source: String,
    #[serde(default)]
    pub relation: String,
    pub target: String,
}

/// LLM 抽取结果(JSON 解析目标)
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Extraction {
    #[serde(default)]
    pub entities: Vec<Entity>,
    #[serde(default)]
    pub relationships: Vec<Relationship>,
}

/// 一条引用:证据文本 + 源文档 + 推理路径
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Citation {
    pub number: usize,
    pub text: String,
    pub document: String,
    pub path: String,
}

/// 带引用的答案
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Answer {
    pub answer: String,
    pub citations: Vec<Citation>,
    pub reasoning_trace: Vec<String>,
}
