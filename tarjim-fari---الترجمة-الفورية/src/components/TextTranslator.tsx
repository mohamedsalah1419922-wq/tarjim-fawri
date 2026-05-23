import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeftRight,
  Copy,
  Check,
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  Trash2,
  BookOpen,
  Layers,
  VolumeX,
  RefreshCw,
  Briefcase,
  Smile,
  Feather,
  ChevronDown,
  Zap,
  Download,
  Printer,
  Camera,
  X,
  BookA,
  Clock,
  Wand2,
  SpellCheck,
  Loader2,
  Columns,
  Rows,
  Maximize,
  Minimize,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LANGUAGES, TONES, Language } from "../types";
import { TranslationError } from "./TranslationError";
import { SearchableCombobox, ComboboxOption } from "./SearchableCombobox";
import { TranslationHistory, HistoryItem } from "./TranslationHistory";

// Framer Motion Animation Variants for exquisite, staggered transitions
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 26,
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeInOut",
    },
  },
};

const dropdownItemVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 22 },
  },
};

const alternativesContainerVariants = {
  hidden: { opacity: 0, height: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    height: "auto",
    scale: 1,
    transition: {
      height: { type: "spring", stiffness: 220, damping: 26 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.25 },
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    scale: 0.98,
    transition: {
      height: { duration: 0.25, ease: "easeInOut" },
      opacity: { duration: 0.15 },
      scale: { duration: 0.15 },
    },
  },
};

const altItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.12 } },
};

interface TextTranslatorProps {
  theme: "light" | "dark";
}

