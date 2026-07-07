import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { RefreshCw, Archive, RotateCcw } from "lucide-react";
import { api, Flashcard } from "../api";

interface StudyViewProps {
  deckId: number;
  deckName: string;
  inStudiamento: boolean; // if deck is enabled for Ripasso
  courseId?: number; // optional course ID for filtering ripasso cards
  targetDeckId?: number; // optional deck ID for deck-specific ripasso
  ripassoLimit: number;
  onBack: () => void;
}

const cardVariants: Variants = {
  initial: {
    scale: 0.95,
    opacity: 0,
    y: 10,
    zIndex: 1
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    zIndex: 1,
    transition: {
      duration: 0.25,
      ease: "easeOut" as const,
    },
  },
  exit: (custom: any) => {
    if (custom?.type === "laso") {
      return {
        x: custom.x,
        y: custom.y,
        opacity: 0,
        scale: 0.9,
        zIndex: 2,
        transition: {
          duration: 0.3,
          ease: "easeIn" as const,
        },
      };
    }
    if (custom?.type === "nonlaso") {
      return {
        scale: 0.95,
        opacity: 0,
        y: 0,
        x: 0,
        zIndex: 0,
        transition: {
          duration: 0.25,
          ease: "easeInOut" as const,
        },
      };
    }
    return {
      opacity: 0,
      scale: 0.95,
      zIndex: 0,
      transition: {
        duration: 0.2,
      },
    };
  },
};

