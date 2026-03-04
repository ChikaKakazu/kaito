use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Column {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub position: i32,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateColumn {
    pub project_id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateColumnPosition {
    pub id: i64,
    pub position: i32,
}
