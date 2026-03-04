use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppError;
use crate::models::column::{Column, CreateColumn, UpdateColumnPosition};

#[tauri::command]
pub async fn list_columns(
    db: State<'_, SqlitePool>,
    project_id: i64,
) -> Result<Vec<Column>, AppError> {
    Ok(
        sqlx::query_as::<_, Column>(
            "SELECT * FROM columns WHERE project_id = ? ORDER BY position",
        )
        .bind(project_id)
        .fetch_all(db.inner())
        .await?,
    )
}

#[tauri::command]
pub async fn create_column(
    db: State<'_, SqlitePool>,
    input: CreateColumn,
) -> Result<Column, AppError> {
    let max_pos: Option<i32> =
        sqlx::query_scalar("SELECT MAX(position) FROM columns WHERE project_id = ?")
            .bind(input.project_id)
            .fetch_one(db.inner())
            .await?;

    let position = max_pos.unwrap_or(-1) + 1;

    let result =
        sqlx::query("INSERT INTO columns (project_id, name, position) VALUES (?, ?, ?)")
            .bind(input.project_id)
            .bind(&input.name)
            .bind(position)
            .execute(db.inner())
            .await?;

    Ok(
        sqlx::query_as::<_, Column>("SELECT * FROM columns WHERE id = ?")
            .bind(result.last_insert_rowid())
            .fetch_one(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn delete_column(db: State<'_, SqlitePool>, id: i64) -> Result<(), AppError> {
    sqlx::query("DELETE FROM columns WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn reorder_columns(
    db: State<'_, SqlitePool>,
    updates: Vec<UpdateColumnPosition>,
) -> Result<(), AppError> {
    for update in updates {
        sqlx::query("UPDATE columns SET position = ? WHERE id = ?")
            .bind(update.position)
            .bind(update.id)
            .execute(db.inner())
            .await?;
    }
    Ok(())
}
