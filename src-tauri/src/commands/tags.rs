use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppError;
use crate::models::tag::{CreateTag, Tag};

#[tauri::command]
pub async fn list_tags(
    db: State<'_, SqlitePool>,
    project_id: i64,
) -> Result<Vec<Tag>, AppError> {
    Ok(
        sqlx::query_as::<_, Tag>("SELECT * FROM tags WHERE project_id = ?")
            .bind(project_id)
            .fetch_all(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn create_tag(
    db: State<'_, SqlitePool>,
    input: CreateTag,
) -> Result<Tag, AppError> {
    let result = sqlx::query("INSERT INTO tags (project_id, name, color) VALUES (?, ?, ?)")
        .bind(input.project_id)
        .bind(&input.name)
        .bind(&input.color)
        .execute(db.inner())
        .await?;

    Ok(
        sqlx::query_as::<_, Tag>("SELECT * FROM tags WHERE id = ?")
            .bind(result.last_insert_rowid())
            .fetch_one(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn delete_tag(db: State<'_, SqlitePool>, id: i64) -> Result<(), AppError> {
    sqlx::query("DELETE FROM tags WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn add_tag_to_task(
    db: State<'_, SqlitePool>,
    task_id: i64,
    tag_id: i64,
) -> Result<(), AppError> {
    sqlx::query("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)")
        .bind(task_id)
        .bind(tag_id)
        .execute(db.inner())
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn remove_tag_from_task(
    db: State<'_, SqlitePool>,
    task_id: i64,
    tag_id: i64,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?")
        .bind(task_id)
        .bind(tag_id)
        .execute(db.inner())
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn get_task_tags(
    db: State<'_, SqlitePool>,
    task_id: i64,
) -> Result<Vec<Tag>, AppError> {
    Ok(
        sqlx::query_as::<_, Tag>(
            "SELECT t.* FROM tags t JOIN task_tags tt ON t.id = tt.tag_id WHERE tt.task_id = ?",
        )
        .bind(task_id)
        .fetch_all(db.inner())
        .await?,
    )
}
