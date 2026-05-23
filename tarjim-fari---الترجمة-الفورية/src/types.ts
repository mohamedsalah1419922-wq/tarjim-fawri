export type TranslationTab = "text" | "image" | "video" | "pdf";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export type ThemeMode = "light" | "dark";

export interface TextTranslationResponse {
  translatedText: string;
  pronunciation?: string | null;
  alternatives?: string[];
}

export interface OCRElement {
  originalText: string;
  translatedText: string;
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  width: number; // percentage width (0-100)
  height: number; // percentage height (0-100)
}

export interface SubtitleItem {
  startTime: string;
  endTime: string;
  original: string;
  translated: string;
}

export const LANGUAGES: Language[] = [
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
];

export const TONES = [
  { id: "standard", label: "قياسي (Standard)", icon: "sparkles" },
  { id: "formal", label: "رسمي واحترافي (Formal)", icon: "briefcase" },
  { id: "casual", label: "ودي عامي (Casual)", icon: "smile" },
  { id: "poetic", label: "إبداعي أدبي (Creative)", icon: "feather" },
];
