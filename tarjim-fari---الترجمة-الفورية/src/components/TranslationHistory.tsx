import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Clock, Trash2, ArrowLeftRight, FileText, Volume2, VolumeX } from "lucide-react";

export interface HistoryItem {
  id: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  tone: string;
}

interface TranslationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
  refreshTrigger: number;
}

export const TranslationHistory: React.FC<TranslationHistoryProps> = ({ isOpen, onClose, onSelect, refreshTrigger }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingId(null);
    }
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem("tarjim_translation_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const handleSpeak = (e: React.MouseEvent, id: string, text: string, lang: string) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      if (playingId === id) {
        window.speechSynthesis.cancel();
        setPlayingId(null);
        return;
      }
      
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : lang;
      
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);

      setPlayingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const deleteItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("tarjim_translation_history", JSON.stringify(updated));
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.setItem("tarjim_translation_history", JSON.stringify([]));
  };

  const filteredHistory = history.filter(item => 
    item.sourceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.translatedText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex justify-end"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-sm md:max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10"
            dir="ltr"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-sky-950 dark:text-sky-100 font-black">
                <Clock className="w-5 h-5 text-sky-500" />
                <h3 className="text-lg">سجل الترجمات السابقة</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                title="إغلاق السجل"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  dir="rtl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في السجل المترجم..."
                  className="w-full bg-slate-100 dark:bg-[#13223D] border-0 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p className="font-bold text-sm">
                    {searchTerm ? "لا توجد نتائج مطابقة للبحث." : "لا توجد ترجمات سابقة محفوظة."}
                  </p>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item.id}
                    className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden text-right"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-1">
                         <button
                           onClick={(e) => handleSpeak(e, item.id, item.translatedText, item.targetLang)}
                           className={`p-1.5 rounded-md transition-colors ${playingId === item.id ? 'text-sky-500 bg-sky-50 dark:bg-sky-900/30' : 'text-slate-300 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 opacity-0 group-hover:opacity-100'}`}
                           title="نطق الترجمة"
                         >
                           {playingId === item.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                         </button>
                         <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="حذف من السجل"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                       <div className="flex items-center gap-1.5 text-3xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded ml-auto">
                         <span className="uppercase">{item.targetLang}</span>
                         <ArrowLeftRight className="w-3 h-3" />
                         <span className="uppercase">{item.sourceLang}</span>
                       </div>
                    </div>

                    <div 
                      className="cursor-pointer space-y-2"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                    >
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-2">
                        {item.sourceText}
                      </p>
                      <p className="text-sm font-bold text-sky-950 dark:text-sky-100 line-clamp-3 leading-relaxed">
                        {item.translatedText}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-start">
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف السجل بالكامل</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
