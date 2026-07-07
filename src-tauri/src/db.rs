use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::fs;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Course {
    pub id: i64,
    pub nome: String,
    pub deck_count: i64,
    pub ordinamento: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Deck {
    pub id: i64,
    pub nome: String,
    pub in_studiamento: i64,
    pub course_id: i64,
    pub card_count: i64,
    pub archived_count: i64,
    pub ordinamento: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Flashcard {
    pub id: i64,
    pub deck_id: i64,
    pub domanda: String,
    pub risposta: String,
    pub errori_consecutivi: i64,
    pub livello_scatola: i64,
    pub prossima_revisione: Option<String>,
    pub in_studiamento_list: i64,
    pub archiviato: i64,
    pub successi_consecutivi_ripasso: i64,
    pub mazzo_nome: Option<String>,
    pub corso_nome: Option<String>,
}

pub struct DbState {
    pub conn: std::sync::Mutex<Connection>,
}

pub fn init_db(db_path: PathBuf) -> Result<Connection> {
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).unwrap_or_default();
    }
    
    let conn = Connection::open(&db_path)?;
    conn.execute("PRAGMA foreign_keys = ON;", [])?;
    
    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            ordinamento INTEGER DEFAULT 0
         );",
        [],
    )?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            chiave TEXT PRIMARY KEY,
            valore TEXT
         );",
        [],
    )?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS decks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            in_studiamento INTEGER DEFAULT 0,
            course_id INTEGER,
            ordinamento INTEGER DEFAULT 0,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
         );",
        [],
    )?;

    // Run migrations for existing DBs
    let _ = conn.execute("ALTER TABLE courses ADD COLUMN ordinamento INTEGER DEFAULT 0;", []);
    let _ = conn.execute("ALTER TABLE decks ADD COLUMN ordinamento INTEGER DEFAULT 0;", []);
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deck_id INTEGER NOT NULL,
            domanda TEXT NOT NULL,
            risposta TEXT NOT NULL,
            errori_consecutivi INTEGER DEFAULT 0,
            livello_scatola INTEGER DEFAULT 1,
            prossima_revisione TEXT,
            in_studiamento_list INTEGER DEFAULT 0,
            archiviato INTEGER DEFAULT 0,
            successi_consecutivi_ripasso INTEGER DEFAULT 0,
            FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
         );",
        [],
    )?;
    
    // Create indexes
    conn.execute("CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_flashcards_studiamento ON flashcards(in_studiamento_list);", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_decks_course_id ON decks(course_id);", [])?;
    
    // Insert default settings
    conn.execute(
        "INSERT OR IGNORE INTO settings (chiave, valore) VALUES ('ripasso_limite_successi', '3');",
        [],
    )?;
    
    // Create default Course
    conn.execute(
        "INSERT OR IGNORE INTO courses (nome) VALUES ('Generale');",
        [],
    )?;
    
    // Get Generale course ID
    let general_id: i64 = conn.query_row(
        "SELECT id FROM courses WHERE nome = 'Generale';",
        [],
        |row| row.get(0),
    )?;
    
    // Associate any decks with null course_id to Generale
    conn.execute(
        "UPDATE decks SET course_id = ? WHERE course_id IS NULL;",
        params![general_id],
    )?;
    
    println!("Database initialized successfully at {:?}", db_path);
    Ok(conn)
}
