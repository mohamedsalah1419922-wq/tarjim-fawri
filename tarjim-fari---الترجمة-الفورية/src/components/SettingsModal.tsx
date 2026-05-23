import React, { useEffect, useState } from "react";
import { Settings, X, Check, Palette, Clock, Type, Minus, Plus } from "lucide-react";

export type AppThemeColor = "sky" | "indigo" | "emerald" | "rose" | "violet";

export const THEME_PALETTES: Record<AppThemeColor, Record<string, string>> = {
  sky: {
    "50": "#f0f9ff",
    "100": "#e0f2fe",
    "200": "#bae6fd",
    "300": "#7dd3fc",
    "400": "#38bdf8",
    "500": "#0ea5e9",
    "600": "#0284c7",
    "700": "#0369a1",
    "800": "#075985",
    "900": "#0c4a6e",
    "950": "#082f49",
  },
  indigo: {
    "50": "#eef2ff",
    "100": "#e0e7ff",
    "200": "#c7d2fe",
    "300": "#a5b4fc",
    "400": "#818cf8",
    "500": "#6366f1",
    "600": "#4f46e5",
    "700": "#4338ca",
    "800": "#3730a3",
    "900": "#312e81",
    "950": "#1e1b4b",
  },
  emerald: {
    "50": "#ecfdf5",
    "100": "#d1fae5",
    "200": "#a7f3d0",
    "300": "#6ee7b7",
    "400": "#34d399",
    "500": "#10b981",
    "600": "#059669",
    "700": "#047857",
    "800": "#065f46",
    "900": "#064e3b",
    "950": "#022c22",
  },
  rose: {
    "50": "#fff1f2",
    "100": "#ffe4e6",
    "200": "#fecdd3",
    "300": "#fda4af",
    "400": "#fb7185",
    "500": "#f43f5e",
    "600": "#e11d48",
    "700": "#be123c",
    "800": "#9f1239",
    "900": "#881337",
    "950": "#4c0519",
  },
  violet: {
    "50": "#f5f3ff",
    "100": "#ede9fe",
    "200": "#ddd6fe",
    "300": "#c4b5fd",
    "400": "#a78bfa",
    "500": "#8b5cf6",
    "600": "#7c3aed",
    "700": "#6d28d9",
    "800": "#5b21b6",
    "900": "#4c1d95",
    "950": "#2e1065",
  },
};

export const applyThemeColor = (color: AppThemeColor) => {
  const palette = THEME_PALETTES[color];
  const root = document.documentElement;
  Object.keys(palette).forEach((shade) => {
    root.style.setProperty(`--theme-${shade}`, palette[shade]);
  });
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: AppThemeColor;
  setAccentColor: (color: AppThemeColor) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  notificationTime: string;
  setNotificationTime: (time: string) => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
  onTestNotification: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  accentColor,
  setAccentColor,
  notificationsEnabled,
  setNotificationsEnabled,
  notificationTime,
  setNotificationTime,
  fontScale,
  setFontScale,
  onTestNotification,
}) => {
  if (!isOpen) return null;

  const handleColorSelect = (color: AppThemeColor) => {
    setAccentColor(color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
        dir="ltr"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
            <span className="text-lg">إعدادات التطبيق</span>
            <Settings className="w-5 h-5 text-sky-500" />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8 flex-1 overflow-y-auto w-full text-right">
          {/* Appearance Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 text-slate-700 dark:text-slate-300 font-bold pb-2 border-b border-slate-100 dark:border-slate-800">
              <span>تخصيص ألوان الواجهة</span>
              <Palette className="w-5 h-5 text-sky-500" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-semibold">
              اختر لون التمييز الأساسي للحصول على تجربة بصرية تناسب ذوقك. يتم
              حفظ الاختيار تلقائياً في جهازك.
            </p>

            <div className="flex items-center justify-end gap-3 flex-wrap">
              {(Object.keys(THEME_PALETTES) as AppThemeColor[]).map((c) => {
                const hex = THEME_PALETTES[c]["500"];
                const isSelected = accentColor === c;
                return (
                  <button
                    key={c}
                    onClick={() => handleColorSelect(c)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm relative group"
                    style={{ backgroundColor: hex }}
                    title={`لون ${c}`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-white dark:border-slate-800 shadow-[0_0_0_2px_var(--theme-500)]" />
                    )}
                    {isSelected && (
                      <Check className="w-6 h-6 text-white drop-shadow-md z-10" />
                    )}

                    {!isSelected && (
                      <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 text-slate-700 dark:text-slate-300 font-bold pb-2 border-b border-slate-100 dark:border-slate-800">
              <span>حجم الخط والنصوص</span>
              <Type className="w-5 h-5 text-sky-500" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-semibold">
              قم بتعديل حجم الخط العام للتطبيق لمزيد من الوضوح وسهولة القراءة.
            </p>

            <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    const newScale = Math.max(0.7, fontScale - 0.1);
                    setFontScale(newScale);
                    localStorage.setItem("tarjim_font_scale", newScale.toString());
                  }}
                  disabled={fontScale <= 0.7}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-900 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>٧٠٪</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 rounded-md">
                      {Math.round(fontScale * 100)}٪
                    </span>
                    <span>١٣٠٪</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.1"
                    value={fontScale}
                    onChange={(e) => {
                      const newScale = parseFloat(e.target.value);
                      setFontScale(newScale);
                      localStorage.setItem("tarjim_font_scale", newScale.toString());
                    }}
                    className="w-full accent-sky-500"
                    dir="ltr"
                  />
                </div>

                <button
                  onClick={() => {
                    const newScale = Math.min(1.3, fontScale + 0.1);
                    setFontScale(newScale);
                    localStorage.setItem("tarjim_font_scale", newScale.toString());
                  }}
                  disabled={fontScale >= 1.3}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-900 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 text-slate-700 dark:text-slate-300 font-bold pb-2 border-b border-slate-100 dark:border-slate-800">
              <span>التنبيهات والمراجعة</span>
              <Settings className="w-5 h-5 text-sky-500" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-semibold">
              فعّل التنبيهات اليومية للحصول على إشعار بكلمة اليوم أو لمراجعة
              الكلمات والترجمات المحفوظة في المفضلات.
            </p>

            <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const newState = !notificationsEnabled;
                    setNotificationsEnabled(newState);
                    localStorage.setItem(
                      "tarjim_notifications",
                      newState.toString(),
                    );
                    if (newState) {
                      onTestNotification();
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                    notificationsEnabled
                      ? "bg-sky-500"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      notificationsEnabled
                        ? "left-1 translate-x-6"
                        : "left-1 translate-x-0"
                    }`}
                  />
                </button>

                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  التنبيهات اليومية
                </span>
              </div>

              {notificationsEnabled && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 mt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={notificationTime}
                      onChange={(e) => {
                        setNotificationTime(e.target.value);
                        localStorage.setItem(
                          "tarjim_notification_time",
                          e.target.value,
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">وقت التنبيه</span>
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
          >
            إغلاق وحفظ
          </button>
        </div>
      </div>
    </div>
  );
};
