use sqlx::SqlitePool;
use tauri::{AppHandle, Manager, State};

use crate::crypto;
use crate::error::AppError;
use crate::jira::client::JiraClient;
use crate::jira::types::JiraIssue;

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct JiraSpace {
    pub id: i64,
    pub name: String,
    pub base_url: String,
    pub access_token: String,
    pub project_key: String,
    pub last_fetched_at: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct CreateJiraSpace {
    pub name: String,
    pub base_url: String,
    pub access_token: String,
    pub project_key: String,
}

#[tauri::command]
pub async fn list_jira_spaces(db: State<'_, SqlitePool>) -> Result<Vec<JiraSpace>, AppError> {
    Ok(
        sqlx::query_as::<_, JiraSpace>("SELECT * FROM jira_spaces ORDER BY name")
            .fetch_all(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn create_jira_space(
    app: AppHandle,
    db: State<'_, SqlitePool>,
    input: CreateJiraSpace,
) -> Result<JiraSpace, AppError> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let encrypted_token =
        crypto::encrypt(&input.access_token, &app_data_dir).map_err(AppError::Internal)?;

    let result = sqlx::query(
        "INSERT INTO jira_spaces (name, base_url, access_token, project_key) VALUES (?, ?, ?, ?)",
    )
    .bind(&input.name)
    .bind(&input.base_url)
    .bind(&encrypted_token)
    .bind(&input.project_key)
    .execute(db.inner())
    .await?;

    Ok(
        sqlx::query_as::<_, JiraSpace>("SELECT * FROM jira_spaces WHERE id = ?")
            .bind(result.last_insert_rowid())
            .fetch_one(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn delete_jira_space(db: State<'_, SqlitePool>, id: i64) -> Result<(), AppError> {
    sqlx::query("DELETE FROM jira_spaces WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await?;
    Ok(())
}

fn decrypt_token(space: &JiraSpace, app_data_dir: &std::path::PathBuf) -> Result<String, AppError> {
    crypto::decrypt(&space.access_token, app_data_dir).map_err(AppError::Internal)
}

#[tauri::command]
pub async fn fetch_jira_issues(
    app: AppHandle,
    db: State<'_, SqlitePool>,
    space_id: i64,
) -> Result<Vec<JiraIssue>, AppError> {
    let space = sqlx::query_as::<_, JiraSpace>("SELECT * FROM jira_spaces WHERE id = ?")
        .bind(space_id)
        .fetch_one(db.inner())
        .await?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let token = decrypt_token(&space, &app_data_dir)?;

    let client = JiraClient::new();
    let issues = client
        .list_issues(&space.base_url, &token, &space.project_key)
        .await
        .map_err(AppError::Jira)?;

    sqlx::query("UPDATE jira_spaces SET last_fetched_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(space_id)
        .execute(db.inner())
        .await?;

    Ok(issues)
}

#[tauri::command]
pub async fn create_jira_issue(
    app: AppHandle,
    db: State<'_, SqlitePool>,
    space_id: i64,
    summary: String,
    description: Option<String>,
) -> Result<JiraIssue, AppError> {
    let space = sqlx::query_as::<_, JiraSpace>("SELECT * FROM jira_spaces WHERE id = ?")
        .bind(space_id)
        .fetch_one(db.inner())
        .await?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let token = decrypt_token(&space, &app_data_dir)?;

    let client = JiraClient::new();
    client
        .create_issue(
            &space.base_url,
            &token,
            &space.project_key,
            &summary,
            description.as_deref(),
        )
        .await
        .map_err(AppError::Jira)
}
