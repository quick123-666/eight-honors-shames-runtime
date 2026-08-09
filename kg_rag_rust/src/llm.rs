//! MiniMax M3 客户端(anthropic-messages 协议,与 lsx pi-minimax 一致)
//! 端点: POST https://api.minimaxi.com/anthropic/v1/messages
//! key: 环境变量 MINIMAX_API_KEY 或同目录 .env(不进 git)
use crate::models::{Citation, Extraction};
use anyhow::{Context, Result};
use serde_json::{json, Value};

const MINIMAX_URL: &str = "https://api.minimaxi.com/anthropic/v1/messages";
const DEFAULT_MODEL: &str = "MiniMax-M3";

/// 读 key:项目 .env 优先(权威),环境变量作覆盖
fn api_key() -> Result<String> {
    if let Ok(content) = std::fs::read_to_string(".env") {
        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("MINIMAX_API_KEY=") {
                let k = line["MINIMAX_API_KEY=".len()..].trim().to_string();
                if !k.is_empty() {
                    return Ok(k);
                }
            }
        }
    }
    if let Ok(k) = std::env::var("MINIMAX_API_KEY") {
        if !k.is_empty() {
            return Ok(k);
        }
    }
    anyhow::bail!("缺少 MiniMax key:写 .env 或 export MINIMAX_API_KEY=sk-...")
}

/// 调 MiniMax M3 生成(text 优先,thinking fallback)
pub fn generate(prompt: &str) -> Result<String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()?;
    let resp = client
        .post(MINIMAX_URL)
        .header("x-api-key", api_key()?)
        .header("anthropic-version", "2023-06-01")
        .json(&json!({
            "model": DEFAULT_MODEL,
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}]
        }))
        .send()
        .with_context(|| "MiniMax 无响应(检查网络与 key)")?;
    let status = resp.status();
    let body: Value = resp.json().with_context(|| "MiniMax 返回非 JSON")?;
    if !status.is_success() {
        return Err(anyhow::anyhow!("MiniMax HTTP {status}: {body}"));
    }
    let mut text_out = String::new();
    let mut thinking_out = String::new();
    for block in body["content"].as_array().cloned().unwrap_or_default() {
        match block["type"].as_str() {
            Some("text") => {
                if let Some(t) = block["text"].as_str() {
                    text_out.push_str(t);
                }
            }
            Some("thinking") => {
                if let Some(t) = block["thinking"].as_str() {
                    thinking_out = t.to_string();
                }
            }
            _ => {}
        }
    }
    if !text_out.trim().is_empty() {
        Ok(text_out.trim().to_string())
    } else if !thinking_out.trim().is_empty() {
        Ok(thinking_out.trim().to_string())
    } else {
        anyhow::bail!("MiniMax 返回空内容: {}", body)
    }
}

/// 实体/关系抽取 prompt(与参考实现一致的 JSON 三元组格式)
pub fn extraction_prompt(text: &str) -> String {
    format!(
        r#"Extract entities and relationships from the following text as JSON.
Format: {{"entities": [{{"name": "...", "type": "..."}}], "relationships": [{{"source": "...", "relation": "...", "target": "..."}}]}}
Only use text content. Return valid JSON.
Text:
{text}"#
    )
}

/// 从 LLM 输出解析抽取结果(容错:提取首个 JSON 对象)
pub fn parse_extraction(raw: &str) -> Extraction {
    // 找第一个 { 到最后一个 } 的片段
    let start = raw.find('{');
    let end = raw.rfind('}');
    let slice = match (start, end) {
        (Some(a), Some(b)) if b > a => &raw[a..=b],
        _ => {
            eprintln!("[extract] LLM 输出无 JSON 对象,原样:{}", &raw[..raw.len().min(200)]);
            return Extraction::default();
        }
    };
    match serde_json::from_str::<Extraction>(slice) {
        Ok(e) => e,
        Err(err) => {
            eprintln!("[extract] JSON 解析失败({err}),尝试修复引号");
            // 简单修复:把单引号替换为双引号再试
            let fixed = slice.replace('\'', "\"");
            serde_json::from_str(&fixed).unwrap_or_default()
        }
    }
}

/// 生成答案:强制 [N] 引用
pub fn answer_prompt(question: &str, citations: &[Citation]) -> String {
    let mut ctx = String::new();
    for c in citations {
        ctx.push_str(&format!(
            "[{}] (Source: {}) {}\n",
            c.number, c.document, c.text
        ));
    }
    format!(
        r#"Use the following evidence, each marked with a citation number. Answer the question by citing evidence with [N] markers.
Evidence:
{ctx}
Question: {question}
Answer with citations:"#
    )
}
