import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { api, Course, Deck, Flashcard } from "../api";

interface RipassoViewProps {
  ripassoLimit: number;
  onBack: () => void;
  onStudyDeck: (
    deckId: number,
    deckName: string,
    inStudiamento: boolean,
    courseId?: number,
    targetDeckId?: number,
    courseName?: string
  ) => void;
}

interface DeckWithRipasso extends Deck {
  ripassoCardCount: number;
  ripassoCards: Flashcard[];
}

interface CourseWithRipassoDecks extends Course {
  decks: DeckWithRipasso[];
  totalRipassoCards: number;
}

export const RipassoView: React.FC<RipassoViewProps> = ({
  ripassoLimit,
  onBack,
  onStudyDeck,
}) => {
  const [courses, setCourses] = useState<CourseWithRipassoDecks[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRipassoData();
  }, [ripassoLimit]);

  const loadRipassoData = async () => {
    setIsLoading(true);
    try {
      const coursesData = await api.getCourses();
      const detailedCourses: CourseWithRipassoDecks[] = await Promise.all(
        coursesData.map(async (course) => {
          const decks = await api.getDecks(course.id);
          const ripassoCards = await api.getStudiamentoCards(course.id);

          const decksWithRipasso: DeckWithRipasso[] = decks
            .map((deck) => {
              const deckCards = ripassoCards.filter(
                (c) => c.deck_id === deck.id
              );
              return {
                ...deck,
                ripassoCardCount: deckCards.length,
                ripassoCards: deckCards,
              };
            })
            .filter((d) => d.ripassoCardCount > 0);

          const totalRipassoCards = decksWithRipasso.reduce(
            (acc, curr) => acc + curr.ripassoCardCount,
            0
          );

          return {
            ...course,
            decks: decksWithRipasso,
            totalRipassoCards,
          };
        })
      );

      // Filter courses to only show those that have decks with ripasso cards
      const activeCourses = detailedCourses.filter(
        (c) => c.decks.length > 0
      );

      setCourses(activeCourses);
    } catch (e) {
      console.error("Error loading ripasso data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full">

      {/* Main Board Area */}
      <main className="flex-1 overflow-x-auto p-6 flex flex-col items-stretch self-stretch justify-start">
        {/* Navigation capsule button */}
        <div className="w-full flex items-center mb-4 shrink-0">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-tight rounded-full shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            ↓ TORNA ALLA HOME
          </button>
        </div>

        {isLoading ? (
          <div className="w-full h-64 flex items-center justify-center text-orange-500">
            <RefreshCw className="animate-spin" size={32} />
          </div>
        ) : courses.length === 0 ? (
          <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center text-center p-8 bg-white/80 border border-slate-200/50 backdrop-blur-md rounded-2xl shadow-xl">
            <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight mb-2">Tutto in ordine!</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Non ci sono mazzi con carte da ripassare. Quando sbagli una carta durante lo studio ordinario, questa apparirà qui!
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md transition-all"
            >
              Torna alla Dashboard
            </button>
          </div>
        ) : (
          <div className="flex gap-6 items-start self-stretch justify-start overflow-x-auto pb-4">
            {/* Courses horizontal loop */}
            {courses.map((course) => (
              <div
                key={course.id}
                className="w-[310px] h-fit shrink-0 bg-white/80 border border-slate-200/50 backdrop-blur-md rounded-2xl shadow-lg flex flex-col p-4"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-extrabold text-sm tracking-tight text-slate-800 truncate max-w-[150px]" title={course.nome}>
                      {course.nome}
                    </h3>
                    <span className="text-[9px] text-orange-500 font-extrabold uppercase tracking-tight">
                      {course.totalRipassoCards} {course.totalRipassoCards === 1 ? "carta" : "carte"}
                    </span>
                  </div>
                  {course.totalRipassoCards > 0 && (
                    <button
                      onClick={() => onStudyDeck(-1, course.nome, false, course.id, undefined, course.nome)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold tracking-tight text-xs uppercase rounded-xl shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 transition-all shrink-0"
                    >
                      Ripassa
                    </button>
                  )}
                </div>

                {/* Decks Vertical List (320px high) */}
                <div className="space-y-2">
                  {course.decks.map((deck) => (
                    <div
                      key={deck.id}
                      className="p-3 bg-slate-100/80 border border-slate-200/60 hover:border-orange-500/30 rounded-xl transition-colors flex flex-col gap-2 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col min-w-0 max-w-[170px]">
                          <span className="text-xs font-extrabold tracking-tight text-slate-800 truncate">
                            {deck.nome}
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            onStudyDeck(
                              -1,
                              "Area Ripasso - " + deck.nome,
                              false,
                              course.id,
                              deck.id,
                              course.nome
                            )
                          }
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-extrabold tracking-tight text-[9px] uppercase rounded-lg shadow-sm transition-all shrink-0"
                        >
                          Ripassa singolo mazzo
                        </button>
                      </div>

                      {/* Card previews list */}
                      <div className="mt-1 pt-1 border-t border-slate-200/40 space-y-1">
                        {deck.ripassoCards.map((card) => (
                          <div key={card.id} className="text-[10px] text-slate-500 truncate" title={card.domanda}>
                            {card.domanda}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
