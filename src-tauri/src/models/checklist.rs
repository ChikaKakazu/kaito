use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ChecklistItem {
    pub id: i64,
    pub task_id: i64,
    pub title: String,
    pub is_done: bool,
    pub position: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateChecklistItem {
    pub task_id: i64,
    pub title: String,
}
