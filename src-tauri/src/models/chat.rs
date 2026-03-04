use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ChatMessage {
    pub id: i64,
    pub project_id: Option<i64>,
    pub role: String,
    pub content: String,
    pub created_at: String,
}
