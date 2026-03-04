use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Tag {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTag {
    pub project_id: i64,
    pub name: String,
    pub color: String,
}
