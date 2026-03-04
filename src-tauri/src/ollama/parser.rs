use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct AiResponse {
    pub actions: Vec<AiAction>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AiAction {
    #[serde(rename = "create_task")]
    CreateTask {
        title: String,
        #[serde(default)]
        priority: Option<String>,
        #[serde(default)]
        due_date: Option<String>,
        #[serde(default)]
        column: Option<String>,
    },
    #[serde(rename = "update_task")]
    UpdateTask {
        task_number: i32,
        #[serde(default)]
        fields: Option<Value>,
    },
    #[serde(rename = "move_task")]
    MoveTask {
        task_number: i32,
        column: String,
    },
    #[serde(rename = "delete_task")]
    DeleteTask {
        task_number: i32,
    },
    #[serde(rename = "create_jira_ticket")]
    CreateJiraTicket {
        title: String,
        #[serde(default)]
        description: Option<String>,
    },
    #[serde(rename = "search_jira")]
    SearchJira {
        query: String,
    },
}

pub fn parse_ai_response(raw: &str) -> Result<AiResponse, String> {
    // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
    let json_str = extract_json(raw);

    serde_json::from_str::<AiResponse>(&json_str).map_err(|e| {
        format!(
            "Failed to parse AI response as JSON: {}. Raw: {}",
            e,
            &raw[..raw.len().min(200)]
        )
    })
}

fn extract_json(raw: &str) -> String {
    // Try to find JSON in markdown code blocks
    if let Some(start) = raw.find("```json") {
        let after_marker = &raw[start + 7..];
        if let Some(end) = after_marker.find("```") {
            return after_marker[..end].trim().to_string();
        }
    }
    if let Some(start) = raw.find("```") {
        let after_marker = &raw[start + 3..];
        if let Some(end) = after_marker.find("```") {
            return after_marker[..end].trim().to_string();
        }
    }

    // Try to find raw JSON object
    if let Some(start) = raw.find('{') {
        if let Some(end) = raw.rfind('}') {
            return raw[start..=end].to_string();
        }
    }

    raw.to_string()
}
