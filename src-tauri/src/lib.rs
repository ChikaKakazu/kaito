mod commands;
mod crypto;
mod db;
pub mod error;
mod jira;
mod models;
mod ollama;

use tauri::Manager;

use commands::{chat, checklists, columns, jira as jira_cmd, projects, tags, tasks};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::block_on(async {
                let pool = db::init_db(&handle).await.expect("failed to init DB");
                handle.manage(pool);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Projects
            projects::list_projects,
            projects::create_project,
            projects::delete_project,
            // Columns
            columns::list_columns,
            columns::create_column,
            columns::delete_column,
            columns::reorder_columns,
            // Tasks
            tasks::list_tasks,
            tasks::create_task,
            tasks::update_task,
            tasks::delete_task,
            tasks::move_task,
            // Tags
            tags::list_tags,
            tags::create_tag,
            tags::delete_tag,
            tags::add_tag_to_task,
            tags::remove_tag_from_task,
            tags::get_task_tags,
            // Checklists
            checklists::list_checklist_items,
            checklists::create_checklist_item,
            checklists::toggle_checklist_item,
            checklists::delete_checklist_item,
            // Chat
            chat::check_ollama_status,
            chat::send_chat_message,
            chat::get_chat_history,
            // Jira
            jira_cmd::list_jira_spaces,
            jira_cmd::create_jira_space,
            jira_cmd::delete_jira_space,
            jira_cmd::fetch_jira_issues,
            jira_cmd::create_jira_issue,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