export const StudyView: React.FC<StudyViewProps> = ({
  deckId,
  deckName: _deckName,
  inStudiamento,
  courseId,
  targetDeckId,
  ripassoLimit,
  onBack
}) => {
  const [activeCards, setActiveCards] = useState<Flashcard[]>([]);
  const [totalCardsCount, setTotalCardsCount] = useState(0);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exitCustom, setExitCustom] = useState<{ type: string; x?: number; y?: number }>({ type: "default" });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize session
  useEffect(() => {
    loadSession();
  }, [deckId, targetDeckId]);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      let dbCards: Flashcard[] = [];
      if (deckId === -1) {
        // Load Ripasso Area cards
        if (targetDeckId !== undefined && targetDeckId !== null) {
          dbCards = (await api.getStudiamentoCards(courseId)).filter(c => c.deck_id === targetDeckId);
        } else {
          dbCards = await api.getStudiamentoCards(courseId);
        }
      } else {
        // Load standard deck cards
        dbCards = await api.getFlashcards(deckId);
      }
      
      // Sort initial queue: archived cards (archiviato = 1) must go to the end of the queue
      const sorted = [...dbCards].sort((a, b) => a.archiviato - b.archiviato);
      setActiveCards(sorted);
      setTotalCardsCount(dbCards.length);
      setShowingAnswer(false);
    } catch (e) {
      console.error("Error loading session:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentCard = activeCards.length > 0 ? activeCards[0] : null;

  const handleCardFlip = () => {
    if (activeCards.length === 0) return;
    setShowingAnswer(!showingAnswer);
  };

  const handleKnown = async () => {
    if (!currentCard) return;

    // "La so" fly away animation in a random direction
    const angle = Math.random() * 2 * Math.PI;
    const distance = 500 + Math.random() * 100;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    setExitCustom({ type: "laso", x, y });

    const card = currentCard;
    const newActive = [...activeCards];

    if (deckId === -1) {
      // Ripasso logic
      const nextSuccesses = card.successi_consecutivi_ripasso + 1;
      if (nextSuccesses >= ripassoLimit) {
        // Remove from Ripasso list
        await api.updateRipassoProgress(card.id, 0, false);
      } else {
        await api.updateRipassoProgress(card.id, nextSuccesses, true);
      }
      // Remove from current session queue (shown only once)
      newActive.shift();
    } else {
      // Standard box logic
      const nextLevel = Math.min(card.livello_scatola + 1, 5);
      await api.updateCardProgress(card.id, nextLevel, 0);
      
      // Remove from current session queue (shown only once)
      newActive.shift();
    }

    setShowingAnswer(false);
    setActiveCards(newActive);
  };

  const handleUnknown = async () => {
    if (!currentCard) return;

    setExitCustom({ type: "nonlaso" });

    const card = currentCard;
    let newActive = [...activeCards];

    if (deckId === -1) {
      // Ripasso logic: successes counter remains same, card popped from session queue
      newActive.shift();
    } else {
      // Standard box logic
      const nextLevel = 1;
      const nextErrors = card.errori_consecutivi + 1;
      await api.updateCardProgress(card.id, nextLevel, nextErrors);
      
      // If deck has Ripasso enabled, add to Ripasso list
      if (inStudiamento) {
        await api.updateRipassoProgress(card.id, 0, true);
      }

      // Move the card to the end of the queue
      const popped = newActive.shift()!;
      popped.livello_scatola = nextLevel;
      popped.errori_consecutivi = nextErrors;
      newActive.push(popped);
      newActive.sort((a, b) => a.archiviato - b.archiviato);
    }

    setShowingAnswer(false);
    setActiveCards(newActive);
  };

  const handleSkip = () => {
    // "Passa avanti" behaves like handleKnown (pop without DB updates)
    if (!currentCard) return;

    // Fly away animation like handleKnown
    const angle = Math.random() * 2 * Math.PI;
    const distance = 500 + Math.random() * 100;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    setExitCustom({ type: "laso", x, y });

    const newActive = [...activeCards];
    newActive.shift(); // Remove from current session queue
    
    setShowingAnswer(false);
    setActiveCards(newActive);
  };

  const handleArchiveToggle = async () => {
    if (!currentCard) return;

    const card = currentCard;
    const isNowArchived = card.archiviato === 0;

    try {
      await api.setCardArchiveStatus(card.id, isNowArchived);
      
      // Update local state
      const newActive = [...activeCards];
      const popped = newActive.shift()!;
      popped.archiviato = isNowArchived ? 1 : 0;
      newActive.push(popped);
      newActive.sort((a, b) => a.archiviato - b.archiviato);

      setShowingAnswer(false);
      setActiveCards(newActive);
    } catch (e) {
      console.error(e);
    }
  };

  const completedCount = totalCardsCount - activeCards.length;
  const progressRatio = totalCardsCount > 0 ? completedCount / totalCardsCount : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-orange-500">
        <RefreshCw className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col w-full">

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4 justify-between items-stretch overflow-hidden">
        {/* Navigation capsule button */}
        <div className="w-full flex items-center mb-4 shrink-0">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-tight rounded-full shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            ← TORNA ALLA HOME
          </button>
        </div>

        {activeCards.length === 0 ? (
          /* End Screen */
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200/50 backdrop-blur-md rounded-2xl shadow-xl mx-auto"
            >
              <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight mb-2">
                Ottimo lavoro!
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {deckId === -1
                  ? "Hai completato tutte le carte dell'Area Ripasso!"
                  : "Hai completato tutte le carte in questo mazzo."}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={loadSession}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} /> RICOMINCIA
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl transition-colors active:scale-95"
                >
                  ESCI
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Study Deck screen */
          <div className="flex-1 flex flex-col items-center justify-between min-h-0">
            {/* Progress Bar */}
            <div className="w-full max-w-[480px] sm:max-w-[640px] md:max-w-[800px] mb-4 flex items-center gap-3 shrink-0">
              <span className="text-sm font-extrabold text-slate-500 tracking-tight shrink-0">
                {completedCount}
              </span>
              <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </div>
              <span className="text-sm font-extrabold text-slate-500 tracking-tight shrink-0">
                {totalCardsCount}
              </span>
            </div>

            {/* Flashcard Container */}
            <div className="w-full max-w-[480px] sm:max-w-[640px] md:max-w-[800px] h-[240px] sm:h-[320px] md:h-[400px] perspective-1000 relative flex-1 min-h-0">
              <AnimatePresence mode="popLayout" custom={exitCustom}>
                {currentCard && (
                  <motion.div
                    key={currentCard.id}
                    custom={exitCustom}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full h-full relative"
                  >
                    <div
                      onClick={handleCardFlip}
                      className={`relative w-full h-full transform-style-3d cursor-pointer transition-transform duration-200 ${
                        showingAnswer ? "rotate-y-180" : ""
                      }`}
                    >
                      {/* CARD FRONT (DOMANDA) */}
                      <div
                        className={`absolute inset-0 backface-hidden flex flex-col p-6 rounded-2xl shadow-lg border transition-all ${
                          currentCard.archiviato === 1
                            ? "bg-slate-100 border-slate-350"
                            : "bg-white border-slate-200/50"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4 shrink-0">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-tight">
                            {deckId === -1 ? "domanda [ripasso]" : "domanda"}
                          </span>
                          {currentCard.archiviato === 1 && (
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight">
                              [Archiviata - Riserva]
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent flipping card
                              handleArchiveToggle();
                            }}
                            className={`px-3 py-1 text-[10px] font-extrabold tracking-tight rounded-full transition-colors flex items-center gap-1 ${
                              currentCard.archiviato === 1
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                            }`}
                          >
                            <Archive size={10} />
                            {currentCard.archiviato === 1 ? "ripristina" : "archivia"}
                          </button>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center min-h-0">
                          <p
                            className={`text-base sm:text-2xl md:text-3xl font-medium leading-relaxed break-words max-h-[120px] sm:max-h-[200px] md:max-h-[260px] overflow-y-auto w-full px-2 ${
                              currentCard.archiviato === 1
                                ? "text-slate-400"
                                : "text-slate-800"
                            }`}
                          >
                            {currentCard.domanda}
                          </p>
                        </div>
                        {/* Status indicator / Box index */}
                        {deckId === -1 && currentCard.archiviato === 0 && (
                          <div className="mt-2 text-right shrink-0">
                            <span className="text-[9px] font-extrabold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full tracking-tight">
                              Successi: {currentCard.successi_consecutivi_ripasso} / {ripassoLimit}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CARD BACK (RISPOSTA) */}
                      <div
                        className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col p-6 rounded-2xl shadow-lg border transition-all ${
                          currentCard.archiviato === 1
                            ? "bg-slate-100 border-slate-350"
                            : "bg-white border-slate-200/50"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4 shrink-0">
                          <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-tight">
                            {deckId === -1 ? "risposta [ripasso]" : "risposta"}
                          </span>
                          {currentCard.archiviato === 1 && (
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight">
                              [Archiviata - Riserva]
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent flipping card
                              handleArchiveToggle();
                            }}
                            className={`px-3 py-1 text-[10px] font-extrabold tracking-tight rounded-full transition-colors flex items-center gap-1 ${
                              currentCard.archiviato === 1
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                            }`}
                          >
                            <Archive size={10} />
                            {currentCard.archiviato === 1 ? "ripristina" : "archivia"}
                          </button>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center min-h-0">
                          <p
                            className={`text-base sm:text-2xl md:text-3xl font-medium leading-relaxed break-words max-h-[120px] sm:max-h-[200px] md:max-h-[260px] overflow-y-auto w-full px-2 ${
                              currentCard.archiviato === 1
                                ? "text-slate-400"
                                : "text-slate-800"
                            }`}
                          >
                            {currentCard.risposta}
                          </p>
                        </div>
                        {/* Status indicator / Box index */}
                        {deckId === -1 && currentCard.archiviato === 0 && (
                          <div className="mt-2 text-right shrink-0">
                            <span className="text-[9px] font-bold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">
                              Successi: {currentCard.successi_consecutivi_ripasso} / {ripassoLimit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="w-full max-w-[480px] sm:max-w-[640px] md:max-w-[800px] flex gap-4 mt-6 h-12 shrink-0">
              {currentCard && currentCard.archiviato === 1 ? (
                /* Archived Card Controls */
                <>
                  <button
                    onClick={handleArchiveToggle}
                    className="flex-1 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-extrabold text-xs uppercase tracking-tight rounded-full shadow-md transition-all flex items-center justify-center"
                  >
                    RIPRISTINA NEL MAZZO
                  </button>
                  <button
                    onClick={handleSkip}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-extrabold text-xs uppercase tracking-tight rounded-full shadow-md transition-all flex items-center justify-center"
                  >
                    PASSA AVANTI
                  </button>
                </>
              ) : (
                /* Normal Card Controls */
                <>
                  <button
                    onClick={handleUnknown}
                    className="flex-1 bg-[#533329] hover:bg-[#432921] active:scale-95 text-white font-extrabold text-xs uppercase tracking-tight rounded-full shadow-md transition-all flex items-center justify-center"
                  >
                    NON LA SO
                  </button>
                  <button
                    onClick={handleKnown}
                    className="flex-1 bg-[#486c52] hover:bg-[#3b5843] active:scale-95 text-white font-extrabold text-xs uppercase tracking-tight rounded-full shadow-md transition-all flex items-center justify-center"
                  >
                    LA SO
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            {/* Modal Panel with glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-50 w-full max-w-sm bg-white/80 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 text-center"
            >
              <h3 className="font-black text-base text-slate-800 tracking-tight mb-2">Conferma Uscita</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Vuoi davvero chiudere la sessione di studio in corso? I progressi non salvati andranno perduti.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    onBack();
                  }}
                  className="flex-1 py-2 text-xs font-extrabold uppercase tracking-tight rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10 transition-all active:scale-95"
                >
                  Conferma
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2 text-xs font-extrabold uppercase tracking-tight rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all active:scale-95"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
