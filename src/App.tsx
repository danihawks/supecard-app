import { useState, useEffect } from "react";
import { HelpCircle, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardView } from "./components/DashboardView";
import { StudyView } from "./components/StudyView";
import { AboutModal } from "./components/AboutModal";
import { ImportModal } from "./components/ImportModal";
import { RipassoView } from "./components/RipassoView";
import { api } from "./api";

function App() {
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "study" | "ripasso">("dashboard");
  const [studyParams, setStudyParams] = useState<{
    deckId: number;
    deckName: string;
    inStudiamento: boolean;
    courseId?: number;
    targetDeckId?: number;
    courseName?: string;
  } | null>(null);

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [ripassoLimit, setRipassoLimit] = useState(3);
  const [selectedLimit, setSelectedLimit] = useState(3);
  const [refreshKey, setRefreshKey] = useState(0); // key to force reload DashboardView
  const [totalRipassoCount, setTotalRipassoCount] = useState(0);
  const [importCsvPath, setImportCsvPath] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("supecard-theme") as "light" | "dark") || "light";
  });

  // Apply Theme class and store in localStorage
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("supecard-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("supecard-theme", "light");
    }
  }, [theme]);

  // Load Ripasso Success Limit on mount
  useEffect(() => {
    const init = async () => {
      try {
        const limitStr = await api.getSetting("ripasso_limite_successi", "3");
        const limit = parseInt(limitStr, 10);
        setRipassoLimit(limit);
        setSelectedLimit(limit);

        const cards = await api.getStudiamentoCards();
        setTotalRipassoCount(cards.length);
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setIsInitialized(true);
        setTimeout(() => {
          setShowSplash(false);
        }, 1750);
      }
    };
    init();
  }, []);

  // Fetch total ripasso count
  useEffect(() => {
    if (!isInitialized) return;
    const loadTotalRipasso = async () => {
      try {
        const cards = await api.getStudiamentoCards();
        setTotalRipassoCount(cards.length);
      } catch (e) {
        console.error("Error loading total ripasso count:", e);
      }
    };
    loadTotalRipasso();
  }, [refreshKey, ripassoLimit, isInitialized]);

  const triggerImportCsv = async () => {
    try {
      const path = await api.selectCsvFile();
      if (path) {
        setImportCsvPath(path);
        setIsImportOpen(true);
      }
    } catch (e) {
      console.error("Error selecting file:", e);
    }
  };

  const handleStudyDeck = (
    deckId: number,
    deckName: string,
    inStudiamento: boolean,
    courseId?: number,
    targetDeckId?: number,
    courseName?: string
  ) => {
    setStudyParams({ deckId, deckName, inStudiamento, courseId, targetDeckId, courseName });
    setCurrentScreen("study");
  };

  const handleBackToDashboard = () => {
    if (currentScreen === "study" && studyParams?.deckId === -1) {
      setCurrentScreen("ripasso");
    } else {
      setCurrentScreen("dashboard");
    }
    setRefreshKey(prev => prev + 1); // trigger dashboard reload
  };

  const handleImportSuccess = () => {
    setRefreshKey(prev => prev + 1); // trigger dashboard reload
  };

  return (
    <AnimatePresence>
      {showSplash ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
          }}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-colors duration-300 ${theme === "dark" ? "bg-[#0b0c10] bg-dotted-dark" : "bg-[#fafafa] bg-dotted-light"}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
            }}
            exit={{ 
              opacity: 0, 
              scale: 1.05, 
              y: -10,
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
            }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="text-6xl md:text-8xl font-black text-slate-800 tracking-tighter">
              SUPECARD 2
            </h1>
            <p 
              className="mt-3 text-2xl md:text-4xl font-extrabold text-slate-500"
              style={{ letterSpacing: "-0.05em", lineHeight: "1.1" }}
            >
              dai tuoi appunti <br />
              <span className="text-orange-500">alla tua memoria</span>
            </p>
            <p className="mt-6 text-[10px] md:text-xs text-slate-400 font-medium">
              fatto con amore da DaniHawks
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, filter: "blur(12px)", scale: 0.98 }}
          animate={{ 
            opacity: 1, 
            filter: "blur(0px)", 
            scale: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
          }}
          className={`min-h-screen w-full flex flex-col bg-[#fafafa] text-slate-800 ${theme === "dark" ? "bg-dotted-dark" : "bg-dotted-light"} overflow-x-hidden`}
        >
          {/* Top Global Header */}
          <header className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-white/70 border-b border-slate-200/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-slate-700 tracking-tighter">SUPECARD</span>
              {currentScreen === "ripasso" && (
                <span className="text-sm font-bold text-slate-400 tracking-tight ml-2">/ area ripasso</span>
              )}
              {currentScreen === "study" && studyParams && (
                <span className="text-sm text-slate-400 tracking-tight ml-2 flex items-center gap-1">
                  / <span className="italic font-medium">{studyParams.courseName || "Corso"}</span>
                  <span className="text-slate-300">/</span>
                  <span className="font-bold text-slate-700">{studyParams.deckName.replace("Area Ripasso - ", "")}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {currentScreen !== "study" && (
                <>
                  {/* Theme Toggle Button */}
                  <button
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-orange-500 font-extrabold text-xs uppercase tracking-tight rounded-xl transition-colors flex items-center gap-1.5 bg-white/50 backdrop-blur-sm shrink-0 cursor-pointer"
                    title={theme === "light" ? "Attiva Tema Scuro" : "Attiva Tema Chiaro"}
                  >
                    {theme === "light" ? (
                      <>
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 3c.132 0 .263 0 .393.007a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.991z"/>
                        </svg>
                        SCURO
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="5"></circle>
                          <line x1="12" y1="1" x2="12" y2="3"></line>
                          <line x1="12" y1="21" x2="12" y2="23"></line>
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                          <line x1="1" y1="12" x2="3" y2="12"></line>
                          <line x1="21" y1="12" x2="23" y2="12"></line>
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        CHIARO
                      </>
                    )}
                  </button>

                  {/* ABOUT Button */}
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-orange-500 font-extrabold text-xs uppercase tracking-tight rounded-xl transition-colors flex items-center gap-1.5 bg-white/50 backdrop-blur-sm shrink-0"
                  >
                    <HelpCircle size={14} /> ABOUT
                  </button>
                </>
              )}

              {currentScreen === "dashboard" && (
                <button
                  onClick={triggerImportCsv}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Download size={14} /> Importa CSV
                </button>
              )}

              {currentScreen === "ripasso" && (
                <button
                  onClick={() => {
                    setSelectedLimit(ripassoLimit);
                    setIsDiffModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md shadow-slate-700/10 hover:shadow-slate-700/25 transition-all flex items-center gap-1.5 shrink-0"
                >
                  Difficoltà ({ripassoLimit}x)
                </button>
              )}
            </div>
          </header>

          {currentScreen === "dashboard" ? (
            <DashboardView
              key={refreshKey}
              onStudyDeck={handleStudyDeck}
              onOpenImport={triggerImportCsv}
              onNavigateToRipasso={() => setCurrentScreen("ripasso")}
              totalRipassoCount={totalRipassoCount}
            />
          ) : currentScreen === "ripasso" ? (
            <RipassoView
              ripassoLimit={ripassoLimit}
              onBack={handleBackToDashboard}
              onStudyDeck={handleStudyDeck}
            />
          ) : (
            studyParams && (
              <StudyView
                deckId={studyParams.deckId}
                deckName={studyParams.deckName}
                inStudiamento={studyParams.inStudiamento}
                courseId={studyParams.courseId}
                targetDeckId={studyParams.targetDeckId}
                ripassoLimit={ripassoLimit}
                onBack={handleBackToDashboard}
              />
            )
          )}

          {/* About Modal */}
          <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

          {/* CSV Import Modal */}
          <ImportModal
            isOpen={isImportOpen}
            initialCsvPath={importCsvPath}
            onClose={() => setIsImportOpen(false)}
            onSuccess={handleImportSuccess}
          />

          {/* Difficulty Modal */}
          <AnimatePresence>
            {isDiffModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDiffModalOpen(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", duration: 0.3 }}
                  className="relative z-50 w-full max-w-sm bg-white border border-slate-200/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 text-slate-800"
                >
                  <h3 className="font-black text-lg text-slate-800 tracking-tight mb-2">Imposta Difficoltà</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-4 leading-normal">
                    Scegli quanti successi consecutivi sono necessari per considerare ripassata una carta ed eliminarla temporaneamente dalla coda.
                  </p>

                  {/* Set of Buttons */}
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={async () => {
                          try {
                            await api.updateRipassoLimitSetting(num);
                            setRipassoLimit(num);
                            setSelectedLimit(num);
                            setIsDiffModalOpen(false);
                          } catch (e) {
                            console.error("Error updating limit setting:", e);
                          }
                        }}
                        className={`flex-1 py-2 text-xs font-black tracking-tight rounded-xl border transition-all ${
                          selectedLimit === num
                            ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/10"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {num} {num === 1 ? "Successo" : "Successi"}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
