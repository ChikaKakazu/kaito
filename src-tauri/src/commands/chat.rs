use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppError;
use crate::models::chat::ChatMessage;
use crate::ollama::client::{OllamaClient, OllamaMessage};
use crate::ollama::parser::{parse_ai_response, AiAction, AiResponse};
use crate::ollama::prompt::build_system_prompt;

#[tauri::command]
pub async fn check_ollama_status() -> Result<bool, AppError> {
    let client = OllamaClient::new();
    Ok(client.is_running().await)
}

#[tauri::command]
pub async fn send_chat_message(
    db: State<'_, SqlitePool>,
    project_id: i64,
    content: String,
    context_type: String,
) -> Result<AiResponse, AppError> {
    sqlx::query("INSERT INTO chat_messages (project_id, role, content) VALUES (?, 'user', ?)")
        .bind(project_id)
        .bind(&content)
        .execute(db.inner())
        .await?;

    let columns: Vec<String> =
        sqlx::query_scalar("SELECT name FROM columns WHERE project_id = ? ORDER BY position")
            .bind(project_id)
            .fetch_all(db.inner())
            .await?;

    let history_rows = sqlx::query_as::<_, ChatMessage>(
        "SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at DESC LIMIT 40",
    )
    .bind(project_id)
    .fetch_all(db.inner())
    .await?;

    let history: Vec<OllamaMessage> = history_rows
        .into_iter()
        .rev()
        .map(|m| OllamaMessage {
            role: m.role,
            content: m.content,
        })
        .collect();

    let system_prompt = build_system_prompt(&columns, &context_type);
    let client = OllamaClient::new();
    let raw_response = client
        .chat(&system_prompt, history, &content)
        .await
        .map_err(AppError::Ollama)?;

    let ai_response = parse_ai_response(&raw_response).map_err(AppError::Ollama)?;

    for action in &ai_response.actions {
        execute_action(db.inner(), project_id, action).await?;
    }

    sqlx::query("INSERT INTO chat_messages (project_id, role, content) VALUES (?, 'assistant', ?)")
        .bind(project_id)
        .bind(&ai_response.message)
        .execute(db.inner())
        .await?;

    Ok(ai_response)
}

async fn execute_action(
    db: &SqlitePool,
    project_id: i64,
    action: &AiAction,
) -> Result<(), AppError> {
    match action {
        AiAction::CreateTask {
            title,
            priority,
            due_date,
            column,
        } => {
            let column_id: i64 = if let Some(col_name) = column {
                sqlx::query_scalar(
                    "SELECT id FROM columns WHERE project_id = ? AND name = ?",
                )
                .bind(project_id)
                .bind(col_name)
                .fetch_optional(db)
                .await?
                .unwrap_or(0)
            } else {
                0
            };

            let column_id = if column_id == 0 {
                sqlx::query_scalar::<_, i64>(
                    "SELECT id FROM columns WHERE project_id = ? ORDER BY position LIMIT 1",
                )
                .bind(project_id)
                .fetch_one(db)
                .await?
            } else {
                column_id
            };

            let max_num: Option<i32> =
                sqlx::query_scalar("SELECT MAX(task_number) FROM tasks WHERE project_id = ?")
                    .bind(project_id)
                    .fetch_one(db)
                    .await?;

            let task_number = max_num.unwrap_or(0) + 1;

            let max_pos: Option<i32> =
                sqlx::query_scalar("SELECT MAX(position) FROM tasks WHERE column_id = ?")
                    .bind(column_id)
                    .fetch_one(db)
                    .await?;

            let position = max_pos.unwrap_or(-1) + 1;

            sqlx::query(
                "INSERT INTO tasks (project_id, column_id, task_number, title, priority, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(project_id)
            .bind(column_id)
            .bind(task_number)
            .bind(title)
            .bind(priority.as_deref())
            .bind(due_date.as_deref())
            .bind(position)
            .execute(db)
            .await?;
        }
        AiAction::MoveTask {
            task_number,
            column,
        } => {
            let column_id: Option<i64> = sqlx::query_scalar(
                "SELECT id FROM columns WHERE project_id = ? AND name = ?",
            )
            .bind(project_id)
            .bind(column)
            .fetch_optional(db)
            .await?;

            if let Some(col_id) = column_id {
                sqlx::query(
                    "UPDATE tasks SET column_id = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND task_number = ?",
                )
                .bind(col_id)
                .bind(project_id)
                .bind(task_number)
                .execute(db)
                .await?;
            }
        }
        AiAction::UpdateTask {
            task_number,
            fields,
        } => {
            if let Some(fields) = fields {
                if let Some(title) = fields.get("title").and_then(|v| v.as_str()) {
                    sqlx::query(
                        "UPDATE tasks SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND task_number = ?",
                    )
                    .bind(title)
                    .bind(project_id)
                    .bind(task_number)
                    .execute(db)
                    .await?;
                }
                if let Some(priority) = fields.get("priority").and_then(|v| v.as_str()) {
                    sqlx::query(
                        "UPDATE tasks SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND task_number = ?",
                    )
                    .bind(priority)
                    .bind(project_id)
                    .bind(task_number)
                    .execute(db)
                    .await?;
                }
                if let Some(due_date) = fields.get("due_date").and_then(|v| v.as_str()) {
                    sqlx::query(
                        "UPDATE tasks SET due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND task_number = ?",
                    )
                    .bind(due_date)
                    .bind(project_id)
                    .bind(task_number)
                    .execute(db)
                    .await?;
                }
                if let Some(description) = fields.get("description").and_then(|v| v.as_str()) {
                    sqlx::query(
                        "UPDATE tasks SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND task_number = ?",
                    )
                    .bind(description)
                    .bind(project_id)
                    .bind(task_number)
                    .execute(db)
                    .await?;
                }
            }
        }
        AiAction::DeleteTask { task_number } => {
            sqlx::query("DELETE FROM tasks WHERE project_id = ? AND task_number = ?")
                .bind(project_id)
                .bind(task_number)
                .execute(db)
                .await?;
        }
        AiAction::CreateJiraTicket { .. } | AiAction::SearchJira { .. } => {
            // Jira actions handled separately
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn get_chat_history(
    db: State<'_, SqlitePool>,
    project_id: i64,
) -> Result<Vec<ChatMessage>, AppError> {
    Ok(
        sqlx::query_as::<_, ChatMessage>(
            "SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at",
        )
        .bind(project_id)
        .fetch_all(db.inner())
        .await?,
    )
}
