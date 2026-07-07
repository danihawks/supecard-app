import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative z-50 w-[460px] h-[380px] flex flex-col bg-white/85 border border-slate-200/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold tracking-wide text-orange-500">INFO SUPECARD</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-650"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* Istruzioni */}
              <div>
                <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-1">
                  ISTRUZIONI D'USO
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  SUPECARD è un'applicazione per la memorizzazione di testo. Crea un mazzo dentro ad un 'corso'
                  importando un file CSV (esportato da Excel o Google Fogli). La prima colonna del file deve
                  contenere le domande, la seconda colonna le risposte.
                </p>
              </div>

              {/* Archiviazione */}
              <div>
                <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-1">
                  ARCHIVIAZIONE CARTE
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Se una carta è troppo difficile o semplicemente non vuoi ripeterla, puoi cliccare sul pulsante
                  'archivia' in alto a destra. Le carte archiviate vengono spostate in fondo al mazzo (nella coda di riserva)
                  e non verranno più proposte nello studio regolare finché non deciderai di ripristinarle.
                </p>
              </div>

              {/* Ripasso */}
              <div>
                <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-1">
                  MODALITÀ RIPASSO
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Attiva l'interruttore 'In Ripasso' su un mazzo. Le carte per cui risponderai 'Non la so'
                  entreranno in quest'area speciale. Per farle sparire dall'Area Ripasso, dovrai indovinarle
                  di fila per il numero di volte stabilito (da 1 a 3 nelle impostazioni). Se ne sbagli una,
                  il suo contatore si azzera.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                SUPECARD 2.1 - Fatto con amore da DaniHawks
              </span>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all"
              >
                CHIUDI
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
