use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppError;
use crate::models::task::{CreateTask, Task, UpdateTask};

#[tauri::command]
pub async fn list_tasks(
    db: State<'_, SqlitePool>,
    project_id: i64,
) -> Result<Vec<Task>, AppError> {
    Ok(
        sqlx::query_as::<_, Task>(
            "SELECT * FROM tasks WHERE project_id = ? ORDER BY column_id, position",
        )
        .bind(project_id)
        .fetch_all(db.inner())
        .await?,
    )
}

#[tauri::command]
pub async fn create_task(
    db: State<'_, SqlitePool>,
    input: CreateTask,
) -> Result<Task, AppError> {
    let max_num: Option<i32> =
        sqlx::query_scalar("SELECT MAX(task_number) FROM tasks WHERE project_id = ?")
            .bind(input.project_id)
            .fetch_one(db.inner())
            .await?;

    let task_number = max_num.unwrap_or(0) + 1;

    let max_pos: Option<i32> =
        sqlx::query_scalar("SELECT MAX(position) FROM tasks WHERE column_id = ?")
            .bind(input.column_id)
            .fetch_one(db.inner())
            .await?;

    let position = max_pos.unwrap_or(-1) + 1;

    let result = sqlx::query(
        "INSERT INTO tasks (project_id, column_id, task_number, title, description, priority, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(input.project_id)
    .bind(input.column_id)
    .bind(task_number)
    .bind(&input.title)
    .bind(&input.description)
    .bind(&input.priority)
    .bind(&input.due_date)
    .bind(position)
    .execute(db.inner())
    .await?;

    Ok(
        sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = ?")
            .bind(result.last_insert_rowid())
            .fetch_one(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn update_task(
    db: State<'_, SqlitePool>,
    input: UpdateTask,
) -> Result<Task, AppError> {
    let existing = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = ?")
        .bind(input.id)
        .fetch_one(db.inner())
        .await?;

    let title = input.title.unwrap_or(existing.title);
    let description = input.description.or(existing.description);
    let priority = input.priority.or(existing.priority);
    let due_date = input.due_date.or(existing.due_date);
    let column_id = input.column_id.unwrap_or(existing.column_id);
    let position = input.position.unwrap_or(existing.position);

    sqlx::query(
        "UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(&title)
    .bind(&description)
    .bind(&priority)
    .bind(&due_date)
    .bind(column_id)
    .bind(position)
    .bind(input.id)
    .execute(db.inner())
    .await?;

    Ok(
        sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = ?")
            .bind(input.id)
            .fetch_one(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn delete_task(db: State<'_, SqlitePool>, id: i64) -> Result<(), AppError> {
    sqlx::query("DELETE FROM tasks WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn move_task(
    db: State<'_, SqlitePool>,
    task_id: i64,
    column_id: i64,
    position: i32,
) -> Result<Task, AppError> {
    sqlx::query(
        "UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(column_id)
    .bind(position)
    .bind(task_id)
    .execute(db.inner())
    .await?;

    Ok(
        sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = ?")
            .bind(task_id)
            .fetch_one(db.inner())
            .await?,
    )
}
