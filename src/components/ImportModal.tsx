import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Folder, Layers, FileText } from "lucide-react";
import { api, Course } from "../api";

interface ImportModalProps {
  isOpen: boolean;
  initialCsvPath: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, initialCsvPath, onClose, onSuccess }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
  const [csvPath, setCsvPath] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCourses();
      // Reset inputs
      setSelectedCourseName("");
      setErrorMsg("");
      setIsImporting(false);
      
      const file = initialCsvPath || "";
      setCsvPath(file);
      
      if (file) {
        // Extract filename without path and extension
        const separator = file.includes("\\") ? "\\" : "/";
        const parts = file.split(separator);
        const filenameWithExt = parts[parts.length - 1];
        const dotIndex = filenameWithExt.lastIndexOf(".");
        let name = dotIndex !== -1 ? filenameWithExt.substring(0, dotIndex) : filenameWithExt;
        
        // Capitalize words and replace separators with space
        name = name
          .split(/[-_]+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
          
        setNewDeckName(name);
      } else {
        setNewDeckName("");
      }
    }
  }, [isOpen, initialCsvPath]);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseName(data[0].nome);
      } else {
        setSelectedCourseName("Generale");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectFile = async () => {
    try {
      const path = await api.selectCsvFile();
      if (path) {
        setCsvPath(path);
        setErrorMsg("");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Errore nella selezione del file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const courseTrimmed = selectedCourseName.trim();
    const deckTrimmed = newDeckName.trim();
    const fileTrimmed = csvPath.trim();

    if (!courseTrimmed) {
      setErrorMsg("Devi inserire o selezionare un Corso.");
      return;
    }
    if (!deckTrimmed) {
      setErrorMsg("Devi inserire il nome del Mazzo.");
      return;
    }
    if (!fileTrimmed) {
      setErrorMsg("Devi selezionare un file CSV.");
      return;
    }

    setIsImporting(true);
    try {
      // 1. Create or get course ID
      const courseId = await api.createCourse(courseTrimmed);
      
      // 2. Import CSV
      await api.importCsv(fileTrimmed, deckTrimmed, courseId);
      
      setIsImporting(false);
      onSuccess();
      onClose();
    } catch (e: any) {
      setIsImporting(false);
      setErrorMsg(e.toString());
    }
  };

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
            className="relative z-50 w-[420px] bg-white/85 border border-slate-200/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold tracking-wide text-slate-800 flex items-center gap-2">
                Configura Nuovo Mazzo
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-650"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sezione Corso */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Folder size={12} /> Corso (Seleziona o digita un nome nuovo)
                </label>
                <div className="flex gap-1 relative">
                  <input
                    type="text"
                    value={selectedCourseName}
                    onChange={(e) => setSelectedCourseName(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Nome del corso..."
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="px-2.5 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors text-xs"
                  >
                    ▼
                  </button>
                </div>

                {/* Dropdown Suggestions */}
                {showDropdown && courses.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                    <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200/50 rounded-xl shadow-xl z-40 backdrop-blur-md bg-white/95">
                      {courses.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCourseName(c.nome);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-orange-500 hover:text-white transition-colors border-b last:border-0 border-slate-100 text-slate-700"
                        >
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sezione Mazzo */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Layers size={12} /> Nome del Mazzo (es. Capitolo 1)
                </label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Nome del mazzo..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
                />
              </div>

              {/* Sezione File CSV */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText size={12} /> File CSV (Domanda, Risposta)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectFile}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Seleziona CSV
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={csvPath}
                    placeholder="Nessun file selezionato..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap cursor-default"
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-2 text-xs bg-red-50 border border-red-200 rounded-xl text-red-500 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-colors active:scale-95"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors active:scale-95 flex items-center gap-1 shadow-sm"
                >
                  {isImporting ? "Importazione..." : "Importa"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
