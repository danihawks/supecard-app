mod db;
mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Get app data directory for flashcards.db (standard Tauri storage location)
            let db_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            let db_path = db_dir.join("flashcards.db");
            
            // Initialize database and tables
            let conn = db::init_db(db_path).expect("Failed to initialize SQLite database");
            
            // Register DbState in Tauri application state
            app.manage(db::DbState { conn: std::sync::Mutex::new(conn) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_courses,
            commands::create_course,
            commands::delete_course,
            commands::get_decks,
            commands::create_deck,
            commands::delete_deck,
            commands::toggle_deck_studiamento,
            commands::get_flashcards,
            commands::update_card_progress,
            commands::update_ripasso_progress,
            commands::set_card_archive_status,
            commands::get_studiamento_cards,
            commands::get_setting,
            commands::update_ripasso_limit_setting,
            commands::select_csv_file,
            commands::import_csv,
            commands::rename_deck,
            commands::rename_course,
            commands::reorder_courses,
            commands::reorder_decks,
            commands::update_flashcard_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