export const TextTranslator: React.FC<TextTranslatorProps> = ({ theme }) => {
  const [inputText, setInputText] = useState("");
  const [sourceLang, setSourceLang] = useState<string>(() => {
    try {
      return localStorage.getItem("text_translator_source_lang") || "auto";
    } catch {
      return "auto";
    }
  });
  const [targetLang, setTargetLang] = useState<string>(() => {
    try {
      return localStorage.getItem("text_translator_target_lang") || "ar";
    } catch {
      return "ar";
    }
  });
  const [tone, setTone] = useState<string>(() => {
    try {
      return localStorage.getItem("text_translator_tone") || "standard";
    } catch {
      return "standard";
    }
  });
  const [translatedText, setTranslatedText] = useState("");
  const [pronunciation, setPronunciation] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isAlternativesExpanded, setIsAlternativesExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<{
    detectedLanguage: string;
    confidence: number;
    alternatives: Array<{ code: string; confidence: number }>;
  } | null>(null);

  const [dictPopup, setDictPopup] = useState<{
    word: string;
    definition?: string;
    contextualMeaning?: string;
    loading: boolean;
    x: number;
    y: number;
  } | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  interface GrammarChange {
    error: string;
    suggestion: string;
    reason: string;
  }

  const [grammarResult, setGrammarResult] = useState<{
    correctedText: string;
    changes: GrammarChange[];
  } | null>(null);

  const [isSideBySide, setIsSideBySide] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(
    () => {
      try {
        return localStorage.getItem("text_translator_voice_uri") || null;
      } catch {
        return null;
      }
    },
  );

  const [speechRate, setSpeechRate] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("text_translator_speech_rate");
      return stored ? parseFloat(stored) : 1;
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    localStorage.setItem("text_translator_speech_rate", speechRate.toString());
  }, [speechRate]);

  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        setAvailableVoices(window.speechSynthesis.getVoices());
      }
    };
    loadVoices();
    if (
      "speechSynthesis" in window &&
      window.speechSynthesis.onvoiceschanged !== undefined
    ) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const targetVoices = availableVoices.filter((v) =>
    v.lang.startsWith(targetLang),
  );

  useEffect(() => {
    if (selectedVoiceURI)
      localStorage.setItem("text_translator_voice_uri", selectedVoiceURI);
  }, [selectedVoiceURI]);

  useEffect(() => {
    const isVoiceValid = targetVoices.some(
      (v) => v.voiceURI === selectedVoiceURI,
    );
    if (!isVoiceValid && targetVoices.length > 0) {
      const defaultVoiceURI =
        targetLang === "en"
          ? targetVoices.find((v) => v.lang === "en-US")?.voiceURI ||
            targetVoices[0].voiceURI
          : targetLang === "ar"
            ? targetVoices.find((v) => v.lang === "ar-SA")?.voiceURI ||
              targetVoices[0].voiceURI
            : targetVoices[0].voiceURI;
      setSelectedVoiceURI(defaultVoiceURI);
    }
  }, [targetLang, availableVoices, selectedVoiceURI, targetVoices]);

  // Mouse movement unhides UI in focus mode
  useEffect(() => {
    if (!isFocusMode) return;
    const handleMouseMove = () => {
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isFocusMode]);

  const handleInputFocusMode = () => {
    if (!isFocusMode) return;
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2500);
  };

  // Exit focus mode with Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const getLanguageLabel = (code: string) => {
    const found = LANGUAGES.find((l) => l.code === code);
    return found ? `${found.flag} ${found.nativeName}` : code;
  };

  const getToneDescription = (id: string) => {
    switch (id) {
      case "standard":
        return "الترجمة الرسمية العادية المتوازنة والدقيقة";
      case "formal":
        return "أسلوب أكاديمي احترافي ملائم للأعمال والعقود";
      case "casual":
        return "أسلوب عامي بسيط وودي للدردشة اليومية";
      case "poetic":
        return "ترجمة بليغة مليئة بالجماليات البلاغية والمجاز";
      default:
        return "";
    }
  };

  const getDynamicPlaceholder = (toneId: string) => {
    switch (toneId) {
      case "poetic":
        return "اكتب قصيدتك، روايتك، أو جملتك الأدبية والشعرية هنا لنترجمها بأسلوب بليغ مليء بالجماليات البلاغية والمجاز...";
      case "formal":
        return "اكتب البريد الإلكتروني المهني، العقد القانوني، أو المستند الرسمي هنا لنترجمه بصياغة أكاديمية واحترافية رصينة...";
      case "casual":
        return "اكتب رسالتك الودية، عبارات الدردشة اليومية، أو تعليقاتك هنا لنترجمها بأسلوب عامي بسيط وتلقائي ملائم للأصدقاء...";
      case "standard":
      default:
        return "اكتب النص المرجو ترجمته هنا، أو اضغط على رمز الميكروفون للتحدث بصوتك مباشرة وسنتولى معالجته بالدقة الرسمية المعتادة...";
    }
  };

  // States for web APIs
  const [isCopied, setIsCopied] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Reset star state when source or translation output changes to avoid stale star
    setIsStarred(false);
  }, [translatedText, sourceLang, targetLang]);

  const recognitionRef = useRef<any>(null);

  const sourceLangOptions: ComboboxOption[] = [
    {
      value: "auto",
      label: "التعرف التلقائي الذكي",
      flag: "🔍",
      subLabel: "مطابقة تلقائية بالذكاء الاصطناعي مع تقدير الثقة",
    },
    ...LANGUAGES.map((l) => ({
      value: l.code,
      label: l.nativeName,
      flag: l.flag,
      subLabel: `${l.name} (${l.code.toUpperCase()})`,
    })),
  ];

  const targetLangOptions: ComboboxOption[] = LANGUAGES.filter(
    (l) => l.code !== "auto",
  ).map((l) => ({
    value: l.code,
    label: l.nativeName,
    flag: l.flag,
    subLabel: `${l.name} (${l.code.toUpperCase()})`,
  }));

  const toneOptions: ComboboxOption[] = [
    {
      value: "standard",
      label: "قياسي (Standard)",
      subLabel: "الترجمة الرسمية العادية المتوازنة والدقيقة",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      value: "formal",
      label: "رسمي واحترافي (Formal)",
      subLabel: "أسلوب أكاديمي احترافي ملائم للأعمال والعقود",
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      value: "casual",
      label: "ودي عامي (Casual)",
      subLabel: "أسلوب عامي بسيط وودي للدردشة اليومية",
      icon: <Smile className="w-4 h-4" />,
    },
    {
      value: "poetic",
      label: "إبداعي أدبي (Poetic)",
      subLabel: "ترجمة بليغة مليئة بالجماليات البلاغية والمجاز",
      icon: <Feather className="w-4 h-4" />,
    },
  ];

  const renderToneTrigger = (
    selected: ComboboxOption | undefined,
    isOpen: boolean,
  ) => {
    return (
      <button
        id="tone-dropdown-toggle"
        type="button"
        className="w-full flex items-center justify-between bg-white dark:bg-[#070F1E] py-2.5 px-4 rounded-xl border border-sky-155 dark:border-sky-900/65 text-sky-950 dark:text-sky-200 font-bold focus:ring-2 focus:ring-sky-500/25 focus:outline-none cursor-pointer text-right transition-all hover:border-sky-400 select-none shadow-3xs"
      >
        <ChevronDown
          className={`w-4 h-4 text-sky-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 shrink-0">
            {selected?.icon || <Sparkles className="w-4 h-4" />}
          </span>
          <div className="flex flex-col items-start leading-none gap-0.5 select-none text-right">
            <span className="text-[9px] text-sky-500 dark:text-sky-400 font-black tracking-wider">
              نبرة وصياغة الترجمة
            </span>
            <span className="text-xs font-black truncate max-w-[150px]">
              {selected ? selected.label : "قياسي (Standard)"}
            </span>
          </div>
        </div>
      </button>
    );
  };

  // Quick examples
  const PRESETS = [
    {
      text: "مرحبا بك في منصتنا لخدمات الترجمة الذكية الفورية.",
      label: "ترحيب",
    },
    {
      text: "Could you please review these legal documents and prepare feedback?",
      label: "عمل",
    },
    {
      text: "إن السعادة كنز لا يفنى، تبدأ من الرضى الداخلي وتنعكس على الآخرين.",
      label: "أدبي",
    },
  ];

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition error", e);
        setIsListening(false);
        if (e.error === "not-allowed") {
          setError("لم نتمكن من الوصول للميكروفون. يرجى تفعيل الصلاحية.");
        } else {
          setError("حدث خطأ أثناء الاستماع للصوت.");
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setInputText((prev) => (prev ? prev + " " + text : text));
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Listen to language or input text changes to decide automatic routing
  const handleGrammarCheck = async () => {
    if (!inputText.trim()) return;

    setIsCheckingGrammar(true);
    setGrammarResult(null);

    try {
      const res = await fetch("/api/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          sourceLang: sourceLang,
        }),
      });

      if (!res.ok) {
        throw new Error("فشلت عملية التحقق النحوي");
      }

      const data = await res.json();
      setGrammarResult(data);
    } catch (err: any) {
      console.error(err);
      // Optional: highlight error to user but not full block for now
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setTranslatedText("");
      setPronunciation(null);
      setAlternatives([]);
      setDetection(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/translate-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          sourceLang: sourceLang === "auto" ? "" : sourceLang,
          targetLang,
          tone,
        }),
      });

      if (!res.ok) {
        throw new Error("فشلت عملية الترجمة.");
      }

      const data = await res.json();
      setTranslatedText(data.translatedText);
      setPronunciation(data.pronunciation || null);
      setAlternatives(data.alternatives || []);
      setDetection(data.detection || null);

      // Save to History
      try {
        const stored = localStorage.getItem("tarjim_translation_history");
        let history: HistoryItem[] = stored ? JSON.parse(stored) : [];
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          sourceText: inputText,
          translatedText: data.translatedText,
          sourceLang:
            sourceLang === "auto" && data.detection
              ? data.detection.detectedLanguage
              : sourceLang,
          targetLang,
          tone,
        };
        // Remove duplicate if same text
        history = history.filter(
          (item) =>
            !(
              item.sourceText === newItem.sourceText &&
              item.targetLang === newItem.targetLang
            ),
        );
        history.unshift(newItem);
        // Keep last 50 items
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem(
          "tarjim_translation_history",
          JSON.stringify(history),
        );
        setHistoryRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        console.error("Error saving history:", err);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع أثناء معالجة الترجمة.");
    } finally {
      setIsLoading(false);
    }
  };

  // Persist language and tone preferences in localStorage
  useEffect(() => {
    try {
      localStorage.setItem("text_translator_source_lang", sourceLang);
      localStorage.setItem("text_translator_target_lang", targetLang);
      localStorage.setItem("text_translator_tone", tone);
    } catch (e) {
      console.error("Local storage persistence error:", e);
    }
  }, [sourceLang, targetLang, tone]);

  // Run translation with small debounce or manual click
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputText.trim()) {
        handleTranslate();
      }
    }, 850); // debounce of 850ms

    return () => clearTimeout(timer);
  }, [inputText, sourceLang, targetLang, tone]);

  // Swap Languages logic
  const handleSwapLanguages = () => {
    if (sourceLang === "auto") {
      // Cannot swap "auto-detect", default it to targetLang
      setSourceLang(targetLang);
      setTargetLang("en"); // fallback swap
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }

    // Swap text values if we have translation
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStar = () => {
    if (!translatedText || !inputText) return;
    try {
      const stored = localStorage.getItem("tarjim_favorites");
      const favorites = stored ? JSON.parse(stored) : [];
      let updated;
      if (isStarred) {
        updated = favorites.filter(
          (f: any) =>
            !(
              f.sourceText === inputText && f.translatedText === translatedText
            ),
        );
        setIsStarred(false);
      } else {
        const newFav = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          sourceText: inputText,
          translatedText: translatedText,
          sourceLang,
          targetLang,
        };
        updated = [newFav, ...favorites];
        setIsStarred(true);
      }
      localStorage.setItem("tarjim_favorites", JSON.stringify(updated));
      window.dispatchEvent(
        new StorageEvent("storage", { key: "tarjim_favorites" }),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleListenSpeech = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        // Set dynamic language code based on source selection
        recognitionRef.current.lang =
          sourceLang === "auto" ? "ar-SA" : sourceLang;
        recognitionRef.current.start();
      }
    }
  };

  const handleSpeakOutput = () => {
    if ("speechSynthesis" in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(translatedText);
      // Map basic languages to TTS codes
      utterance.lang =
        targetLang === "ar"
          ? "ar-SA"
          : targetLang === "en"
            ? "en-US"
            : targetLang;
      if (selectedVoiceURI) {
        const voice = availableVoices.find(
          (v) => v.voiceURI === selectedVoiceURI,
        );
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.rate = speechRate;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setError("خاصية نطق الكلمات غير مدعومة في متصفحك الحالي.");
    }
  };

  const handleSelectAlternative = (altText: string) => {
    // Swap alternative text as the main translated text
    const prevMain = translatedText;
    setTranslatedText(altText);
    // Add old main back to alternatives list
    setAlternatives((prev) => prev.map((a) => (a === altText ? prevMain : a)));
  };

  const handleDownloadTxt = () => {
    if (!translatedText) return;
    const element = document.createElement("a");
    const file = new Blob([translatedText], {
      type: "text/plain;charset=utf-8",
    });
    element.href = URL.createObjectURL(file);
    element.download = "translation.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPdf = () => {
    if (!translatedText) return;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    if (iframe.contentDocument) {
      iframe.contentDocument.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>الترجمة</title>
            <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  padding: 40px; 
                  line-height: 2; 
                  font-size: 14pt; 
                  color: #1e293b; 
                }
            </style>
        </head>
        <body>
            <div style="white-space: pre-wrap;">${translatedText}</div>
        </body>
        </html>
      `);
      iframe.contentDocument.close();

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  };

  const handleExportImageCanvas = () => {
    if (!translatedText) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = 2; // High resolution
    const padding = 60 * scale;
    const lineHeight = 46 * scale;
    const fontSize = 32 * scale;
    const width = 1200 * scale;

    // Setup Context
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.direction = "rtl";
    ctx.textAlign = "right";

    // Basic text wrapping simulation for RTL
    // Words are processed left to right but drawn in RTL layout
    const words = translatedText.split(/\s+/);
    let lines: string[] = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const widthText = ctx.measureText(currentLine + " " + word).width;
      if (widthText < width - padding * 2) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    const contentHeight = lines.length * lineHeight;
    const height = Math.max(
      800 * scale,
      contentHeight + padding * 3 + 60 * scale,
    );

    canvas.width = width;
    canvas.height = height;

    // Draw Background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    if (theme === "dark") {
      bgGradient.addColorStop(0, "#0F172A");
      bgGradient.addColorStop(1, "#020617");
    } else {
      bgGradient.addColorStop(0, "#FAFAFA");
      bgGradient.addColorStop(1, "#F1F5F9");
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    if (theme === "dark") {
      const glow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width / 2,
      );
      glow.addColorStop(0, "rgba(56, 189, 248, 0.08)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw Frame
    ctx.strokeStyle =
      theme === "dark"
        ? "rgba(56, 189, 248, 0.15)"
        : "rgba(14, 165, 233, 0.15)";
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(padding / 2, padding / 2, width - padding, height - padding);

    // Draw Text
    ctx.fillStyle = theme === "dark" ? "#F1F5F9" : "#0F172A";
    ctx.textBaseline = "top";
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

    let y = padding + 20 * scale;
    for (const line of lines) {
      ctx.fillText(line, width - padding, y);
      y += lineHeight;
    }

    // Draw Footer/Watermark
    ctx.fillStyle = theme === "dark" ? "#38BDF8" : "#0284C7";
    ctx.font = `bold ${18 * scale}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.direction = "ltr"; // Set back to LTR for footer
    ctx.fillText("✨ AI Studio Translate", width / 2, height - padding);

    // Export payload
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const element = document.createElement("a");
    element.href = dataUrl;
    element.download = "translation-slate.jpg";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleWordHover = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, ''); // Remove punctuation
    if (!cleanWord || cleanWord.length < 2) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    hoverTimeoutRef.current = setTimeout(async () => {
      setDictPopup({
        word: cleanWord,
        loading: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });

      try {
        const res = await fetch("/api/dictionary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: cleanWord,
            context: translatedText,
            language: targetLang,
          }),
        });
        const data = await res.json();
        setDictPopup((prev) =>
          prev
            ? {
                ...prev,
                loading: false,
                definition: data.definition,
                contextualMeaning: data.contextualMeaning,
              }
            : null,
        );
      } catch (err) {
        setDictPopup((prev) =>
          prev
            ? {
                ...prev,
                loading: false,
                definition: "فشل استرداد التعريف.",
                contextualMeaning: "",
              }
            : null,
        );
      }
    }, 600);
  };

  const handleWordLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const renderInteractiveTranslatedText = () => {
    const tokens = translatedText.split(/(\s+)/);
    return tokens.map((token, idx) => {
      if (/^\s+$/.test(token)) {
        return <span key={idx}>{token}</span>;
      }
      return (
        <span
          key={idx}
          className="hover:bg-sky-100 dark:hover:bg-sky-900/60 hover:text-sky-700 dark:hover:text-sky-300 rounded cursor-help transition-all duration-150 inline-block border-b-2 border-transparent hover:border-sky-300 dark:hover:border-sky-700 mx-[1px] px-[2px]"
          onMouseEnter={(e) => handleWordHover(token, e)}
          onMouseLeave={handleWordLeave}
          onClick={(e) => {
            // Also allow click to trigger immediately
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            handleWordHover(token, e);
          }}
        >
          {token}
        </span>
      );
    });
  };

  const handleDoubleClickText = async (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection) return;

    // We get the selected text
    const word = selection.toString().trim();
    if (!word || word.includes(" ") || word.length < 2) {
      setDictPopup(null);
      return;
    }

    // Calculate position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position tooltip above the word
    setDictPopup({
      word,
      loading: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });

    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          context: translatedText,
          language: targetLang,
        }),
      });
      const data = await res.json();
      setDictPopup((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              definition: data.definition,
              contextualMeaning: data.contextualMeaning,
            }
          : null,
      );
    } catch (err) {
      setDictPopup((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              definition: "فشل استرداد التعريف.",
              contextualMeaning: "",
            }
          : null,
      );
    }
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Very basic click outside implementation
      const target = e.target as HTMLElement;
      if (!target.closest(".dict-popup-container")) {
        setDictPopup(null);
      }
    };

    if (dictPopup) {
      document.addEventListener("mousedown", handleGlobalClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [dictPopup]);

  // Global Keyboard Shortcuts (Ctrl+Enter for translate, Ctrl+S for saving, Ctrl+H for history)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl or Cmd is pressed
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (inputText.trim()) {
            handleTranslate();
          }
        } else if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          if (translatedText) handleDownloadTxt();
        } else if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          setIsHistoryOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTranslate, handleDownloadTxt, inputText, translatedText]);

  return (
    <div
      className={`transition-all duration-500 ease-in-out ${isFocusMode ? "fixed inset-0 z-[100] bg-white dark:bg-slate-950 overflow-y-auto p-4 sm:p-10 space-y-8" : "space-y-6"}`}
    >
      {/* 0. Top Bar Actions */}
      <div
        className={`flex justify-end items-center gap-3 transition-opacity duration-700 ${isFocusMode && isTyping ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <button
          onClick={() => setIsFocusMode(!isFocusMode)}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 transition-all active:scale-95 cursor-pointer shadow-3xs"
          title={
            isFocusMode
              ? "الخروج من نمط التركيز (أو اضغط Esc)"
              : "تفعيل نمط التركيز لبيئة كتابة خالية من المشتتات"
          }
        >
          {isFocusMode ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isFocusMode ? "الخروج من التركيز" : "نمط التركيز"}
          </span>
        </button>
        <button
          onClick={() => setIsSideBySide(!isSideBySide)}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-xs font-black bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer shadow-3xs"
          title={
            isSideBySide
              ? "التبديل إلى العرض الرأسي"
              : "التبديل إلى العرض الجانبي"
          }
        >
          {isSideBySide ? (
            <Rows className="w-4 h-4" />
          ) : (
            <Columns className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isSideBySide ? "عرض رأسي" : "عرض جانبي"}
          </span>
        </button>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-xs font-black bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-100 dark:border-sky-900 transition-all active:scale-95 cursor-pointer shadow-3xs"
          title="عرض الترجمات السابقة المحفوظة"
        >
          <Clock className="w-4 h-4" />
          <span>سجل الترجمات</span>
        </button>
      </div>

      {/* 1. Language Selectors & Tone Selector Dropdown */}
      <div
        className={`flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-sky-50/40 dark:bg-[#10192C] p-2 rounded-2xl border border-sky-100/80 dark:border-sky-950/50 transition-all duration-700 ${isFocusMode && isTyping ? "opacity-0 pointer-events-none h-0 p-0 overflow-hidden border-transparent m-0" : "opacity-100"}`}
      >
        {/* Source Language */}
        <div className="w-full lg:flex-1 relative">
          <SearchableCombobox
            id="source-language-combo"
            options={sourceLangOptions}
            selectedValue={sourceLang}
            onChange={setSourceLang}
            placeholder="اختر لغة المصدر..."
            searchPlaceholder="ابحث عن لغة الإدخال المرجوة..."
            emptyText="عذراً، لم تتوفر لغة مطابقة للبحث"
          />
        </div>

        {/* Swap Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleSwapLanguages}
            className="p-3.5 rounded-xl bg-white dark:bg-[#070F1E] hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-sky-150 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 cursor-pointer active:scale-95 transition-all text-center self-center"
            title="تبديل اللغات"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>

        {/* Target Language */}
        <div className="w-full lg:flex-1">
          <SearchableCombobox
            id="target-language-combo"
            options={targetLangOptions}
            selectedValue={targetLang}
            onChange={setTargetLang}
            placeholder="اختر لغة الترجمة..."
            searchPlaceholder="ابحث عن لغة الإخراج المرجوة..."
            emptyText="عذراً، لم تتوفر لغة مطابقة للبحث"
          />
        </div>

        {/* Custom Tone Selector Dropdown */}
        <div className="w-full lg:w-72 relative">
          <SearchableCombobox
            id="tone-combo"
            options={toneOptions}
            selectedValue={tone}
            onChange={setTone}
            placeholder="اختر نبرة الترجمة..."
            searchPlaceholder="ابحث عن أسلوب الصياغة..."
            emptyText="لم نجد نبرة بهذا الاسم"
            customTrigger={renderToneTrigger}
            alignLeft={true}
          />
        </div>
      </div>

      {/* Preset Quick Starters */}
      <div
        className={`flex flex-wrap items-center gap-2 transition-all duration-700 ${isFocusMode && isTyping ? "opacity-0 pointer-events-none h-0 overflow-hidden m-0" : "opacity-100"}`}
      >
        <span className="text-xs text-sky-800 dark:text-sky-300 font-black select-none ml-1">
          أمثلة سريعة:
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setInputText(p.text)}
            className="text-xs px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg bg-sky-100/60 dark:bg-sky-950/40 border border-transparent hover:border-sky-300/60 text-sky-600 dark:text-sky-300 transition-all hover:bg-white dark:hover:bg-[#070F1E] cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Auto Language Detection & Override Panel */}
      <AnimatePresence>
        {sourceLang === "auto" && detection && inputText.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="p-4 rounded-2xl bg-sky-500/[0.04] dark:bg-sky-500/[0.02] border border-sky-100 dark:border-sky-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-right"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-end gap-2 text-xs font-black text-sky-950 dark:text-sky-200">
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-305 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-900/40 select-none">
                  الذكاء الاصطناعي
                </span>
                <span>لغة الكشف التلقائي</span>
                <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
              </div>
              <p className="text-3xs sm:text-2xs text-[#4E696E] dark:text-sky-300/70 font-bold leading-relaxed">
                تم تمييز مدخلات النصوص بنسب مطابقة مختلفة. يمكنك النقر بلمسة
                واحدة يدوياً لتثبيت لغتك المطلوبة وإلغاء التعرف التلقائي.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
              {/* Main option representing the high confidence match */}
              <button
                onClick={() => setSourceLang(detection.detectedLanguage)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-sky-500/10 cursor-pointer hover:opacity-90 active:scale-95 transition-all select-none"
                title="تثبيت هذه اللغة للترجمة دائماً"
              >
                <Check className="w-3.5 h-3.5 font-bold" />
                <span>
                  {getLanguageLabel(detection.detectedLanguage)} (
                  {detection.confidence}%)
                </span>
              </button>

              {/* Alternative detections for manual override */}
              {detection.alternatives &&
                detection.alternatives.map((alt: any) => (
                  <button
                    key={alt.code}
                    onClick={() => setSourceLang(alt.code)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-[#070F1E] border border-sky-150 dark:border-sky-900/60 text-sky-600 dark:text-sky-305 hover:border-sky-400 dark:hover:bg-sky-950/30 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    title={`تبديل يدوياً إلى ${getLanguageLabel(alt.code)}`}
                  >
                    <span>
                      {getLanguageLabel(alt.code)} ({alt.confidence}%)
                    </span>
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Workspace Textboxes */}
      <div
        className={`grid grid-cols-1 ${isSideBySide ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-5`}
      >
        {/* Input Box Column */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[300px]">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-[#FAFAFA]/50 dark:bg-slate-800/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-850 dark:text-sky-300">
                نص الإدخال
              </span>
              {sourceLang !== "auto" && (
                <button
                  type="button"
                  onClick={() => setSourceLang("auto")}
                  className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/40 border border-sky-200/50 dark:border-sky-900/30 text-sky-600 dark:text-sky-400 cursor-pointer hover:bg-sky-50 transition-all animate-pulse-subtle"
                  title="العودة لوضع التعرف التلقائي"
                >
                  العودة للكشف التلقائي 🔍
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 min-h-[36px]">
              <AnimatePresence mode="popLayout">
                {inputText && (
                  <motion.div
                    key="input-actions"
                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={handleGrammarCheck}
                      disabled={isCheckingGrammar}
                      className="p-3 sm:px-3 sm:py-1.5 min-h-[44px] sm:min-h-0 text-3xs sm:text-2xs font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-100 dark:border-indigo-800 rounded-lg flex flex-wrap items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs hover:shadow-2xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="تصحيح نحوي وإملائي"
                    >
                      {isCheckingGrammar ? (
                        <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin" />
                      ) : (
                        <SpellCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      )}
                      <span className="hidden sm:inline">تدقيق إملائي</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTranslate}
                      className="p-3 sm:px-3 sm:py-1.5 min-h-[44px] sm:min-h-0 text-3xs sm:text-2xs font-extrabold bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex flex-wrap items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs hover:shadow-2xs shrink-0"
                      title="الترجمة الفورية الآن بدون انتظار"
                    >
                      <Zap className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-yellow-300 animate-pulse" />
                      <span className="hidden sm:inline">ترجمة سريعة ⚡</span>
                    </button>
                    <button
                      onClick={() => setInputText("")}
                      className="p-3 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer shrink-0"
                      title="مسح النص"
                    >
                      <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              {voiceSupported && (
                <button
                  type="button"
                  onClick={handleListenSpeech}
                  className={`p-3 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg text-xs font-bold gap-1 transition-all cursor-pointer ${
                    isListening
                      ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-3 sm:px-2 animate-pulse"
                      : "text-sky-500 hover:text-sky-750 hover:bg-sky-50 dark:hover:bg-sky-950/60"
                  }`}
                  title={
                    isListening
                      ? "جاري الاستماع... اضغط للإيقاف"
                      : "تحدث لإدخال نص"
                  }
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 sm:w-4 sm:h-4 animate-bounce" />
                  ) : (
                    <Mic className="w-5 h-5 sm:w-4 sm:h-4" />
                  )}
                  {isListening && (
                    <span className="hidden sm:inline">استماع...</span>
                  )}
                </button>
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex-1 flex flex-col relative"
          >
            <textarea
              id="text-input-box"
              spellCheck={false}
              value={inputText}
              onFocus={handleInputFocusMode}
              onKeyDown={handleInputFocusMode}
              onChange={(e) => {
                if (e.target.value.length <= 10000) {
                  setInputText(e.target.value);
                  setGrammarResult(null); // hide grammar result on change
                  handleInputFocusMode();
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={(e) => {
                const isFromOutput =
                  e.dataTransfer.getData("application/x-translator-output") ===
                  "true";
                if (isFromOutput) {
                  e.preventDefault();
                  handleSwapLanguages();
                }
              }}
              placeholder={getDynamicPlaceholder(tone)}
              dir="auto"
              className="w-full flex-1 p-5 resize-none border-0 text-sky-950 dark:text-sky-100 placeholder-sky-300/60 dark:placeholder-sky-700/60 bg-transparent focus:ring-0 focus:outline-none min-h-[200px] leading-relaxed text-base touch-pan-y overscroll-contain"
            />

            {/* Grammar Check Result Panel */}
            <AnimatePresence>
              {grammarResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-4 overflow-hidden"
                >
                  <div className="bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/60 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                        <Wand2 className="w-4 h-4" />
                        <span>اقتراحات التدقيق اللغوي</span>
                      </div>
                      <button
                        onClick={() => setGrammarResult(null)}
                        className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {grammarResult.correctedText !== inputText ? (
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800 p-4 rounded-xl text-sm text-sky-950 dark:text-sky-100 leading-relaxed text-right relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-1 h-full bg-indigo-400 dark:bg-indigo-500 rounded-r-xl"></div>
                          {grammarResult.correctedText}
                        </div>

                        {grammarResult.changes &&
                          grammarResult.changes.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-black text-indigo-500 dark:text-indigo-400">
                                التصحيحات المقترحة:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
                                {grammarResult.changes.map((change, i) => (
                                  <div
                                    key={i}
                                    className="flex flex-col bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg border border-indigo-50 dark:border-indigo-900/40 text-xs"
                                  >
                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                      <span className="text-emerald-500 font-bold">
                                        {change.suggestion}
                                      </span>
                                      <span className="text-slate-400">←</span>
                                      <span className="line-through text-red-500 font-medium">
                                        {change.error}
                                      </span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1.5">
                                      {change.reason}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-indigo-100 dark:border-indigo-800/50">
                          <button
                            onClick={() => {
                              setInputText(grammarResult.correctedText);
                              setGrammarResult(null);
                            }}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 min-h-[44px] sm:min-h-0 sm:px-3 sm:py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Check className="w-4 h-4" />
                            تطبيق النص المصحح
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold text-right flex items-center justify-start gap-2 flex-row-reverse bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
                        <Check className="w-4 h-4 ml-1" />
                        النص سليم ولا يحتاج لتعديلات!
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Dynamic Character Count Tracker Bar and Indicators */}
          <div className="relative">
            {/* Visual Micro Progress Bar */}
            <div className="absolute top-0 right-0 left-0 h-[2px] bg-sky-100/50 dark:bg-sky-950/30">
              <div
                className="h-full bg-gradient-to-l from-sky-400 to-blue-500 transition-all duration-150"
                style={{
                  width: `${Math.min(100, (inputText.length / 10000) * 100)}%`,
                }}
              />
            </div>

            <div className="px-5 py-3 bg-sky-50/10 dark:bg-[#10192C]/10 border-t border-sky-50 dark:border-sky-950/40 flex items-center justify-between text-right">
              <span className="text-[10px] text-sky-400 dark:text-sky-500 font-black">
                {inputText.length > 0 && "دقة البث متطابقة"}
              </span>
              <span
                className={`text-2xs font-extrabold flex items-center gap-1 transition-colors ${
                  inputText.length > 9000
                    ? "text-rose-500"
                    : inputText.length > 5000
                      ? "text-yellow-500"
                      : "text-sky-600 dark:text-sky-400"
                }`}
              >
                <span>{inputText.length.toLocaleString()}</span>
                <span className="text-sky-300 dark:text-sky-700">/</span>
                <span className="text-sky-400/70 dark:text-sky-600/75">
                  10,000 حرف
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Output Box Column */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[300px]">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-[#FAFAFA]/50 dark:bg-slate-800/20 flex items-center justify-between">
            <span className="text-xs font-black text-sky-600 dark:text-sky-400">
              الترجمة الفورية
            </span>

            <div className="flex items-center gap-1.5 min-h-[36px]">
              <AnimatePresence mode="popLayout">
                {translatedText && (
                  <motion.div
                    key="output-actions"
                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="flex items-center gap-1 bg-sky-50 dark:bg-sky-950/40 rounded-lg pr-2">
                      {targetVoices.length > 0 && (
                        <>
                          <select
                            value={selectedVoiceURI || ""}
                            onChange={(e) =>
                              setSelectedVoiceURI(e.target.value)
                            }
                            className="text-[10px] sm:text-xs bg-transparent text-sky-700 dark:text-sky-300 border-none outline-none max-w-[100px] sm:max-w-[130px] font-bold cursor-pointer rounded-lg truncate appearance-none"
                            title="تغيير اللهجة أو الصوت"
                          >
                            {targetVoices.map((v) => (
                              <option
                                key={v.voiceURI}
                                value={v.voiceURI}
                                className="dark:bg-slate-800"
                              >
                                {v.name}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-sky-200 dark:border-sky-800/60 h-6">
                            <span
                              title="سرعة النطق"
                              className="text-3xs font-bold text-sky-600 dark:text-sky-400 select-none min-w-[24px] text-center"
                            >
                              {speechRate}x
                            </span>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.25"
                              value={speechRate}
                              onChange={(e) =>
                                setSpeechRate(parseFloat(e.target.value))
                              }
                              className="w-16 h-1 bg-sky-200 dark:bg-sky-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                              title="تعديل سرعة النطق"
                            />
                          </div>
                        </>
                      )}
                      <button
                        onClick={handleSpeakOutput}
                        className={`p-3 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg border border-transparent transition-all hover:bg-sky-100/50 dark:hover:bg-[#13223D] cursor-pointer ${
                          isPlaying
                            ? "text-sky-600 dark:text-sky-400 px-3 sm:px-2 animate-pulse"
                            : "text-sky-500"
                        }`}
                        title={isPlaying ? "إيقاف الصوت" : "استمع للترجمة"}
                      >
                        {isPlaying ? (
                          <VolumeX className="w-5 h-5 sm:w-4 sm:h-4" />
                        ) : (
                          <Volume2 className="w-5 h-5 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-3 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-sky-500 hover:text-sky-700 hover:bg-sky-100/50 dark:hover:bg-[#13223D] rounded-lg border border-transparent transition-all cursor-pointer"
                      title="نسخ الترجمة"
                    >
                      {isCopied ? (
                        <Check className="w-5 h-5 sm:w-4 sm:h-4 text-sky-500" />
                      ) : (
                        <Copy className="w-5 h-5 sm:w-4 sm:h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="p-3 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-sky-500 hover:text-sky-700 hover:bg-sky-100/50 dark:hover:bg-[#13223D] rounded-lg border border-transparent transition-all cursor-pointer"
                      title="تنزيل الترجمة كملف نصي (TXT)"
                    >
                      <Download className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="p-3 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-sky-500 hover:text-sky-700 hover:bg-sky-100/50 dark:hover:bg-[#13223D] rounded-lg border border-transparent transition-all cursor-pointer"
                      title="تصدير كملف PDF"
                    >
                      <Printer className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={handleExportImageCanvas}
                      className="p-3 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-sky-500 hover:text-sky-700 hover:bg-sky-100/50 dark:hover:bg-[#13223D] rounded-lg border border-transparent transition-all cursor-pointer"
                      title="تصدير كصورة"
                    >
                      <Camera className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 p-5 relative min-h-[200px] leading-relaxed text-right overflow-hidden">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#030A16]/85 backdrop-blur-3xs"
                >
                  <RefreshCw className="w-6 h-6 text-sky-500 dark:text-sky-400 animate-spin" />
                  <p className="text-xs text-sky-600 dark:text-sky-400 mt-2 font-bold animate-pulse-subtle">
                    جاري معالجة الترجمة بالذكاء الاصطناعي...
                  </p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="p-1"
                >
                  <TranslationError error={error} onRetry={handleTranslate} />
                </motion.div>
              ) : translatedText ? (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-4 relative"
                >
                  <div
                    dir="auto"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", translatedText);
                      e.dataTransfer.setData(
                        "application/x-translator-output",
                        "true",
                      );
                    }}
                    onDoubleClick={handleDoubleClickText}
                    className="text-sky-950 dark:text-sky-100 font-bold whitespace-pre-wrap leading-relaxed select-text cursor-auto rounded-lg transition-colors inline-block min-w-full"
                    title="اسحب النص وأسقطه في خانة الإدخال لعكس الترجمة، أو مرر فوق الكلمات لترجمتها"
                  >
                    {renderInteractiveTranslatedText()}
                  </div>

                  {/* Dictionary Popup Overlay */}
                  <AnimatePresence>
                    {dictPopup && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="dict-popup-container fixed z-50 p-4 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 shadow-xl rounded-2xl w-64 md:w-80"
                        style={{
                          left: Math.max(10, dictPopup.x - 160),
                          top: Math.max(10, dictPopup.y - 120),
                        }}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <BookA className="w-4 h-4 text-sky-500" />
                            <span className="font-bold text-sky-900 dark:text-sky-100 text-sm">
                              قاموس فوري
                            </span>
                          </div>
                          <button
                            onClick={() => setDictPopup(null)}
                            className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                        <div className="mb-1 text-center">
                          <span className="text-lg font-black text-sky-600 dark:text-sky-400">
                            {dictPopup.word}
                          </span>
                        </div>
                        {dictPopup.loading ? (
                          <div className="flex flex-col items-center py-4">
                            <RefreshCw className="w-5 h-5 text-sky-400 animate-spin mb-2" />
                            <span className="text-xs text-sky-500">
                              جاري استخراج المعنى...
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2 text-right">
                            {dictPopup.definition && (
                              <div>
                                <span className="text-3xs font-black text-slate-400 dark:text-slate-500 block mb-0.5">
                                  المعنى العام
                                </span>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {dictPopup.definition}
                                </p>
                              </div>
                            )}
                            {dictPopup.contextualMeaning && (
                              <div className="bg-sky-50 dark:bg-sky-900/30 p-2 rounded-lg mt-2">
                                <span className="text-3xs font-black text-sky-500 block mb-0.5">
                                  في هذا السياق
                                </span>
                                <p className="text-xs font-bold text-sky-900 dark:text-sky-100">
                                  {dictPopup.contextualMeaning}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pronunciation block */}
                  {pronunciation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.22 }}
                      className="flex items-start gap-2 p-3 rounded-xl bg-sky-50/50 dark:bg-[#10192C]/60 border border-sky-100/50 dark:border-sky-950/65 text-xs shadow-3xs"
                    >
                      <BookOpen className="w-4 h-4 text-sky-500 shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-right w-full">
                        <span className="font-black text-sky-600 dark:text-sky-305 block mb-0.5 text-3xs">
                          دليل القراءة والنطق:
                        </span>
                        <span className="text-sky-950 dark:text-sky-101 italic select-text">
                          {pronunciation}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="h-full flex items-center justify-center text-center p-6 text-sky-400/80"
                >
                  <p className="text-xs font-black leading-relaxed">
                    أدخل نصاً في المربع الأيمن وسيتم ترجمته فوراً بدقة عالية إلى
                    اللغة المطلوبة.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tone Selector Footer widget */}
          <div className="p-3 bg-sky-50/30 dark:bg-[#10192C]/40 border-t border-sky-100 dark:border-sky-950/40 flex flex-wrap items-center gap-1.5 justify-between">
            <span className="text-3xs font-black text-sky-850 dark:text-sky-300 select-none">
              النبرة النشطة:
            </span>
            <div className="flex items-center gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`text-2xs px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    tone === t.id
                      ? "bg-sky-500 text-white border-transparent font-black shadow-3xs scale-102"
                      : "bg-white dark:bg-[#070F1E] text-sky-600 dark:text-sky-300 border-sky-150 dark:border-sky-900/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 font-bold"
                  }`}
                  title={getToneDescription(t.id)}
                >
                  {t.id === "standard" && <Sparkles className="w-3.5 h-3.5" />}
                  {t.id === "formal" && <Briefcase className="w-3.5 h-3.5" />}
                  {t.id === "casual" && <Smile className="w-3.5 h-3.5" />}
                  {t.id === "poetic" && <Feather className="w-3.5 h-3.5" />}
                  <span>{t.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-700 ${isFocusMode && isTyping ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"}`}
      >
        {/* 3. Contextual Alternatives */}
        <AnimatePresence mode="popLayout">
          {alternatives.length > 0 && (
            <motion.div
              layout
              variants={alternativesContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="rounded-2xl border border-sky-100 dark:border-sky-950/60 bg-sky-50/20 dark:bg-[#10192C]/40 shadow-3xs overflow-hidden"
            >
              {/* Clickable Header for Collapsible list */}
              <button
                type="button"
                onClick={() =>
                  setIsAlternativesExpanded(!isAlternativesExpanded)
                }
                className="w-full flex items-center justify-between p-4 bg-transparent outline-none cursor-pointer select-none active:bg-sky-500/5 transition-all text-right"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={`w-4 h-4 text-sky-550 dark:text-sky-405 transition-transform duration-300 ${isAlternativesExpanded ? "rotate-180" : ""}`}
                  />
                  <span className="text-[10px] font-mono font-black text-sky-500 dark:text-sky-450 bg-sky-500/10 dark:bg-sky-950/45 border border-sky-100/20 dark:border-sky-900/30 px-2 py-0.5 rounded-lg leading-none">
                    {alternatives.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-500 dark:text-sky-450 animate-pulse" />
                  <span className="text-xs font-black text-sky-950 dark:text-sky-200">
                    صياغات وتعبيرات بديلة مقترحة (اضغط للاستخدام فوراً)
                  </span>
                </div>
              </button>

              {/* Collapsible Content wrapper */}
              <AnimatePresence initial={false}>
                {isAlternativesExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="border-t border-sky-100/40 dark:border-sky-950/40 overflow-hidden"
                  >
                    <div className="p-4 pt-1 space-y-2 text-right">
                      <p className="text-[10px] font-bold text-sky-750/75 dark:text-sky-350/75 mb-3 select-none leading-relaxed">
                        هنا تجد خيارات بديلة بتركيب لغوي موازٍ. حدد إحداها
                        لاستبدال الترجمة الحالية أو تحريك النص:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {alternatives.map((alt, idx) => (
                          <motion.div
                            layout
                            key={alt}
                            variants={altItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative group block w-full text-right"
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectAlternative(alt)}
                              className="w-full text-right p-3.5 pl-10 rounded-xl bg-white dark:bg-[#070F1E] hover:bg-sky-500/[0.02] dark:hover:bg-sky-500/[0.02] border border-sky-150/70 dark:border-sky-900/40 hover:border-sky-400 dark:hover:border-sky-550 text-xs text-sky-950 dark:text-sky-200 font-bold cursor-pointer transition-all shadow-3xs relative overflow-hidden"
                              title="اضغط لاستبدال الترجمة الحالية بهذا البديل"
                            >
                              <span className="absolute left-3 top-3.5 px-1.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[9px] font-black text-sky-650 dark:text-sky-450 border border-sky-100/50 dark:border-sky-900/20 group-hover:bg-sky-500 group-hover:text-white group-hover:border-transparent transition-all">
                                بديل #{idx + 1}
                              </span>
                              <div className="whitespace-pre-wrap leading-relaxed pr-1 select-text">
                                {alt}
                              </div>
                            </button>

                            {/* Rich interactive explanation tooltip bar on hover to save UI space */}
                            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-250 absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-900/95 dark:bg-slate-950 border border-slate-800 text-[10px] text-sky-200 py-1 px-2.5 rounded-lg max-w-[240px] text-center shadow-lg z-35 whitespace-nowrap">
                              ⚡ اضغط للاستخدام كترجمة أساسية
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TranslationHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        refreshTrigger={historyRefreshTrigger}
        onSelect={(item) => {
          setInputText(item.sourceText);
          setTranslatedText(item.translatedText);
          setSourceLang(item.sourceLang);
          setTargetLang(item.targetLang);
          setTone(item.tone);
          // Optional: clear alternatives/pronunciation since it's from history
          setAlternatives([]);
          setPronunciation(null);
        }}
      />
    </div>
  );
};
