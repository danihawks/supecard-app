use tauri::State;
use rusqlite::{params, OptionalExtension};
use std::path::PathBuf;
use crate::db::{DbState, Course, Deck, Flashcard};

#[tauri::command]
pub fn get_courses(state: State<'_, DbState>) -> Result<Vec<Course>, String> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT c.id, c.nome, COUNT(d.id) AS deck_count, c.ordinamento
         FROM courses c
         LEFT JOIN decks d ON c.id = d.course_id
         GROUP BY c.id
         ORDER BY c.ordinamento ASC, c.nome ASC;"
    ).map_err(|e| e.to_string())?;

    let course_iter = stmt.query_map([], |row| {
        Ok(Course {
            id: row.get(0)?,
            nome: row.get(1)?,
            deck_count: row.get(2)?,
            ordinamento: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut courses = Vec::new();
    for course in course_iter {
        courses.push(course.map_err(|e| e.to_string())?);
    }
    Ok(courses)
}

#[tauri::command]
pub fn create_course(state: State<'_, DbState>, nome: String) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    let nome_trimmed = nome.trim();
    
    // Check if course exists
    let existing_id: Option<i64> = conn.query_row(
        "SELECT id FROM courses WHERE nome = ?;",
        params![nome_trimmed],
        |row| row.get(0),
    ).optional().map_err(|e| e.to_string())?;

    if let Some(id) = existing_id {
        return Ok(id);
    }

    conn.execute(
        "INSERT INTO courses (nome, ordinamento) VALUES (?, COALESCE((SELECT MAX(ordinamento) FROM courses), 0) + 1);",
        params![nome_trimmed],
    ).map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn delete_course(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "DELETE FROM courses WHERE id = ?;",
        params![id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn rename_course(state: State<'_, DbState>, id: i64, nuovo_nome: String) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let nome_trimmed = nuovo_nome.trim();

    if nome_trimmed.is_empty() {
        return Err("Il nome del corso non può essere vuoto.".to_string());
    }

    conn.execute(
        "UPDATE courses SET nome = ? WHERE id = ?;",
        params![nome_trimmed, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_decks(state: State<'_, DbState>, course_id: i64) -> Result<Vec<Deck>, String> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT d.id, d.nome, d.in_studiamento, d.course_id, COUNT(f.id) AS card_count,
                COALESCE(SUM(CASE WHEN f.archiviato = 1 THEN 1 ELSE 0 END), 0) AS archived_count,
                d.ordinamento
         FROM decks d
         LEFT JOIN flashcards f ON d.id = f.deck_id
         WHERE d.course_id = ?
         GROUP BY d.id
         ORDER BY d.ordinamento ASC, d.nome ASC;"
    ).map_err(|e| e.to_string())?;

    let deck_iter = stmt.query_map(params![course_id], |row| {
        Ok(Deck {
            id: row.get(0)?,
            nome: row.get(1)?,
            in_studiamento: row.get(2)?,
            course_id: row.get(3)?,
            card_count: row.get(4)?,
            archived_count: row.get(5)?,
            ordinamento: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut decks = Vec::new();
    for deck in deck_iter {
        decks.push(deck.map_err(|e| e.to_string())?);
    }
    Ok(decks)
}

#[tauri::command]
pub fn create_deck(state: State<'_, DbState>, nome: String, course_id: i64) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    let nome_trimmed = nome.trim();

    // Check if deck exists
    let existing_id: Option<i64> = conn.query_row(
        "SELECT id FROM decks WHERE nome = ?;",
        params![nome_trimmed],
        |row| row.get(0),
    ).optional().map_err(|e| e.to_string())?;

    if existing_id.is_some() {
        return Err(format!("Un mazzo chiamato '{}' esiste già.", nome_trimmed));
    }

    conn.execute(
        "INSERT INTO decks (nome, in_studiamento, course_id, ordinamento) VALUES (?, 0, ?, COALESCE((SELECT MAX(ordinamento) FROM decks WHERE course_id = ?), 0) + 1);",
        params![nome_trimmed, course_id, course_id],
    ).map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn delete_deck(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "DELETE FROM decks WHERE id = ?;",
        params![id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn toggle_deck_studiamento(state: State<'_, DbState>, id: i64, active: bool) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let val = if active { 1 } else { 0 };
    conn.execute(
        "UPDATE decks SET in_studiamento = ? WHERE id = ?;",
        params![val, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_flashcards(state: State<'_, DbState>, deck_id: i64) -> Result<Vec<Flashcard>, String> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, deck_id, domanda, risposta, errori_consecutivi, livello_scatola, prossima_revisione, in_studiamento_list, archiviato, successi_consecutivi_ripasso
         FROM flashcards
         WHERE deck_id = ?
         ORDER BY archiviato ASC;"
    ).map_err(|e| e.to_string())?;

    let card_iter = stmt.query_map(params![deck_id], |row| {
        Ok(Flashcard {
            id: row.get(0)?,
            deck_id: row.get(1)?,
            domanda: row.get(2)?,
            risposta: row.get(3)?,
            errori_consecutivi: row.get(4)?,
            livello_scatola: row.get(5)?,
            prossima_revisione: row.get(6)?,
            in_studiamento_list: row.get(7)?,
            archiviato: row.get(8)?,
            successi_consecutivi_ripasso: row.get(9)?,
            mazzo_nome: None,
            corso_nome: None,
        })
    }).map_err(|e| e.to_string())?;

    let mut cards = Vec::new();
    for card in card_iter {
        cards.push(card.map_err(|e| e.to_string())?);
    }
    Ok(cards)
}

#[tauri::command]
pub fn update_card_progress(
    state: State<'_, DbState>,
    id: i64,
    livello_scatola: i64,
    errori_consecutivi: i64
) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "UPDATE flashcards
         SET livello_scatola = ?, errori_consecutivi = ?, prossima_revisione = NULL
         WHERE id = ?;",
        params![livello_scatola, errori_consecutivi, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_ripasso_progress(
    state: State<'_, DbState>,
    id: i64,
    successi: i64,
    in_list: bool
) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let val_list = if in_list { 1 } else { 0 };
    conn.execute(
        "UPDATE flashcards
         SET successi_consecutivi_ripasso = ?, in_studiamento_list = ?
         WHERE id = ?;",
        params![successi, val_list, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_card_archive_status(state: State<'_, DbState>, id: i64, archived: bool) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let val = if archived { 1 } else { 0 };
    conn.execute(
        "UPDATE flashcards SET archiviato = ? WHERE id = ?;",
        params![val, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_studiamento_cards(state: State<'_, DbState>, course_id: Option<i64>) -> Result<Vec<Flashcard>, String> {
    let conn = state.conn.lock().unwrap();
    
    let query = if let Some(cid) = course_id {
        format!(
            "SELECT f.id, f.deck_id, f.domanda, f.risposta, f.errori_consecutivi, f.livello_scatola, f.prossima_revisione, f.in_studiamento_list, f.archiviato, f.successi_consecutivi_ripasso,
                    d.nome AS mazzo_nome, c.nome AS corso_nome
             FROM flashcards f
             JOIN decks d ON f.deck_id = d.id
             LEFT JOIN courses c ON d.course_id = c.id
             WHERE f.in_studiamento_list = 1 AND d.course_id = {}
             ORDER BY f.archiviato ASC;", cid
        )
    } else {
        "SELECT f.id, f.deck_id, f.domanda, f.risposta, f.errori_consecutivi, f.livello_scatola, f.prossima_revisione, f.in_studiamento_list, f.archiviato, f.successi_consecutivi_ripasso,
                d.nome AS mazzo_nome, c.nome AS corso_nome
         FROM flashcards f
         JOIN decks d ON f.deck_id = d.id
         LEFT JOIN courses c ON d.course_id = c.id
         WHERE f.in_studiamento_list = 1
         ORDER BY f.archiviato ASC;".to_string()
    };

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let card_iter = stmt.query_map([], |row| {
        Ok(Flashcard {
            id: row.get(0)?,
            deck_id: row.get(1)?,
            domanda: row.get(2)?,
            risposta: row.get(3)?,
            errori_consecutivi: row.get(4)?,
            livello_scatola: row.get(5)?,
            prossima_revisione: row.get(6)?,
            in_studiamento_list: row.get(7)?,
            archiviato: row.get(8)?,
            successi_consecutivi_ripasso: row.get(9)?,
            mazzo_nome: Some(row.get(10)?),
            corso_nome: Some(row.get(11)?),
        })
    }).map_err(|e| e.to_string())?;

    let mut cards = Vec::new();
    for card in card_iter {
        cards.push(card.map_err(|e| e.to_string())?);
    }
    Ok(cards)
}

#[tauri::command]
pub fn get_setting(state: State<'_, DbState>, key: String, default: String) -> Result<String, String> {
    let conn = state.conn.lock().unwrap();
    let val: Option<String> = conn.query_row(
        "SELECT valore FROM settings WHERE chiave = ?;",
        params![key],
        |row| row.get(0),
    ).optional().map_err(|e| e.to_string())?;

    Ok(val.unwrap_or(default))
}

#[tauri::command]
pub fn update_ripasso_limit_setting(state: State<'_, DbState>, limit: i64) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    
    // Save setting
    conn.execute(
        "INSERT OR REPLACE INTO settings (chiave, valore) VALUES ('ripasso_limite_successi', ?);",
        params![limit.to_string()],
    ).map_err(|e| e.to_string())?;

    // Clear cards that have already met or exceeded this limit
    conn.execute(
        "UPDATE flashcards 
         SET in_studiamento_list = 0, successi_consecutivi_ripasso = 0 
         WHERE in_studiamento_list = 1 AND successi_consecutivi_ripasso >= ?;",
        params![limit],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn select_csv_file() -> Result<Option<String>, String> {
    // Open file picker native dialog
    let file = rfd::AsyncFileDialog::new()
        .add_filter("CSV File", &["csv"])
        .pick_file()
        .await;

    Ok(file.map(|f| f.path().to_string_lossy().to_string()))
}

#[tauri::command]
pub fn import_csv(
    state: State<'_, DbState>,
    file_path: String,
    deck_name: String,
    course_id: i64
) -> Result<i64, String> {
    let conn = state.conn.lock().unwrap();
    
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("Il file CSV specificato non esiste.".to_string());
    }

    // Parse CSV
    let file = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(false) // Let's check headers manually
        .from_reader(file);

    let mut parsed_cards: Vec<(String, String)> = Vec::new();
    let mut records = rdr.records();

    // Check if first record has headers
    let first_record = match records.next() {
        Some(result) => {
            let record = result.map_err(|e| e.to_string())?;
            if record.len() >= 2 {
                let col0 = record.get(0).unwrap_or("").trim().to_lowercase();
                let col1 = record.get(1).unwrap_or("").trim().to_lowercase();
                
                // If it is a header row, we skip it
                if col0 == "domanda" || col1 == "risposta" || col0.contains("domanda") || col1.contains("risposta") {
                    // Header detected, skip it
                    None
                } else {
                    let q = record.get(0).unwrap_or("").trim().to_string();
                    let a = record.get(1).unwrap_or("").trim().to_string();
                    if !q.is_empty() && !a.is_empty() {
                        Some((q, a))
                    } else {
                        None
                    }
                }
            } else {
                None
            }
        }
        None => return Err("Il file CSV è vuoto.".to_string()),
    };

    if let Some(card) = first_record {
        parsed_cards.push(card);
    }

    for result in records {
        let record = result.map_err(|e| e.to_string())?;
        if record.len() >= 2 {
            let q = record.get(0).unwrap_or("").trim().to_string();
            let a = record.get(1).unwrap_or("").trim().to_string();
            if !q.is_empty() && !a.is_empty() {
                parsed_cards.push((q, a));
            }
        }
    }

    if parsed_cards.is_empty() {
        return Err("Nessuna flashcard valida trovata nel file CSV.".to_string());
    }

    // Now insert in a single transaction for maximum speed
    let mut conn_mut = conn;
    let tx = conn_mut.transaction().map_err(|e| e.to_string())?;

    // Create deck (using raw query so it is in transaction)
    let deck_name_trimmed = deck_name.trim();

    // Check if deck exists
    let existing_deck_id: Option<i64> = tx.query_row(
        "SELECT id FROM decks WHERE nome = ?;",
        params![deck_name_trimmed],
        |row| row.get(0),
    ).optional().map_err(|e| e.to_string())?;

    if existing_deck_id.is_some() {
        return Err(format!("Un mazzo chiamato '{}' esiste già.", deck_name_trimmed));
    }

    tx.execute(
        "INSERT INTO decks (nome, in_studiamento, course_id, ordinamento) VALUES (?, 0, ?, COALESCE((SELECT MAX(ordinamento) FROM decks WHERE course_id = ?), 0) + 1);",
        params![deck_name_trimmed, course_id, course_id],
    ).map_err(|e| e.to_string())?;

    let deck_id = tx.last_insert_rowid();

    for (q, a) in parsed_cards {
        tx.execute(
            "INSERT INTO flashcards (deck_id, domanda, risposta, errori_consecutivi, livello_scatola, in_studiamento_list, archiviato)
             VALUES (?, ?, ?, 0, 1, 0, 0);",
            params![deck_id, q, a],
        ).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(deck_id)
}

#[tauri::command]
pub fn rename_deck(state: State<'_, DbState>, id: i64, nuovo_nome: String) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    let nome_trimmed = nuovo_nome.trim();

    if nome_trimmed.is_empty() {
        return Err("Il nome del mazzo non può essere vuoto.".to_string());
    }

    // Check if another deck has this name
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM decks WHERE nome = ? AND id != ?;",
        params![nome_trimmed, id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    if count > 0 {
        return Err(format!("Un mazzo chiamato '{}' esiste già.", nome_trimmed));
    }

    conn.execute(
        "UPDATE decks SET nome = ? WHERE id = ?;",
        params![nome_trimmed, id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn reorder_courses(state: State<'_, DbState>, ids: Vec<i64>) -> Result<(), String> {
    let mut conn = state.conn.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    for (index, id) in ids.iter().enumerate() {
        tx.execute(
            "UPDATE courses SET ordinamento = ? WHERE id = ?;",
            params![index as i64, id],
        ).map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reorder_decks(state: State<'_, DbState>, ids: Vec<i64>, course_id: i64) -> Result<(), String> {
    let mut conn = state.conn.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    for (index, id) in ids.iter().enumerate() {
        tx.execute(
            "UPDATE decks SET ordinamento = ?, course_id = ? WHERE id = ?;",
            params![index as i64, course_id, id],
        ).map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

