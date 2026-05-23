import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Key, X, Settings } from "lucide-react";

export const ApiKeyGuard: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          if (!data.apiKeyConfigured) {
            setShowToast(true);
          }
        }
      } catch (err) {
        console.error("Failed to check API status", err);
      } finally {
        setHasChecked(true);
      }
    };

    checkApiKey();
  }, []);

  if (!hasChecked) return null;

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 right-6 z-[200] max-w-sm w-full"
        >
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-xl overflow-hidden text-right" dir="rtl">
            <div className="flex items-start p-4 gap-4">
              <div className="shrink-0 bg-amber-100 dark:bg-amber-950/50 p-2.5 rounded-full">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">
                    مفتاح API غير متوفر
                  </h3>
                  <button 
                    onClick={() => setShowToast(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs font-semibold text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                  يبدو أن مفتاح Gemini API غير مضبوط حالياً. الرجاء إدخاله لضمان عمل الخدمة بشكل صحيح وحقيقي.
                </p>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => alert("الرجاء النقر على أيقونة الإعدادات (الترس ⚙️) أعلى يسار أو يمين المحرر واختيار تبويب Secrets ثم إضافة GEMINI_API_KEY")}
                    className="flex items-center justify-center gap-1.5 flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors active:scale-95"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>إدخال المفتاح</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Visual bottom border line */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
