import React, { useState, useEffect, useRef } from "react";
import { Plus, BookOpen, MoreVertical, ChevronUp, ChevronDown } from "lucide-react";
import { api, Course, Deck } from "../api";

interface DashboardViewProps {
  onStudyDeck: (
    deckId: number,
    deckName: string,
    inStudiamento: boolean,
    courseId?: number,
    targetDeckId?: number,
    courseName?: string
  ) => void;
  onOpenImport: () => void;
  onNavigateToRipasso: () => void;
  totalRipassoCount: number;
}

interface CourseWithDecks extends Course {
  decks: Deck[];
  ripassoCardCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStudyDeck,
  onOpenImport,
  onNavigateToRipasso,
  totalRipassoCount
}) => {
  const [courses, setCourses] = useState<CourseWithDecks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuDeckId, setActiveMenuDeckId] = useState<number | null>(null);
  const [activeMenuCourseId, setActiveMenuCourseId] = useState<number | null>(null);

  const coursesContainerRef = useRef<HTMLElement | null>(null);

  // States for custom overlay modals (no window.prompt/confirm)
  const [renameDeckId, setRenameDeckId] = useState<number | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renameCourseId, setRenameCourseId] = useState<number | null>(null);
  const [renameCourseInput, setRenameCourseInput] = useState("");
  const [deleteDeckId, setDeleteDeckId] = useState<number | null>(null);
  const [deleteDeckName, setDeleteDeckName] = useState("");
  const [deleteCourseId, setDeleteCourseId] = useState<number | null>(null);
  const [deleteCourseName, setDeleteCourseName] = useState("");
  const [customAlertMessage, setCustomAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".menu-dropdown-container") && !target.closest(".menu-trigger-button")) {
        setActiveMenuCourseId(null);
        setActiveMenuDeckId(null);
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleMoveDeckUp = async (deckId: number, courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const idx = course.decks.findIndex(d => d.id === deckId);
    if (idx <= 0) return; // Already at the top
    const newDecks = [...course.decks];
    const temp = newDecks[idx];
    newDecks[idx] = newDecks[idx - 1];
    newDecks[idx - 1] = temp;
    
    const toDeckIds = newDecks.map(d => d.id);
    try {
      await api.reorderDecks(toDeckIds, courseId);
      loadDashboardData(true);
    } catch (e) {
      console.error("Error moving deck up:", e);
    }
  };

  const handleMoveDeckDown = async (deckId: number, courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const idx = course.decks.findIndex(d => d.id === deckId);
    if (idx < 0 || idx >= course.decks.length - 1) return; // Already at the bottom
    const newDecks = [...course.decks];
    const temp = newDecks[idx];
    newDecks[idx] = newDecks[idx + 1];
    newDecks[idx + 1] = temp;
    
    const toDeckIds = newDecks.map(d => d.id);
    try {
      await api.reorderDecks(toDeckIds, courseId);
      loadDashboardData(true);
    } catch (e) {
      console.error("Error moving deck down:", e);
    }
  };

  const handleMoveCourseLeft = async (courseId: number) => {
    const idx = courses.findIndex(c => c.id === courseId);
    if (idx <= 0) return; // Already at the left
    const newCourses = [...courses];
    const temp = newCourses[idx];
    newCourses[idx] = newCourses[idx - 1];
    newCourses[idx - 1] = temp;
    
    const newIds = newCourses.map(c => c.id);
    try {
      await api.reorderCourses(newIds);
      loadDashboardData(true);
    } catch (e) {
      console.error("Error moving course left:", e);
    }
  };

  const handleMoveCourseRight = async (courseId: number) => {
    const idx = courses.findIndex(c => c.id === courseId);
    if (idx < 0 || idx >= courses.length - 1) return; // Already at the right
    const newCourses = [...courses];
    const temp = newCourses[idx];
    newCourses[idx] = newCourses[idx + 1];
    newCourses[idx + 1] = temp;
    
    const newIds = newCourses.map(c => c.id);
    try {
      await api.reorderCourses(newIds);
      loadDashboardData(true);
    } catch (e) {
      console.error("Error moving course right:", e);
    }
  };

  const loadDashboardData = async (silent?: boolean) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const coursesData = await api.getCourses();
      const detailedCourses: CourseWithDecks[] = await Promise.all(
        coursesData.map(async (course) => {
          const decks = await api.getDecks(course.id);
          const ripassoCards = await api.getStudiamentoCards(course.id);
          return {
            ...course,
            decks,
            ripassoCardCount: ripassoCards.length
          };
        })
      );
      setCourses(detailedCourses);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteCourse = (courseId: number, courseNome: string) => {
    if (courseNome === "Generale") {
      setCustomAlertMessage("Non è possibile eliminare il corso di default 'Generale'.");
      return;
    }
    setDeleteCourseId(courseId);
    setDeleteCourseName(courseNome);
  };

  const handleDeleteDeck = (deckId: number, deckNome: string) => {
    setDeleteDeckId(deckId);
    setDeleteDeckName(deckNome);
  };

  const handleRenameDeck = (deckId: number, currentNome: string) => {
    setRenameDeckId(deckId);
    setRenameInput(currentNome);
  };

  const handleRenameCourse = (courseId: number, currentNome: string) => {
    setRenameCourseId(courseId);
    setRenameCourseInput(currentNome);
  };

  const performRenameCourse = async () => {
    if (renameCourseId === null) return;
    const trimmed = renameCourseInput.trim();
    if (!trimmed) {
      setCustomAlertMessage("Il nome del corso non può essere vuoto.");
      return;
    }
    try {
      await api.renameCourse(renameCourseId, trimmed);
      setRenameCourseId(null);
      loadDashboardData();
    } catch (e: any) {
      setCustomAlertMessage(e.toString());
    }
  };

  const performRename = async () => {
    if (renameDeckId === null) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setCustomAlertMessage("Il nome del mazzo non può essere vuoto.");
      return;
    }
    try {
      await api.renameDeck(renameDeckId, trimmed);
      setRenameDeckId(null);
      loadDashboardData();
    } catch (e: any) {
      setCustomAlertMessage(e.toString());
    }
  };

  const performDeleteDeck = async () => {
    if (deleteDeckId === null) return;
    try {
      await api.deleteDeck(deleteDeckId);
      setDeleteDeckId(null);
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const performDeleteCourse = async () => {
    if (deleteCourseId === null) return;
    try {
      await api.deleteCourse(deleteCourseId);
      setDeleteCourseId(null);
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStudiamento = async (deckId: number, currentVal: number) => {
    const nextVal = currentVal === 1 ? false : true;
    try {
      await api.toggleDeckStudiamento(deckId, nextVal);
      // Update local state directly to be ultra-responsive
      setCourses(prev =>
        prev.map(c => ({
          ...c,
          decks: c.decks.map(d => (d.id === deckId ? { ...d, in_studiamento: nextVal ? 1 : 0 } : d))
        }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full justify-between">
      <div className="flex-1 flex flex-col w-full">
        {/* Area Ripasso Banner Button */}
        <div className="w-full">
          <button
            onClick={onNavigateToRipasso}
            className="w-full px-6 py-4 bg-slate-700 hover:bg-slate-800 text-white flex justify-between items-center transition-all group shadow-md shadow-slate-200/40 cursor-pointer"
          >
            <span className="font-black text-sm tracking-tight uppercase">
              ENTRA NELL'AREA RIPASSO
            </span>
            <span className="bg-orange-500 text-white text-xs font-extrabold tracking-tight px-3 py-1 rounded-full shrink-0">
              {totalRipassoCount} {totalRipassoCount === 1 ? 'CARTA IN RIPASSO' : 'CARTE IN RIPASSO'}
            </span>
          </button>
        </div>

        {/* Main Board Area */}
        <main ref={coursesContainerRef} className="flex-1 overflow-x-auto p-6 flex gap-6 items-start self-stretch relative z-10">
          {isLoading ? (
            <div className="w-full h-64 flex items-center justify-center text-orange-500">
              <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              {/* Courses horizontal loop */}
              {courses.map((course, cIdx) => (
                <div
                  key={course.id}
                  data-course-id={course.id}
                  className={`course-column w-[310px] h-fit shrink-0 bg-white/80 border border-slate-200/50 backdrop-blur-md rounded-2xl shadow-sm flex flex-col p-4 relative ${
                    activeMenuCourseId === course.id ? "z-30" : "z-10"
                  }`}
                >
                  {/* Column Header */}
                  <div className="course-column-header cursor-default flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-sm tracking-tight text-slate-800 truncate max-w-[180px]">
                        {course.nome}
                      </h3>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-tight">
                        {course.decks.length} {course.decks.length === 1 ? "Mazzo" : "Mazzi"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 relative">
                      {course.nome !== "Generale" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeMenuCourseId === course.id) {
                                setActiveMenuCourseId(null);
                              } else {
                                setActiveMenuCourseId(course.id);
                                setActiveMenuDeckId(null);
                              }
                            }}
                            className="menu-trigger-button p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                            title="Opzioni corso"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuCourseId === course.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="menu-dropdown-container absolute right-0 mt-1 w-36 bg-white/90 border border-slate-200/50 rounded-xl shadow-xl z-40 overflow-hidden backdrop-blur-md"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuCourseId(null);
                                  handleMoveCourseLeft(course.id);
                                }}
                                disabled={cIdx <= 1}
                                className="w-full text-left px-3 py-2 text-[10px] font-extrabold tracking-tight text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                              >
                                Sposta a sinistra
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuCourseId(null);
                                  handleMoveCourseRight(course.id);
                                }}
                                disabled={cIdx === courses.length - 1}
                                className="w-full text-left px-3 py-2 text-[10px] font-extrabold tracking-tight text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100 disabled:opacity-20 disabled:pointer-events-none"
                              >
                                Sposta a destra
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuCourseId(null);
                                  handleRenameCourse(course.id, course.nome);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-extrabold tracking-tight text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                              >
                                Rinomina Corso
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuCourseId(null);
                                  handleDeleteCourse(course.id, course.nome);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-extrabold tracking-tight text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-105"
                              >
                                Elimina Corso
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Decks Vertical List (320px high) */}
                  <div className="space-y-2 decks-list min-h-[150px]" data-course-id={course.id}>
                    {/* Normal Decks list */}
                    {course.decks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <BookOpen size={24} className="text-slate-300 mb-2" />
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Nessun mazzo in questo corso. Clicca su "Importa CSV" per caricarne uno!
                        </p>
                      </div>
                    ) : (
                      course.decks.map((deck, idx) => (
                        <div
                          key={deck.id}
                          data-deck-id={deck.id}
                          onClick={() => onStudyDeck(deck.id, deck.nome, deck.in_studiamento === 1, course.id, undefined, course.nome)}
                          className={`deck-item p-3 bg-slate-100/80 border border-slate-200/60 hover:border-orange-500/30 rounded-xl transition-colors flex flex-col gap-2 cursor-pointer relative backdrop-blur-sm ${
                            activeMenuDeckId === deck.id ? "z-30" : "z-0"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col max-w-[140px]">
                              <span className="text-xs font-extrabold tracking-tight text-slate-800 truncate">
                                {deck.nome}
                              </span>
                              <span className="text-[9px] uppercase tracking-tight">
                                <span className="text-slate-600 font-extrabold">
                                  {deck.card_count} {deck.card_count === 1 ? "carta" : "carte"}
                                </span>
                                <span className="text-slate-300"> / </span>
                                <span className="text-slate-400 font-medium">
                                  {deck.archived_count} {deck.archived_count === 1 ? "archiviata" : "archiviate"}
                                </span>
                              </span>
                            </div>

                            {/* Dropdown Options & Reordering Buttons */}
                            <div className="relative flex items-center gap-0.5">
                              {/* Move Up Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveDeckUp(deck.id, course.id);
                                }}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-200/45 rounded transition-colors disabled:opacity-20 disabled:pointer-events-none"
                                title="Sposta su"
                              >
                                <ChevronUp size={14} />
                              </button>

                              {/* Move Down Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveDeckDown(deck.id, course.id);
                                }}
                                disabled={idx === course.decks.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-200/45 rounded transition-colors disabled:opacity-20 disabled:pointer-events-none"
                                title="Sposta giù"
                              >
                                <ChevronDown size={14} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeMenuDeckId === deck.id) {
                                    setActiveMenuDeckId(null);
                                  } else {
                                    setActiveMenuDeckId(deck.id);
                                    setActiveMenuCourseId(null);
                                  }
                                }}
                                className="menu-trigger-button p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-200/40 rounded-lg transition-colors"
                                title="Opzioni mazzo"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {activeMenuDeckId === deck.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="menu-dropdown-container absolute right-0 mt-1 w-36 bg-white/90 border border-slate-200/50 rounded-xl shadow-xl z-40 overflow-hidden backdrop-blur-md"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuDeckId(null);
                                      handleRenameDeck(deck.id, deck.nome);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] font-extrabold tracking-tight text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    Modifica nome
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuDeckId(null);
                                      handleDeleteDeck(deck.id, deck.nome);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[10px] font-extrabold tracking-tight text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-105"
                                  >
                                    Elimina mazzo
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Deck Progress Info */}
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100/50">
                            {/* In Ripasso Apple Switch */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight">
                                In Ripasso
                              </span>
                              {/* Premium iOS 2026 Toggle Switch */}
                              <div
                                role="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStudiamento(deck.id, deck.in_studiamento);
                                }}
                                className={`w-[36px] h-[20px] rounded-full px-[2px] cursor-pointer transition-all duration-300 relative border flex items-center ${
                                  deck.in_studiamento === 1
                                    ? "bg-orange-500 border-orange-600/20 shadow-[0_1.5px_6px_rgba(249,115,22,0.25)]"
                                    : "bg-slate-200/60 border-slate-300/30 backdrop-blur-sm shadow-inner"
                                }`}
                              >
                                <div
                                  className={`h-[16px] rounded-full bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                                    deck.in_studiamento === 1
                                      ? "w-[20px] translate-x-[12px]"
                                      : "w-[16px] translate-x-0"
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {/* Hint Column to Import */}
              <div
                onClick={onOpenImport}
                className="w-[310px] h-[420px] shrink-0 border-2 border-dashed border-slate-200 hover:border-orange-500/50 hover:bg-orange-500/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-all active:scale-98 group bg-white/30 backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 group-hover:bg-orange-500/10 group-hover:border-orange-500/30 rounded-full flex items-center justify-center text-slate-400 group-hover:text-orange-500 mb-3 transition-colors">
                  <Plus size={20} />
                </div>
                <h3 className="font-black text-sm tracking-tight text-slate-500 group-hover:text-orange-500 transition-colors">
                  Importa Nuovo Mazzo
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Fai clic qui per importare un file CSV e creare un nuovo corso o mazzo!
                </p>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Rinomina Corso Modal */}
      {renameCourseId !== null && (
        <div
          onClick={() => setRenameCourseId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full max-w-sm bg-white/80 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 relative z-50"
          >
            <h3 className="font-black text-lg tracking-tight text-slate-800">Rinomina Corso</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">
                Nuovo nome
              </label>
              <input
                type="text"
                value={renameCourseInput}
                onChange={(e) => setRenameCourseInput(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                     await performRenameCourse();
                  } else if (e.key === "Escape") {
                    setRenameCourseId(null);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Nome del corso"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setRenameCourseId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs uppercase tracking-tight rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={performRenameCourse}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 transition-all"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rinomina Mazzo Modal */}
      {renameDeckId !== null && (
        <div
          onClick={() => setRenameDeckId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full max-w-sm bg-white/80 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 relative z-50"
          >
            <h3 className="font-black text-lg tracking-tight text-slate-800">Rinomina Mazzo</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">
                Nuovo nome
              </label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                     await performRename();
                  } else if (e.key === "Escape") {
                    setRenameDeckId(null);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Nome del mazzo"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setRenameDeckId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs uppercase tracking-tight rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={performRename}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 transition-all"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elimina Mazzo Modal */}
      {deleteDeckId !== null && (
        <div
          onClick={() => setDeleteDeckId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full max-w-sm bg-white/80 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 relative z-50"
          >
            <h3 className="font-black text-lg tracking-tight text-slate-800">Elimina Mazzo</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sei sicuro di voler eliminare il mazzo <strong className="text-slate-800">{deleteDeckName}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setDeleteDeckId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs uppercase tracking-tight rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={performDeleteDeck}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md transition-all"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elimina Corso Modal */}
      {deleteCourseId !== null && (
        <div
          onClick={() => setDeleteCourseId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full max-w-sm bg-white/80 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 relative z-50"
          >
            <h3 className="font-black text-lg tracking-tight text-slate-800">Elimina Corso</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sei sicuro di voler eliminare il corso <strong className="text-slate-800">{deleteCourseName}</strong> e tutti i suoi mazzi?
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setDeleteCourseId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs uppercase tracking-tight rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={performDeleteCourse}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md transition-all"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlertMessage !== null && (
        <div
          onClick={() => setCustomAlertMessage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full max-w-sm bg-white/80 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 relative z-50"
          >
            <h3 className="font-black text-lg tracking-tight text-slate-800">Attenzione</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {customAlertMessage}
            </p>
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setCustomAlertMessage(null)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
