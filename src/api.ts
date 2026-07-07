import { invoke } from "@tauri-apps/api/core";

export interface Course {
  id: number;
  nome: string;
  deck_count: number;
  ordinamento: number;
}

export interface Deck {
  id: number;
  nome: string;
  in_studiamento: number;
  course_id: number;
  card_count: number;
  archived_count: number;
  ordinamento: number;
}

export interface Flashcard {
  id: number;
  deck_id: number;
  domanda: string;
  risposta: string;
  errori_consecutivi: number;
  livello_scatola: number;
  prossima_revisione: string | null;
  in_studiamento_list: number;
  archiviato: number;
  successi_consecutivi_ripasso: number;
  mazzo_nome?: string;
  corso_nome?: string;
}

export const api = {
  getCourses: (): Promise<Course[]> => invoke("get_courses"),
  createCourse: (nome: string): Promise<number> => invoke("create_course", { nome }),
  deleteCourse: (id: number): Promise<void> => invoke("delete_course", { id }),
  
  getDecks: (courseId: number): Promise<Deck[]> => invoke("get_decks", { courseId }),
  createDeck: (nome: string, courseId: number): Promise<number> => invoke("create_deck", { nome, courseId }),
  deleteDeck: (id: number): Promise<void> => invoke("delete_deck", { id }),
  toggleDeckStudiamento: (id: number, active: boolean): Promise<void> => invoke("toggle_deck_studiamento", { id, active }),
  
  getFlashcards: (deckId: number): Promise<Flashcard[]> => invoke("get_flashcards", { deckId }),
  updateCardProgress: (id: number, livelloScatola: number, erroriConsecutivi: number): Promise<void> =>
    invoke("update_card_progress", { id, livelloScatola, erroriConsecutivi }),
  updateRipassoProgress: (id: number, successi: number, inList: boolean): Promise<void> =>
    invoke("update_ripasso_progress", { id, successi, inList }),
  setCardArchiveStatus: (id: number, archived: boolean): Promise<void> =>
    invoke("set_card_archive_status", { id, archived }),
  
  getStudiamentoCards: (courseId?: number | null): Promise<Flashcard[]> =>
    invoke("get_studiamento_cards", { courseId: courseId ?? null }),
  
  getSetting: (key: string, defaultValue: string): Promise<string> =>
    invoke("get_setting", { key, default: defaultValue }),
  updateRipassoLimitSetting: (limit: number): Promise<void> =>
    invoke("update_ripasso_limit_setting", { limit }),
  
  selectCsvFile: (): Promise<string | null> => invoke("select_csv_file"),
  importCsv: (filePath: string, deckName: string, courseId: number): Promise<number> =>
    invoke("import_csv", { filePath, deckName, courseId }),
  renameDeck: (id: number, nuovoNome: string): Promise<void> =>
    invoke("rename_deck", { id, nuovoNome }),
  renameCourse: (id: number, nuovoNome: string): Promise<void> =>
    invoke("rename_course", { id, nuovoNome }),
  reorderCourses: (ids: number[]): Promise<void> =>
    invoke("reorder_courses", { ids }),
  reorderDecks: (ids: number[], courseId: number): Promise<void> =>
    invoke("reorder_decks", { ids, courseId }),
};
