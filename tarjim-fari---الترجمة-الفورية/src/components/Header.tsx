import React from "react";
import {
  Sparkles,
  Sun,
  Moon,
  Globe2,
  User,
  Settings,
  HelpCircle,
} from "lucide-react";
import { ThemeMode } from "../types";

interface HeaderProps {
  theme: ThemeMode;
  toggleTheme: () => void;
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  lang,
  setLang,
  onOpenSettings,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-[#FAFAFA]/95 dark:bg-[#0F172A]/95 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0 flex items-center justify-center p-1 group cursor-default">
            {/* Custom SVG Logo simulating the attached image */}
            <svg viewBox="0 0 200 200" className="h-14 w-14 transition-transform duration-300 group-hover:scale-105">
              {/* Red Shield Background */}
              <path d="M 40 50 C 70 30 130 30 160 50 L 160 120 C 160 160 100 180 100 180 C 100 180 40 160 40 120 Z" fill="none" stroke="#b91c1c" strokeWidth="8" strokeLinejoin="round" />
              {/* Globe */}
              <circle cx="100" cy="55" r="22" fill="none" stroke="#b91c1c" strokeWidth="4" />
              <path d="M 78 55 C 78 55 100 35 122 55 C 122 55 100 75 78 55 Z" fill="none" stroke="#b91c1c" strokeWidth="3" />
              <path d="M 100 33 L 100 77" fill="none" stroke="#b91c1c" strokeWidth="3" />
              
              {/* Text: ترجمة */}
              <text x="100" y="90" fontSize="24" fontWeight="bold" fill="#b91c1c" textAnchor="middle" fontFamily="sans-serif">
                ترجمة
              </text>
              
              {/* Text: TRANSLATOR */}
              <text x="100" y="115" fontSize="22" fontWeight="900" fill="#0369a1" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1">
                TRANSLATOR
              </text>
              
              {/* Text: FOWRI and فوري */}
              <text x="75" y="140" fontSize="18" fontWeight="800" fill="#0369a1" textAnchor="middle" fontFamily="sans-serif">
                FOWRI
              </text>
              
              <text x="125" y="140" fontSize="22" fontWeight="bold" fill="#ea580c" textAnchor="middle" fontFamily="sans-serif">
                فوري
              </text>
              
              {/* Orange Arrow */}
              <path d="M 50 135 C 70 120 90 130 100 135 L 95 128 M 100 135 L 90 140" fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 select-none">
              <span className="bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-450 dark:to-blue-400 bg-clip-text text-transparent">
                Fowri
              </span>
              <span className="text-sky-950 dark:text-sky-100 font-light tracking-wide font-sans">
                Translator
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-305 border border-sky-200 dark:border-sky-900/40 font-black">
                PRO AI
              </span>
            </h1>
            <p className="text-3xs sm:text-2xs text-sky-650 dark:text-sky-350/70 font-bold hidden sm:block">
              الترجمة الفورية الفائقة للنصوص والصور والوسائط المسموعة
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Connection Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-[#0B1528]/80 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/45 shadow-3xs">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 absolute" />
            <span className="mr-1.5">الخوادم متصلة</span>
          </div>

          <button
            onClick={onOpenHelp}
            className="p-2 sm:p-2.5 rounded-xl border border-sky-150 dark:border-sky-900/50 text-sky-600 dark:text-sky-400 bg-white dark:bg-[#0B1528] hover:bg-sky-50 dark:hover:bg-[#13223D] transition-all active:scale-95 cursor-pointer"
            title="تعليمات الاختصارات والمساعدة"
          >
            <HelpCircle className="w-5 h-5 text-sky-500" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 sm:p-2.5 rounded-xl border border-sky-150 dark:border-sky-900/50 text-sky-600 dark:text-sky-400 bg-white dark:bg-[#0B1528] hover:bg-sky-50 dark:hover:bg-[#13223D] transition-all active:scale-95 cursor-pointer"
            title="إعدادات التطبيق"
          >
            <Settings className="w-5 h-5 text-sky-500" />
          </button>

          {/* Theme Mode Toggle Button */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl border border-sky-150 dark:border-sky-900/50 text-sky-600 dark:text-sky-400 bg-white dark:bg-[#0B1528] hover:bg-sky-50 dark:hover:bg-[#13223D] transition-all active:scale-95 cursor-pointer"
            aria-label="Toggle Theme"
            title="تبديل المظهر"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-sky-500" />
            ) : (
              <Sun className="w-5 h-5 text-sky-400" />
            )}
          </button>

          {/* User profile dropdown simulation */}
          <div className="flex items-center gap-1.5 pl-1">
            <div className="w-9 h-9 rounded-full bg-[#E0F2FE]/60 dark:bg-[#13223D] border-2 border-sky-305 dark:border-sky-900/60 overflow-hidden flex items-center justify-center text-sky-500 dark:text-sky-400 font-bold shrink-0">
              <User className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
            </div>
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-sky-950 dark:text-sky-300">
                حساب تجريبي
              </p>
              <p className="text-3xs text-sky-600/70 dark:text-sky-200/50">
                مستكشف نشط
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
