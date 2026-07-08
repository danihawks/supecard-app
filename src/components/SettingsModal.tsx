import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Monitor } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeSetting: "light" | "dark" | "system";
  setThemeSetting: (theme: "light" | "dark" | "system") => void;
  language: "it" | "en";
  setLanguage: (lang: "it" | "en") => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  themeSetting,
  setThemeSetting,
  language,
  setLanguage,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative z-50 w-full max-w-sm flex flex-col bg-white border border-slate-200/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-black tracking-wider text-orange-500 uppercase flex items-center gap-1.5">
                IMPOSTAZIONI
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Theme Settings Option */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">
                  Tema dell'applicazione
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setThemeSetting("light")}
                    className={`py-2 px-3 flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                      themeSetting === "light"
                        ? "border-orange-500 bg-orange-500/5 text-orange-500 shadow-sm"
                        : "border-slate-200/60 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Sun size={16} />
                    <span>Chiaro</span>
                  </button>
                  <button
                    onClick={() => setThemeSetting("dark")}
                    className={`py-2 px-3 flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                      themeSetting === "dark"
                        ? "border-orange-500 bg-orange-500/5 text-orange-500 shadow-sm"
                        : "border-slate-200/60 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Moon size={16} />
                    <span>Scuro</span>
                  </button>
                  <button
                    onClick={() => setThemeSetting("system")}
                    className={`py-2 px-3 flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                      themeSetting === "system"
                        ? "border-orange-500 bg-orange-500/5 text-orange-500 shadow-sm"
                        : "border-slate-200/60 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Monitor size={16} />
                    <span>Sistema</span>
                  </button>
                </div>
              </div>

              {/* Language Settings Option */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">
                  Lingua
                </label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "it" | "en")}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all cursor-pointer appearance-none"
                  >
                    <option value="it">Italiano (Italian)</option>
                    <option value="en">English (Inglese) - in fase di implementazione</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-tight rounded-xl shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 transition-all"
              >
                Salva e Chiudi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
