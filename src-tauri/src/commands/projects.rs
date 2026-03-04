use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppError;
use crate::models::project::{CreateProject, Project};

#[tauri::command]
pub async fn list_projects(db: State<'_, SqlitePool>) -> Result<Vec<Project>, AppError> {
    Ok(
        sqlx::query_as::<_, Project>("SELECT * FROM projects ORDER BY created_at DESC")
            .fetch_all(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn create_project(
    db: State<'_, SqlitePool>,
    input: CreateProject,
) -> Result<Project, AppError> {
    let result = sqlx::query("INSERT INTO projects (name, description) VALUES (?, ?)")
        .bind(&input.name)
        .bind(&input.description)
        .execute(db.inner())
        .await?;

    let project_id = result.last_insert_rowid();

    let default_columns = vec!["Todo", "In Progress", "Done"];
    for (i, col_name) in default_columns.iter().enumerate() {
        sqlx::query("INSERT INTO columns (project_id, name, position) VALUES (?, ?, ?)")
            .bind(project_id)
            .bind(col_name)
            .bind(i as i32)
            .execute(db.inner())
            .await?;
    }

    Ok(
        sqlx::query_as::<_, Project>("SELECT * FROM projects WHERE id = ?")
            .bind(project_id)
            .fetch_one(db.inner())
            .await?,
    )
}

#[tauri::command]
pub async fn delete_project(db: State<'_, SqlitePool>, id: i64) -> Result<(), AppError> {
    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await?;
    Ok(())
}
