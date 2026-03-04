use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppError;
use crate::models::checklist::{ChecklistItem, CreateChecklistItem};

#[tauri::command]
pub async fn list_checklist_items(
    db: State<'_, SqlitePool>,
    task_id: i64,
) -> Result<Vec<ChecklistItem>, AppError> {
    Ok(
        sqlx::query_as::<_, ChecklistItem>(
            "SELECT * FROM checklists WHERE task_id = ? ORDER BY position",
        )
        .bind(task_id)
        .fetch_all(db.inner())
        .await?,
    )
}

#[tauri::command]
pub async fn create_checklist_item(
    db: State<'_, SqlitePool>,
    input: CreateChecklistItem,
) -> Result<ChecklistItem, AppError> {
    let max_pos: Option<i32> =
        sqlx::query_scalar("SELECT MAX(position) FROM checklists WHERE task_id = ?")
            .bind(input.task_id)
            .fetch_one(db.inner())
            .await?;

    let position = max_pos.unwrap_or(-1) + 1;

    let result =
        sqlx::query("INSERT INTO checklists (task_id, title, position) VALUES (?, ?, ?)")
            .bind(input.task_id)
            .bind(&input.title)
            .bind(position)
            .execute(db.inner())
            .await?;

    Ok(
        sqlx::query_as::<_, ChecklistItem>("SELECT * FROM checklists WHERE id = ?")
            .bind(result.last_insert_rowid())
            .fetch_one(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn toggle_checklist_item(
    db: State<'_, SqlitePool>,
    id: i64,
) -> Result<ChecklistItem, AppError> {
    sqlx::query("UPDATE checklists SET is_done = NOT is_done WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await?;

    Ok(
        sqlx::query_as::<_, ChecklistItem>("SELECT * FROM checklists WHERE id = ?")
            .bind(id)
            .fetch_one(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn delete_checklist_item(
    db: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM checklists WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await?;
    Ok(())
}
