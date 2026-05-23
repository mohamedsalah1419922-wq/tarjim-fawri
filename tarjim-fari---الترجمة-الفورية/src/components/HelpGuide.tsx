import React from "react";
import {
  HelpCircle,
  X,
  Command,
  BookOpen,
  Layers,
  Laptop,
  Mic,
  KeySquare,
} from "lucide-react";

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-sky-100 dark:border-slate-800 flex flex-col md:max-h-[85vh] max-h-[90vh] overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 text-sky-950 dark:text-sky-100 font-black text-lg">
            <HelpCircle className="w-6 h-6 text-sky-500" />
            <h2>دليل المساعدة والاختصارات</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
          {/* Shortcuts Section */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-md font-bold text-slate-800 dark:text-slate-200">
              <Command className="w-5 h-5 text-sky-500" />
              <span>اختصارات لوحة المفاتيح</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  ترجمة النص الفوري
                </span>
                <div className="flex items-center gap-1 min-w-max" dir="ltr">
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Ctrl / Cmd
                  </kbd>
                  <span className="text-slate-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Enter
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  حفظ الترجمة كنص (TXT)
                </span>
                <div className="flex items-center gap-1 min-w-max" dir="ltr">
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Ctrl / Cmd
                  </kbd>
                  <span className="text-slate-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    S
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  فتح سجل الترجمات (History)
                </span>
                <div className="flex items-center gap-1 min-w-max" dir="ltr">
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Ctrl / Cmd
                  </kbd>
                  <span className="text-slate-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    H
                  </kbd>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Guide section */}
          <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-md font-bold text-slate-800 dark:text-slate-200">
              <BookOpen className="w-5 h-5 text-sky-500" />
              <span>دليل الاستخدام السريع</span>
            </h3>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30">
                <div className="shrink-0 pt-0.5">
                  <Laptop className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-sky-950 dark:text-sky-200 mb-1">
                    بيئة العمل الذكية
                  </h4>
                  <p className="text-xs font-semibold text-sky-800/80 dark:text-sky-300/70 leading-relaxed">
                    من الأعلى، حدد نوع المحتوى (نص، صورة، فيديو، مستند). النظام
                    يحتوي على خاصية للتعرف التلقائي الذكي على اللغة لكتابتك
                    وتلائم نبرة العرض (مثلاً نبرة رسمية للعمل).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                <div className="shrink-0 pt-0.5">
                  <KeySquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-950 dark:text-purple-200 mb-1">
                    النمط الآمن والخصوصية
                  </h4>
                  <p className="text-xs font-semibold text-purple-800/80 dark:text-purple-300/70 leading-relaxed">
                    تتم جميع مهام المعالجة باستخدام المفتاح الخاص بك بدون تتبع
                    بياناتك. تأكد من تفعيل المفتاح من إعدادات (Secrets) في محرك
                    AI Studio إن دعت الحاجة.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                <div className="shrink-0 pt-0.5">
                  <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    السحب والإفلات وقاموس الكلمات
                  </h4>
                  <p className="text-xs font-semibold text-emerald-800/80 dark:text-emerald-300/70 leading-relaxed">
                    يمكنك سحب النص المُترجم وإضافته بمربع الإدخال مرة أخرى
                    لترجمة عكسية. كما يمكنك النقر المزدوج على أي كلمة لاكتشاف
                    معانيها من القاموس.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
