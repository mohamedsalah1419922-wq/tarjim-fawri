import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { TextTranslator } from "./components/TextTranslator";
import { ImageTranslator } from "./components/ImageTranslator";
import { VideoTranslator } from "./components/VideoTranslator";
import { PdfTranslator } from "./components/PdfTranslator";
import { ApiKeyGuard } from "./components/ApiKeyGuard";
import {
  SettingsModal,
  AppThemeColor,
  applyThemeColor,
} from "./components/SettingsModal";
import { HelpGuide } from "./components/HelpGuide";
import { useNotifications } from "./hooks/useNotifications";
import { motion } from "motion/react";
import { ThemeMode, TranslationTab } from "./types";
import {
  FileText,
  Image as ImageIcon,
  Video,
  ShieldAlert,
  Cpu,
  Sparkles,
  Award,
  Star,
  ExternalLink,
  HelpCircle,
  Layers,
  FileType2,
} from "lucide-react";

export default function App() {
  // Theme state persisted in localStorage
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("tarjim_theme");
    return (saved as ThemeMode) || "light";
  });

  const [accentColor, setAccentColor] = useState<AppThemeColor>(() => {
    const saved = localStorage.getItem("tarjim_accent_color");
    return (saved as AppThemeColor) || "sky";
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    () => {
      return localStorage.getItem("tarjim_notifications") === "true";
    },
  );

  const [notificationTime, setNotificationTime] = useState<string>(() => {
    return localStorage.getItem("tarjim_notification_time") || "09:00";
  });

  const [fontScale, setFontScale] = useState<number>(() => {
    return parseFloat(localStorage.getItem("tarjim_font_scale") || "1");
  });

  const { sendTestNotification } = useNotifications(
    notificationsEnabled,
    notificationTime,
  );

  // Apply font scale dynamically
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
  }, [fontScale]);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<TranslationTab>("text");

  // Sync theme changes with the HTML DOM classList
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("tarjim_theme", theme);
  }, [theme]);

  // Sync accent color with CSS variables
  useEffect(() => {
    applyThemeColor(accentColor);
    localStorage.setItem("tarjim_accent_color", accentColor);
  }, [accentColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 transition-colors duration-500 font-sans pb-12 flex flex-col justify-between relative overflow-hidden">
      {/* Interactive Cyber Glows for Immersive Futuristic Look */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-50">
        <div className="absolute top-[5%] right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-sky-400/20 to-blue-600/10 blur-[130px] animate-pulse-subtle" />
        <div className="absolute bottom-[20%] left-[8%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-500/15 to-indigo-500/5 blur-[140px]" />
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-sky-500/5 dark:bg-sky-400/10 blur-[150px] animate-float" />
      </div>

      <div className="relative z-10 flex-grow flex flex-col">
        {/* Header */}
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          lang="ar"
          setLang={() => {}}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* Global Key status reminder */}
        <div className="bg-sky-500/5 dark:bg-[#070e1a]/70 border-b border-sky-100 dark:border-sky-950/50 text-right py-3 px-4 text-xs font-bold text-sky-800 dark:text-sky-300 shadow-xs backdrop-blur-xs select-none">
          <div className="max-w-7xl mx-auto flex items-center justify-end gap-2.5">
            <span>
              نظام الاستعمال مجاني للاستعراض. لتشغيل معالجة الذكاء الاصطناعي
              الفعلي، يرجى تهيئة مفتاح API في تبويب{" "}
              <strong className="text-sky-500 font-black">
                Settings &gt; Secrets
              </strong>{" "}
              في الجزء الجانبي لـ AI Studio.
            </span>
            <ShieldAlert className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400 shrink-0" />
          </div>
        </div>

        {/* Main interactive area */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10 flex-1 flex flex-col justify-start">
          {/* Tabs Menu Selection */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-sky-100/80 dark:border-sky-950/50 pb-6">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-black text-sky-950 dark:text-sky-200 tracking-tight flex items-center gap-2.5 justify-end">
                <span>اختر أداة الترجمة المناسبة</span>
                <Sparkles className="w-6 h-6 text-sky-500 dark:text-sky-400 animate-pulse" />
              </h2>
              <p className="text-xs sm:text-sm text-sky-700/80 dark:text-sky-350/70 mt-1.5 font-bold">
                ترجم فورياً بدعم الذكاء الاصطناعي الفائق مع الحفاظ التام على
                التنسيقات ومعالم النصوص
              </p>
            </div>

            {/* Menu Buttons container */}
            <div className="grid grid-cols-2 md:grid-cols-4 p-1.5 gap-2.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-md w-full md:w-auto">
              <button
                id="tab-video"
                onClick={() => setActiveTab("video")}
                className={`py-3 px-4 sm:px-6 rounded-xl flex items-center gap-2 justify-center text-xs font-black transition-all cursor-pointer ${
                  activeTab === "video"
                    ? "bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-500 dark:to-sky-450 text-white shadow-lg shadow-sky-500/20 scale-[1.02] ring-2 ring-sky-400/20"
                    : "text-sky-600 dark:text-sky-305 hover:bg-sky-50/70 dark:hover:bg-[#13223D]/60"
                }`}
              >
                <Video className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="hidden sm:inline">أصوات وفيديو</span>
                <span className="sm:hidden">ميديا</span>
              </button>

              <motion.button
                id="tab-pdf"
                onClick={() => setActiveTab("pdf")}
                whileHover={{ boxShadow: "0px 0px 15px rgba(14, 165, 233, 0.5)" }}
                className={`py-3 px-4 sm:px-6 rounded-xl flex items-center gap-2 justify-center text-xs font-black transition-all cursor-pointer ${
                  activeTab === "pdf"
                    ? "bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-500 dark:to-sky-450 text-white shadow-lg shadow-sky-500/20 scale-[1.02] ring-2 ring-sky-400/20"
                    : "text-sky-600 dark:text-sky-305 hover:bg-sky-50/70 dark:hover:bg-[#13223D]/60"
                }`}
              >
                <FileType2 className="w-4 h-4 shrink-0" />
                <span>المستندات</span>
              </motion.button>

              <button
                id="tab-image"
                onClick={() => setActiveTab("image")}
                className={`py-3 px-4 sm:px-6 rounded-xl flex items-center gap-2 justify-center text-xs font-black transition-all cursor-pointer ${
                  activeTab === "image"
                    ? "bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-500 dark:to-sky-450 text-white shadow-lg shadow-sky-500/20 scale-[1.02] ring-2 ring-sky-400/20"
                    : "text-sky-600 dark:text-sky-305 hover:bg-sky-50/70 dark:hover:bg-[#13223D]/60"
                }`}
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>ترجمة الصور</span>
              </button>

              <button
                id="tab-text"
                onClick={() => setActiveTab("text")}
                className={`py-3 px-4 sm:px-6 rounded-xl flex items-center gap-2 justify-center text-xs font-black transition-all cursor-pointer ${
                  activeTab === "text"
                    ? "bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-500 dark:to-sky-450 text-white shadow-lg shadow-sky-500/20 scale-[1.02] ring-2 ring-sky-400/20"
                    : "text-sky-600 dark:text-sky-305 hover:bg-sky-50/70 dark:hover:bg-[#13223D]/60"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>ترجمة نصوص</span>
              </button>
            </div>
          </div>

          {/* Render Active translation workspace segment with fine layout animations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 backdrop-blur-xl min-h-[440px] transition-all duration-305">
            {activeTab === "text" && <TextTranslator theme={theme} />}
            {activeTab === "image" && <ImageTranslator theme={theme} />}
            {activeTab === "video" && <VideoTranslator theme={theme} />}
            {activeTab === "pdf" && <PdfTranslator theme={theme} />}
          </div>

          {/* Extra Professional Detail Card: Technology specifications overview */}
          <div className="bg-white/70 dark:bg-[#070e1a]/55 p-6 sm:p-8 rounded-[2rem] border border-sky-150/70 dark:border-sky-955/45 grid grid-cols-1 md:grid-cols-3 gap-8 text-right shadow-lg shadow-sky-500/[0.01] backdrop-blur-md">
            <div className="space-y-3">
              <div className="flex items-center justify-end gap-2.5 text-sky-500 dark:text-sky-400">
                <span className="text-xs sm:text-sm font-black font-sans tracking-tight">
                  معالجة الصوت والفيديو
                </span>
                <Video className="w-5 h-5" />
              </div>
              <p className="text-2xs sm:text-xs text-[#4E696E] dark:text-sky-300/70 leading-relaxed font-semibold">
                نقوم بتلوين مخرجات الترجمة بدمج واجهات التعرف على النطق وتخطيط
                الجمل المتزامنة زمنياً، وبث النص العربي بمحاذاة التوقيت القياسي.
              </p>
            </div>

            <div className="space-y-3 border-r border-[#CBDDE0] dark:border-sky-950/80 pr-0 md:pr-8">
              <div className="flex items-center justify-end gap-2.5 text-sky-500 dark:text-sky-400">
                <span className="text-xs sm:text-sm font-black font-sans tracking-tight">
                  رسم النصوص OCR
                </span>
                <ImageIcon className="w-5 h-5" />
              </div>
              <p className="text-2xs sm:text-xs text-[#4E696E] dark:text-sky-300/70 leading-relaxed font-semibold">
                استخراج دقيق لكلمات الصور بمحاذاة ثنائية الأبعاد، واستبدال
                الأنماط بنصوص معربة فخمة معلقة في مكانها الهندسي الطبيعي
                بالكامل.
              </p>
            </div>

            <div className="space-y-3 border-r border-[#CBDDE0] dark:border-sky-950/80 pr-0 md:pr-8">
              <div className="flex items-center justify-end gap-2.5 text-sky-500 dark:text-sky-400">
                <span className="text-xs sm:text-sm font-black font-sans tracking-tight">
                  محولات الصياغة والأسلوب
                </span>
                <Cpu className="w-5 h-5" />
              </div>
              <p className="text-2xs sm:text-xs text-[#4E696E] dark:text-sky-300/70 leading-relaxed font-semibold">
                ترجمات تعتمد على صياغة بالغة الدقة تلائم سياق الأفكار، مع تفعيل
                نبرات إبداعية متباينة كالأسلوب الرسمي أو القصة الإبداعية
                الأدبية.
              </p>
            </div>
          </div>

          {/* User Guidelines Section */}
          <div className="p-6 rounded-[2rem] bg-sky-100/35 dark:bg-[#071329]/40 border border-sky-150 dark:border-sky-955/50 text-right space-y-4 shadow-sm backdrop-blur-md">
            <h4 className="text-xs sm:text-sm font-black text-sky-950 dark:text-sky-200 flex items-center justify-end gap-2.5 select-none">
              <span>دليل البدء السريع للاستفادة الكاملة من الفحص الذكي</span>
              <HelpCircle className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-2xs sm:text-xs text-sky-800/80 dark:text-sky-300/70 leading-relaxed font-semibold">
              <div className="space-y-1.5 p-4 rounded-2xl bg-white/40 dark:bg-[#070e1a]/20 border border-sky-200/20">
                <span className="font-black text-sky-950 dark:text-sky-200 block">
                  ١. الترجمة النصية الصوتية
                </span>
                <p className="text-sky-850 dark:text-sky-305/70 leading-relaxed">
                  اضغط رمز الميكروفون وتحدث بصوتك مباشرة، وسيقوم المحرك الفوري
                  بتسجيل حوارك وصياغته فوراً وتعديل الترجمة طردياً.
                </p>
              </div>
              <div className="space-y-1.5 p-4 rounded-2xl bg-white/40 dark:bg-[#070e1a]/20 border border-sky-200/20">
                <span className="font-black text-sky-950 dark:text-sky-200 block">
                  ٢. فحص لافتات الصور
                </span>
                <p className="text-sky-850 dark:text-sky-305/70 leading-relaxed">
                  التقط لافتات الطرق أو صفحات المقالات بكاميرا جهازك المحمول،
                  وسيبدأ الذكاء الاصطناعي بنقش المقابل المترجم فوق الصورة.
                </p>
              </div>
              <div className="space-y-1.5 p-4 rounded-2xl bg-white/40 dark:bg-[#070e1a]/20 border border-sky-200/20">
                <span className="font-black text-sky-950 dark:text-sky-200 block">
                  ٣. دبلجة المقاطع الزمنية
                </span>
                <p className="text-sky-850 dark:text-sky-305/70 leading-relaxed">
                  ارفع مقطع صوتي للمحاضرات أو المؤتمرات، وسنقوم بتوفير شريط
                  ترجمة كامل متزامن زمنياً بدقة عالية مع نطق واضح.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer block */}
      <footer className="w-full mt-20 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-10 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors duration-400 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-3xs sm:text-2xs font-bold">
            <a
              href="#"
              className="hover:text-sky-500 transition-colors text-sky-700/80 dark:text-sky-300/60"
            >
              سياسة الخصوصية والأمان
            </a>
            <span className="text-sky-300/40">|</span>
            <a
              href="#"
              className="hover:text-sky-500 transition-colors text-sky-700/80 dark:text-sky-300/60"
            >
              محددات شروط الاستخدام
            </a>
            <span className="text-sky-300/40">|</span>
            <a
              href="#"
              className="hover:text-sky-500 transition-colors text-sky-700/80 dark:text-sky-300/60"
            >
              فريق الدعم الفني وتواصل معنا
            </a>
          </div>

          <div className="flex items-center gap-2 font-black text-sky-900/90 dark:text-sky-200/80 tracking-tight text-3xs sm:text-2xs select-none">
            <Award className="w-5 h-5 text-sky-500 dark:text-sky-400 animate-pulse" />
            <span>الحقوق محفوظة © ٢٠٢٦ - منصة Fowri Translator الفائقة</span>
          </div>
        </div>
      </footer>
      <ApiKeyGuard />
      <HelpGuide isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        notificationTime={notificationTime}
        setNotificationTime={setNotificationTime}
        fontScale={fontScale}
        setFontScale={setFontScale}
        onTestNotification={sendTestNotification}
      />
    </div>
  );
}
