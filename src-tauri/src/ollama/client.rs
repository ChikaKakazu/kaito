use reqwest::Client;
use serde::{Deserialize, Serialize};

const OLLAMA_BASE_URL: &str = "http://localhost:11434";
const MODEL: &str = "qwen2.5:7b";
const MAX_HISTORY: usize = 20;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<OllamaMessage>,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    message: OllamaMessage,
}

pub struct OllamaClient {
    client: Client,
}

impl OllamaClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    pub async fn is_running(&self) -> bool {
        self.client
            .get(OLLAMA_BASE_URL)
            .send()
            .await
            .is_ok()
    }

    pub async fn chat(
        &self,
        system_prompt: &str,
        history: Vec<OllamaMessage>,
        user_message: &str,
    ) -> Result<String, String> {
        let mut messages = Vec::new();

        // System prompt
        messages.push(OllamaMessage {
            role: "system".to_string(),
            content: system_prompt.to_string(),
        });

        // Trim history to last N messages
        let trimmed: Vec<_> = if history.len() > MAX_HISTORY {
            history[history.len() - MAX_HISTORY..].to_vec()
        } else {
            history
        };
        messages.extend(trimmed);

        // Current user message
        messages.push(OllamaMessage {
            role: "user".to_string(),
            content: user_message.to_string(),
        });

        let request = ChatRequest {
            model: MODEL.to_string(),
            messages,
            stream: false,
        };

        let response = self
            .client
            .post(format!("{}/api/chat", OLLAMA_BASE_URL))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Ollama request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Ollama returned status: {}", response.status()));
        }

        let chat_response: ChatResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

        Ok(chat_response.message.content)
    }
}
