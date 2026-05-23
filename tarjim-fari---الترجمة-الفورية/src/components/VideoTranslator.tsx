import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Video, Music, Upload, RefreshCw, Send, Check, PlayCircle, 
  HelpCircle, Sparkles, FileText, ChevronRight, ListMusic, Gauge, Sliders,
  Volume2, Cpu, Globe, Type, Palette, SlidersHorizontal, Eye, EyeOff,
  Maximize, Minimize, X, Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SubtitleItem, LANGUAGES } from "../types";
import { TranslationError } from "./TranslationError";
import { fetchWithProgress } from "../utils/upload";

interface VideoTranslatorProps {
  theme: "light" | "dark";
}

// Convert time string (e.g., "0:02" or "1:14") to seconds
const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) {
    // mm:ss or m:ss
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

export const VideoTranslator: React.FC<VideoTranslatorProps> = () => {
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subFontSize, setSubFontSize] = useState("text-sm"); // text-xs, text-sm, text-base, text-lg, text-xl
  const [subTextColor, setSubTextColor] = useState("text-white"); // text-slate-100, text-yellow-300, etc.
  const [subBgStyle, setSubBgStyle] = useState("rounded-2xl"); // rounded-2xl, rounded-full, rounded-none, border shadow
  const [subBgColor, setSubBgColor] = useState("bg-slate-950"); // bg-slate-950, bg-black, bg-zinc-900, bg-sky-950, etc.
  const [subBgOpacity, setSubBgOpacity] = useState("bg-opacity-85"); // bg-opacity-0 to bg-opacity-100
  const [subBilingual, setSubBilingual] = useState(false); // dual translation & English highlight
  const [bilingualLayout, setBilingualLayout] = useState("stacked"); // stacked, side-by-side
  const [subOrigTextColor, setSubOrigTextColor] = useState("text-slate-400"); // text-slate-400, text-sky-400, text-yellow-300, etc.
  const [subOrigFontSize, setSubOrigFontSize] = useState("text-xs"); // text-2xs, text-xs, text-sm, text-base
  const [showFsSettings, setShowFsSettings] = useState(false); // overlay configuration panel (accessible in fullscreen)
  
  const [videoLoadingStage, setVideoLoadingStage] = useState(0); // 0 = Buffering / Uploading, 1 = Dictation/Transcription, 2 = Translation/Subtitling
  const [videoSimulatedProgress, setVideoSimulatedProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [playbackQuality, setPlaybackQuality] = useState("auto");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [targetLang, setTargetLang] = useState("ar");
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronization settings
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSubtitle, setActiveSubtitle] = useState<SubtitleItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLMediaElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Presets
  const MEDIA_PRESETS = [
    {
      name: "تسجيل صوتي تعليمي (English)",
      type: "audio",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      name: "عرض الطبيعة التقني (HD MP4)",
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
    }
  ];

  // Convert time string formatting back
  const selectPreset = (url: string, type: "audio" | "video") => {
    setMediaPreview(url);
    setMediaFile(null); // indicating preloaded
    setYoutubeUrl("");
    setSubtitles([]);
    setError(null);
    setCurrentTime(0);
  };

  const selectYoutube = () => {
    if (!youtubeUrl.trim()) return;
    setMediaPreview(null);
    setMediaFile(null);
    setSubtitles([]);
    setError(null);
    
    // Simulate YouTube video playback & load subtitles via research grounding with rich stages
    setIsLoading(true);
    setVideoLoadingStage(0);
    setVideoSimulatedProgress(5);

    let prog = 5;
    const progressInterval = setInterval(() => {
      prog += Math.floor(Math.random() * 8) + 5;
      if (prog > 96) prog = 96;
      setVideoSimulatedProgress(prog);

      if (prog < 30) {
        setVideoLoadingStage(0);
      } else if (prog < 70) {
        setVideoLoadingStage(1);
      } else {
        setVideoLoadingStage(2);
      }
    }, 110);

    setTimeout(() => {
      clearInterval(progressInterval);
      setVideoSimulatedProgress(100);
      setVideoLoadingStage(2);

      // Mock translated transcript from the video
      setTimeout(() => {
        setSubtitles([
          {
            startTime: "0:00",
            endTime: "0:04",
            original: "Hello! In this tech video tutorial, we are exploring Gemini API integrations.",
            translated: "مرحباً! في هذا الفيديو التعليمي التقني، نستكشف تكاملات واجهة برمجة تطبيقات Gemini."
          },
          {
            startTime: "0:05",
            endTime: "0:09",
            original: "We'll build a live subtitles pipeline from scratch with multi-modal capabilities.",
            translated: "سنقوم بإنشاء خط متكامل من الترجمة المباشرة من الصفر باستخدام قدرات متعددة النماذج."
          },
          {
            startTime: "0:10",
            endTime: "0:15",
            original: "Make sure you use server side proxies to guard your credentials safely.",
            translated: "تأكد من استخدام خوادم بروكسي من جهة الخادم لحماية بيانات اعتمادك بشكل آمن."
          }
        ]);
        setIsLoading(false);
      }, 100);
    }, 1800);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setYoutubeUrl("");
      setSubtitles([]);
      setError(null);
      setCurrentTime(0);

      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const handleTranslateMedia = async () => {
    if (!mediaPreview) return;

    setIsLoading(true);
    setError(null);
    setVideoLoadingStage(0);
    setVideoSimulatedProgress(4);

    let prog = 4;
    const progressInterval = setInterval(() => {
      if (prog >= 90) return; // Wait at 90%
      prog += Math.floor(Math.random() * 3) + 1;
      if (prog > 96) prog = 96;
      setVideoSimulatedProgress(prog);

      if (prog < 50) {
        setVideoLoadingStage(0);
      } else if (prog < 80) {
        setVideoLoadingStage(1);
      } else {
        setVideoLoadingStage(2);
      }
    }, 280);

    // ... unchanged code for converting to base64 ...
    let mediaData = "";
    if (mediaFile) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(mediaFile);
        });
        mediaData = await base64Promise;
      } catch (e) {
        clearInterval(progressInterval);
        setError("فشل تجهيز وقراءة ملف الوسائط.");
        setIsLoading(false);
        return;
      }
    } else {
      mediaData = "dummy_base64_preset_media";
    }

    try {
      const data = await fetchWithProgress("/api/translate-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaData,
          mimeType: mediaFile?.type || "audio/mp3",
          targetLang,
        }),
        onUploadProgress: (e, percentage) => {
          const mappedProg = Math.floor(4 + (percentage / 100) * 46); // Map to 4-50%
          if (mappedProg > prog) {
            prog = mappedProg;
            setVideoSimulatedProgress(prog);
            if (prog < 50) setVideoLoadingStage(0);
            else if (prog < 80) setVideoLoadingStage(1);
            else setVideoLoadingStage(2);
          }
        }
      });

      clearInterval(progressInterval);
      setVideoSimulatedProgress(100);
      setVideoLoadingStage(2);

      setTimeout(() => {
        setSubtitles(data.subtitles || []);
        setIsLoading(false);
      }, 150);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع أثناء معالجة الملف.");
      setIsLoading(false);
    }
  };

  // Synchronize subtitles with playback
  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      const time = mediaRef.current.currentTime;
      setCurrentTime(time);

      // Search matching subtitle element
      const matched = subtitles.find((sub) => {
        const start = timeToSeconds(sub.startTime);
        const end = timeToSeconds(sub.endTime);
        return time >= start && time <= end;
      });

      setActiveSubtitle(matched || null);
    }
  };

  // Click subtitle line to skip timeline playhead
  const handleSubtitleClick = (sub: SubtitleItem) => {
    if (mediaRef.current) {
      const seconds = timeToSeconds(sub.startTime);
      mediaRef.current.currentTime = seconds;
      mediaRef.current.play();
    }
  };

  // Auto trigger translation when media loads
  useEffect(() => {
    if (mediaPreview) {
      handleTranslateMedia();
    }
  }, [mediaPreview, targetLang]);

  // Sync playback rate on change
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, mediaPreview]);

  // Fullscreen management and listener
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          console.error("Error transitioning to fullscreen:", err);
        });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
    };
  }, []);

  const isVideo = mediaFile?.type.startsWith("video/") || mediaPreview?.includes(".mp4");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Target Language selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-l from-sky-50/50 to-white dark:from-[#10192C] dark:to-[#070F1E] border border-sky-100 dark:border-sky-900/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-xl">
            <Volume2 className="w-5 h-5 text-sky-500 animate-pulse" />
          </div>
          <h3 className="text-sm font-black text-sky-950 dark:text-sky-100 tracking-wide">
            ترجمة الصوتيات (MP3) والمرئيات تلقائياً إلى:
          </h3>
        </div>
        <select
          id="video-target-lang"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="w-full sm:w-64 bg-white dark:bg-[#070F1E] py-2.5 px-4 rounded-xl border border-sky-150 dark:border-sky-900/60 text-sky-950 dark:text-sky-200 font-bold focus:ring-2 focus:ring-sky-500/20 focus:outline-sky-500 cursor-pointer"
        >
          {LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
            <option key={l.code} value={l.code} className="dark:bg-[#070F1E] dark:text-sky-200">
              {l.flag} {l.nativeName} ({l.name})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <TranslationError error={error} onRetry={mediaPreview ? handleTranslateMedia : undefined} />
      )}

      {/* Inputs panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Audio / Video file */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#030A16] border-[1.5px] border-dashed border-sky-200 dark:border-sky-900/60 flex flex-col items-center justify-center text-center space-y-4 shadow-sm hover:border-sky-400 dark:hover:border-sky-500 transition-all group">
          <div className="p-3 bg-sky-50/80 dark:bg-sky-900/30 text-sky-500 rounded-xl group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.2)] transition-all">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-sky-950 dark:text-sky-100 uppercase tracking-wide">
              ترجمة ملف صوتي (MP3 / WAV) أو فيديو
            </h4>
            <p className="text-xs text-[#4E696E] dark:text-sky-400/80 pointer-events-none mt-1.5 font-semibold">
              انقر لرفع ملف استماع أو مشاهدة
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 text-xs font-black tracking-wide rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white transition-all cursor-pointer shadow-md shadow-sky-500/20"
          >
            اختر ملف 
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            accept="audio/*,video/*"
            className="hidden"
          />
        </div>

        {/* YouTube or URL input link */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#030A16] border border-sky-150 dark:border-sky-950/60 flex flex-col justify-center space-y-3.5 shadow-3xs hover:border-sky-400 transition-all text-right">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-sky-100/60 dark:bg-sky-950/40 text-sky-500 dark:text-sky-305 rounded-xl">
              <Video className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-sky-950 dark:text-sky-100">قم بوضع رابط فيديو YouTube</h4>
              <p className="text-3xs text-[#4E696E] dark:text-sky-300 font-semibold">استوديو ذكي لنسخ وترجمة روابط الويب والفيديوهات</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1 bg-white dark:bg-[#070F1E] border border-sky-150 dark:border-sky-900/60 py-2.5 px-3 rounded-xl text-xs text-sky-950 dark:text-sky-200 placeholder-sky-305 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={selectYoutube}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs"
            >
              <Send className="w-4.5 h-4.5" />
              أرسل
            </button>
          </div>

          {/* Quick presets list */}
          <div className="pt-1.5 flex flex-wrap items-center gap-1.5 justify-start">
            <span className="text-3xs text-sky-850 dark:text-sky-300 font-bold select-none">ملفات ديمو:</span>
            {MEDIA_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => selectPreset(p.url, p.type as any)}
                className="text-3xs px-2.5 py-1 rounded-md bg-sky-50/50 dark:bg-[#070F1E] text-sky-600 dark:text-sky-300 hover:bg-sky-100/50 dark:hover:bg-[#13223D] border border-sky-150 dark:border-sky-900/60 transition-all cursor-pointer font-bold"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Player + Synchronized flow */}
      {mediaPreview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Player area */}
          <div className="lg:col-span-7 space-y-4">
            <div 
              ref={playerContainerRef}
              className={`relative bg-zinc-950 flex items-center justify-center overflow-hidden transition-all duration-200 z-10 select-none ${
                isFullscreen 
                  ? "w-screen h-screen fixed inset-0 z-50 rounded-none border-none p-0 max-h-screen max-w-none" 
                  : "rounded-[2rem] border border-sky-950/40 min-h-[300px] shadow-lg group"
              }`}
            >
              {/* Immersive overlay fullscreen toggle icon button (top-right corner) */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-40 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-white cursor-pointer active:scale-95 transition-all shadow-md group-hover:opacity-100 md:opacity-0 focus:opacity-100"
                title={isFullscreen ? "الخروج من الشاشة الكاملة (Esc)" : "ملء الشاشة الكاملة"}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              {/* Quick Settings overlay toggle button (top-left corner) */}
              <button
                type="button"
                onClick={() => setShowFsSettings(!showFsSettings)}
                className={`absolute top-4 left-4 z-40 p-2.5 rounded-xl border flex items-center gap-1.8 cursor-pointer active:scale-95 transition-all shadow-md group-hover:opacity-100 focus:opacity-100 ${
                  showFsSettings
                    ? "opacity-100 bg-sky-500 border-sky-400 text-white"
                    : "md:opacity-0 bg-slate-900/80 hover:bg-slate-900 border-white/10 hover:border-white/20 text-white"
                }`}
                title="تخصيص المشغل والترجمة"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-[10px] font-black hidden sm:inline-block">خيارات العرض والترجمة</span>
              </button>
              
              {/* HTML5 video element */}
              {isVideo ? (
                <video
                  ref={mediaRef as any}
                  src={mediaPreview}
                  onTimeUpdate={handleTimeUpdate}
                  controls
                  className={`w-full object-contain block ${isFullscreen ? "h-screen max-h-screen" : "max-h-[400px]"}`}
                />
              ) : (
                /* HTML5 audio element with animated placeholder disk */
                <div className={`p-8 flex flex-col items-center justify-center w-full space-y-6 transition-all ${isFullscreen ? "h-screen" : "min-h-[300px]"}`}>
                  <div className={`relative animate-spin-slow rounded-full border-4 border-sky-500 flex items-center justify-center bg-sky-950 shadow-xl shadow-sky-500/10 transition-all ${
                    isFullscreen ? "w-48 h-48" : "w-32 h-32"
                  }`}>
                    <Music className={`text-sky-400 transition-all ${isFullscreen ? "w-18 h-18" : "w-12 h-12"}`} />
                    <div className="absolute w-4 h-4 rounded-full bg-black border border-sky-500" />
                  </div>
                  
                  <audio
                    ref={mediaRef as any}
                    src={mediaPreview}
                    onTimeUpdate={handleTimeUpdate}
                    controls
                    className="w-full max-w-sm rounded-lg"
                  />
                </div>
              )}

              {/* Float real-time subtitle overlay with client customizable styling settings */}
              {showSubtitles && activeSubtitle && (
                <div className={`absolute bottom-12 sm:bottom-16 inset-x-0 mx-auto max-w-[90%] md:max-w-[80%] px-5 py-3.5 md:py-4.5 transition-all duration-200 shadow-2xl z-20 backdrop-blur-md text-center ${subBgStyle} ${subBgColor} ${subBgOpacity} ${
                  subBgColor === "bg-transparent" || subBgOpacity === "bg-opacity-0" 
                    ? "border-transparent shadow-none backdrop-blur-none" 
                    : "border border-white/10 dark:border-sky-950/40"
                }`}>
                  {subBilingual && bilingualLayout === "side-by-side" ? (
                    /* Side-by-Side Bilingual Layout */
                    <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-5 divide-y md:divide-y-0 md:divide-x md:divide-white/15 rtl:md:divide-x-reverse text-right">
                      <div className="flex-1 text-center md:text-right md:px-3 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-sky-400 self-center md:self-start opacity-80 mb-1">
                          النص الأصلي / Original
                        </span>
                        <p className={`font-mono font-extrabold tracking-wide leading-relaxed transition-all ${subOrigFontSize} ${subOrigTextColor}`}>
                          {activeSubtitle.original}
                        </p>
                      </div>
                      <div className="flex-1 text-center md:text-right pt-3 md:pt-0 md:px-3 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-emerald-400 self-center md:self-start opacity-80 mb-1">
                          الترجمة / Translation
                        </span>
                        <p className={`font-black font-sans leading-relaxed tracking-wide [text-shadow:_0_1.5px_3px_rgba(0,0,0,0.85)] transition-all ${subFontSize} ${subTextColor}`}>
                          {activeSubtitle.translated}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Stacked Bilingual (or Standard Single Language) Layout */
                    <div className="space-y-2">
                      {subBilingual && (
                        <p className={`font-mono font-bold tracking-wide max-w-xl mx-auto leading-relaxed border-b border-white/5 pb-1.5 transition-all ${subOrigFontSize} ${subOrigTextColor}`}>
                          {activeSubtitle.original}
                        </p>
                      )}
                      <p className={`font-black font-sans leading-relaxed text-center tracking-wide [text-shadow:_0_2px_4px_rgba(0,0,0,0.9)] transition-all ${subFontSize} ${subTextColor}`}>
                        {activeSubtitle.translated}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Loading Overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-[#020813]/92 backdrop-blur-sm z-30 p-4 sm:p-6"
                  >
                    {/* Sweep Beam indicator */}
                    <motion.div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent z-10 opacity-80 shadow-[0_0_15px_#0EA5E9]"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                    />

                    {/* Progress Card Container */}
                    <motion.div 
                      initial={{ scale: 0.94, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.94, y: 20 }}
                      transition={{ type: "spring", stiffness: 190, damping: 22 }}
                      className="w-full max-w-sm bg-slate-900/95 border border-slate-850 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-right backdrop-blur-md"
                    >
                      {/* Title information */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="text-[10px] font-mono font-black text-sky-400 uppercase tracking-widest bg-sky-950/40 border border-sky-900/40 px-2 py-0.5 rounded-md">
                          AI MEDIA ENGINE
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                          <span>جاري معالجة الصوت والترجمة</span>
                          <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                        </h4>
                      </div>

                      {/* 3 Connected Stages */}
                      <div className="relative flex flex-col gap-4">
                        {/* Vertical line connector */}
                        <div className="absolute top-3.5 bottom-3.5 right-[22px] w-[2px] bg-slate-800" />
                        
                        {/* Active completed line */}
                        <motion.div 
                          className="absolute top-3.5 right-[22px] w-[2px] bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                          initial={{ height: 0 }}
                          animate={{ 
                            height: videoLoadingStage === 0 
                              ? "0%" 
                              : videoLoadingStage === 1 
                              ? "50%" 
                              : "100%" 
                          }}
                          transition={{ duration: 0.3 }}
                        />

                        {[
                          { id: 0, title: "تحميل وبث الموقع والمحتوى", desc: "تهيئة الاتصال وتحليل الترددات الأساسية لملف الوسائط", icon: Volume2 },
                          { id: 1, title: "تحليل الحوار والنسخ الصوتي والـ OCR", desc: "استخراج نبرات المتحدثين وتحويلها لنصوص متصلة فورية", icon: Cpu },
                          { id: 2, title: "المواءمة اللغوية وتوليد الترجمة", desc: "حساب الطوابع الزمنية ومطابقة الترجمات بدقة ومزامنة النطق", icon: Globe }
                        ].map((st) => {
                          const isCompleted = videoLoadingStage > st.id;
                          const isActive = videoLoadingStage === st.id;
                          const isIncoming = videoLoadingStage < st.id;
                          
                          const Icon = st.icon;

                          return (
                            <motion.div 
                              key={st.id}
                              initial={false}
                              animate={{ opacity: isIncoming ? 0.45 : 1 }}
                              className={`flex items-start gap-3 relative z-10 transition-all duration-300 ${isActive ? "scale-[1.01]" : ""}`}
                            >
                              {/* Step text detail */}
                              <div className="flex-1 text-right pr-2">
                                <h5 className={`text-[11px] font-black transition-colors ${isActive ? "text-sky-400" : isCompleted ? "text-slate-200" : "text-slate-500"}`}>
                                  {st.title}
                                </h5>
                                <p className={`text-[10px] leading-relaxed mt-0.5 transition-colors ${isActive ? "text-sky-200/80" : "text-slate-500"}`}>
                                  {st.desc}
                                </p>
                              </div>

                              {/* Step circle indicator status */}
                              <div className="relative shrink-0 select-none">
                                {isActive && (
                                  <motion.div 
                                    className="absolute -inset-1.5 rounded-full bg-sky-500/20 border border-sky-400/30"
                                    animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                  />
                                )}
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                                  isCompleted 
                                    ? "bg-sky-500/15 border-sky-500 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.15)]" 
                                    : isActive 
                                    ? "bg-slate-900 border-sky-400 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]" 
                                    : "bg-slate-950 border-slate-850 text-slate-700"
                                }`}>
                                  {isCompleted ? (
                                    <Check className="w-5 h-5 font-black stroke-[3px]" />
                                  ) : isActive ? (
                                    <Icon className="w-4.5 h-4.5 animate-pulse" />
                                  ) : (
                                    <Icon className="w-4.5 h-4.5 opacity-40" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Cumulative Total Progress Bar */}
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-2xs font-bold text-slate-400 select-none">
                          <span className="font-mono text-sky-400 font-extrabold text-xs">{videoSimulatedProgress}%</span>
                          <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">التقدم الإجمالي للملف</span>
                        </div>
                        
                        <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-850 shadow-inner">
                          <motion.div 
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 shadow-[0_0_10px_#38bdf8]"
                            initial={{ width: 0 }}
                            animate={{ width: `${videoSimulatedProgress}%` }}
                            transition={{ ease: "easeOut", duration: 0.15 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fullscreen & Overlay Interactive Customization Drawer */}
              <AnimatePresence>
                {showFsSettings && (
                  <motion.div
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    transition={{ type: "spring", damping: 26, stiffness: 220 }}
                    className="absolute top-0 right-0 h-full w-[310px] sm:w-[350px] bg-slate-950/95 border-l border-white/10 shadow-2xl z-40 flex flex-col backdrop-blur-xl text-right overflow-hidden select-text"
                  >
                    {/* Drawer Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
                      <button
                        type="button"
                        onClick={() => setShowFsSettings(false)}
                        className="p-1 px-2 text-2xs font-black rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                        title="إغلاق التخصيص"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>إغلاق</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-black text-sky-400 bg-sky-950/60 border border-sky-900/40 px-2 py-0.5 rounded leading-none uppercase">
                          CUSTOMIZE
                        </span>
                        <h4 className="text-xs font-black text-white">خيارات العرض والترجمة</h4>
                      </div>
                    </div>

                    {/* Scrollable controls content */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-5 scrollbar-thin text-xs text-white">
                      
                      {/* Playback Settings Group */}
                      <div className="space-y-3 pb-4 border-b border-white/10">
                        <h5 className="text-[10px] font-black text-sky-400 uppercase tracking-wider border-r-2 border-sky-500 pr-1.5 leading-none">
                          خيارات تشغيل الوسائط
                        </h5>

                        {/* Speed Controls */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-300 flex items-center justify-end gap-1 select-none">
                            <span>سرعة تشغيل المقطع:</span>
                            <Gauge className="w-3.5 h-3.5 text-sky-400" />
                          </label>
                          <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                            {[0.5, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => setPlaybackRate(rate)}
                                className={`flex-1 text-[10px] font-black py-1 rounded-lg cursor-pointer transition-all ${
                                  playbackRate === rate
                                    ? "bg-sky-500 text-white shadow-sm"
                                    : "text-slate-350 hover:bg-white/10"
                                }`}
                              >
                                {rate === 1.0 ? "طبيعي" : `${rate}x`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quality Controls */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-300 flex items-center justify-end gap-1 select-none">
                            <span>الدقة والجودة الفنية:</span>
                            <Sliders className="w-3.5 h-3.5 text-sky-400" />
                          </label>
                          <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                            {["auto", "1080p", "720p", "480p"].map((q) => (
                              <button
                                key={q}
                                onClick={() => setPlaybackQuality(q)}
                                className={`flex-1 text-[10px] font-black py-1 rounded-lg cursor-pointer transition-all ${
                                  playbackQuality === q
                                    ? "bg-sky-500 text-white shadow-sm"
                                    : "text-slate-350 hover:bg-white/10"
                                }`}
                              >
                                {q === "auto" ? "تلقائي" : q}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Subtitle Appearance Settings Group */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-sky-400 uppercase tracking-wider border-r-2 border-sky-500 pr-1.5 leading-none">
                          مظهر وتنسيق نصوص الترجمة
                        </h5>

                        {/* Subtitle Visibility */}
                        <div className="flex items-center justify-between gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-white/10">
                            <button
                              onClick={() => setShowSubtitles(true)}
                              className={`text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                                showSubtitles
                                  ? "bg-sky-500 text-white shadow-sm"
                                  : "text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>تفعيل</span>
                            </button>
                            <button
                              onClick={() => setShowSubtitles(false)}
                              className={`text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                                !showSubtitles
                                  ? "bg-slate-500 text-white shadow-sm"
                                  : "text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>إخفاء</span>
                            </button>
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-300">عرض الترجمة:</span>
                        </div>

                        {/* Bilingual Controls */}
                        <div className="space-y-3 bg-sky-500/5 p-3 rounded-xl border border-sky-500/10">
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => setSubBilingual(!subBilingual)}
                              className={`text-[10px] font-black px-3 py-1 rounded-lg border cursor-pointer transition-all ${
                                subBilingual
                                  ? "bg-sky-500 border-sky-450 text-white shadow-sm animate-scale_up"
                                  : "bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              {subBilingual ? "مفعل (نص أصلي + ترجمة)" : "معطل (ترجمة فقط)"}
                            </button>
                            <span className="text-[11px] font-extrabold text-slate-300">الترجمة الثنائية (Bilingual):</span>
                          </div>

                          {subBilingual && (
                            <div className="space-y-3 pt-2.5 border-t border-white/10">
                              {/* Bilingual Layout */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex bg-slate-950 p-0.5 rounded-xl border border-white/10">
                                  {[
                                    { val: "stacked", label: "رأسي متراص" },
                                    { val: "side-by-side", label: "أفقي متجاور" }
                                  ].map((item) => (
                                    <button
                                      key={item.val}
                                      onClick={() => setBilingualLayout(item.val)}
                                      className={`text-[9px] font-black px-2 py-1 rounded-md cursor-pointer transition-all ${
                                        bilingualLayout === item.val
                                          ? "bg-sky-500 text-white"
                                          : "text-slate-400 hover:bg-white/5"
                                      }`}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-300">تخطيط العرض الثنائي:</span>
                              </div>

                              {/* Original Text Size */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex bg-slate-950 p-0.5 rounded-xl border border-white/10">
                                  {[
                                    { val: "text-3xs", label: "صغير جداً" },
                                    { val: "text-2xs", label: "صغير" },
                                    { val: "text-xs", label: "افتراضي" },
                                    { val: "text-sm", label: "كبير" }
                                  ].map((item) => (
                                    <button
                                      key={item.val}
                                      onClick={() => setSubOrigFontSize(item.val)}
                                      className={`text-[9px] font-black px-2 py-1 rounded-md cursor-pointer transition-all ${
                                        subOrigFontSize === item.val
                                          ? "bg-sky-500 text-white"
                                          : "text-slate-400 hover:bg-white/5"
                                      }`}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-300">حجم النص الأصلي:</span>
                              </div>

                              {/* Original Text Color */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                                  {[
                                    { val: "text-slate-100", bgClass: "bg-slate-100", label: "أبيض ناصع" },
                                    { val: "text-slate-400", bgClass: "bg-slate-400", label: "رمادي متوسط" },
                                    { val: "text-yellow-200", bgClass: "bg-yellow-200", label: "أصفر خافت" },
                                    { val: "text-sky-300", bgClass: "bg-sky-300", label: "أزرق ثلجي" },
                                    { val: "text-emerald-300", bgClass: "bg-emerald-300", label: "أخضر ناعم" }
                                  ].map((item) => (
                                    <button
                                      key={item.val}
                                      onClick={() => setSubOrigTextColor(item.val)}
                                      className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-transform ${item.bgClass} ${
                                        subOrigTextColor === item.val ? "border-sky-500 scale-110 shadow-xs" : "border-slate-700 hover:scale-105"
                                      }`}
                                      title={item.label}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-300">لون النص الأصلي:</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Subtitle Font Size */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto">
                            {[
                              { val: "text-xs", label: "صغير" },
                              { val: "text-sm", label: "افتراضي" },
                              { val: "text-base", label: "متوسط" },
                              { val: "text-lg", label: "كبير" },
                              { val: "text-xl", label: "ضخم" }
                            ].map((item) => (
                              <button
                                key={item.val}
                                onClick={() => setSubFontSize(item.val)}
                                className={`text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
                                  subFontSize === item.val
                                    ? "bg-sky-500 text-white shadow-sm"
                                    : "text-slate-300 hover:bg-white/5"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-300 shrink-0">حجم مضلع الخط:</span>
                        </div>

                        {/* Subtitle Text Color */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/5">
                            {[
                              { val: "text-white", bgClass: "bg-white", label: "أبيض" },
                              { val: "text-yellow-300", bgClass: "bg-yellow-300", label: "أصفر مبهج" },
                              { val: "text-sky-300", bgClass: "bg-sky-300", label: "أزرق سماوي" },
                              { val: "text-emerald-300", bgClass: "bg-emerald-300", label: "أخضر فستقي" },
                              { val: "text-rose-300", bgClass: "bg-[#fda4af]", label: "وردي ناعم" }
                            ].map((c) => (
                              <button
                                key={c.val}
                                onClick={() => setSubTextColor(c.val)}
                                className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${c.bgClass} ${
                                  subTextColor === c.val ? "border-sky-500 scale-110 shadow-sm" : "border-slate-700"
                                }`}
                                title={c.label}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-300">لون خط الترجمة:</span>
                        </div>

                        {/* Background Style Edge (Shape) */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                            {[
                              { val: "rounded-2xl", label: "مستدير" },
                              { val: "rounded-full px-5", label: "كبسولة" },
                              { val: "rounded-none", label: "مسطح" },
                              { val: "rounded-3xl border-2 border-sky-500/55 shadow-md", label: "مضيء" }
                            ].map((style) => (
                              <button
                                key={style.val}
                                onClick={() => setSubBgStyle(style.val)}
                                className={`text-[10px] font-black px-2 py-1 rounded-lg cursor-pointer transition-all ${
                                  subBgStyle === style.val
                                    ? "bg-sky-500 text-white shadow-sm"
                                    : "text-slate-300 hover:bg-white/5"
                                }`}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-300">شكل الحواف:</span>
                        </div>

                        {/* Background Color */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/5">
                            {[
                              { val: "bg-slate-950", bgClass: "bg-slate-950", label: "رمادي كوني" },
                              { val: "bg-black", bgClass: "bg-black", label: "أسود خالص" },
                              { val: "bg-zinc-900", bgClass: "bg-zinc-900", label: "معدني داكن" },
                              { val: "bg-sky-950", bgClass: "bg-sky-950", label: "أزرق عميق" },
                              { val: "bg-indigo-950", bgClass: "bg-indigo-950", label: "بنفسجي كحلي" },
                              { val: "bg-rose-950", bgClass: "bg-rose-950", label: "وردي مظلم" },
                              { val: "bg-transparent", bgClass: "bg-white dark:bg-zinc-900", label: "بدون لون" }
                            ].map((c) => (
                              <button
                                key={c.val}
                                onClick={() => setSubBgColor(c.val)}
                                className={`w-4 h-4 rounded-full border cursor-pointer transition-all flex items-center justify-center overflow-hidden relative ${c.bgClass} ${
                                  subBgColor === c.val ? "border-sky-500 scale-110 shadow-sm" : "border-slate-700"
                                }`}
                                title={c.label}
                              >
                                {c.val === "bg-transparent" && (
                                  <span className="absolute inset-0 m-auto w-full h-0.5 bg-rose-500 rotate-45 transform" />
                                )}
                              </button>
                            ))}
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-300">لون الخلفية:</span>
                        </div>

                        {/* Background Opacity */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-1 bg-white/5 p-0.5 rounded-xl border border-white/5">
                            {[
                              { val: "bg-opacity-0", label: "0% (شفاف)" },
                              { val: "bg-opacity-25", label: "25%" },
                              { val: "bg-opacity-45", label: "45%" },
                              { val: "bg-opacity-65", label: "65%" },
                              { val: "bg-opacity-85", label: "85%" },
                              { val: "bg-opacity-100", label: "100%" }
                            ].map((op) => (
                              <button
                                key={op.val}
                                onClick={() => setSubBgOpacity(op.val)}
                                className={`text-[9px] font-black px-1.5 py-1 rounded-md cursor-pointer transition-all ${
                                  subBgOpacity === op.val
                                    ? "bg-sky-500 text-white font-extrabold"
                                    : "text-slate-300 hover:bg-white/5"
                                }`}
                              >
                                {op.label.replace(" (شفاف)", "")}
                              </button>
                            ))}
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-300">درجة التعتيم:</span>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Player Settings Bar */}
            <div className="p-4 bg-white/95 dark:bg-[#070e1a]/95 rounded-2xl border border-sky-150 dark:border-sky-955/65 flex flex-col md:flex-row items-center justify-between gap-4 text-right shadow-xs backdrop-blur-md">
              {/* Immersive Fullscreen Mode */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end order-3 md:order-1">
                <span className="text-[10px] sm:text-xs font-black text-sky-950 dark:text-sky-200">وضع العرض:</span>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`text-[10px] sm:text-xs font-extrabold px-3.5 py-1.8 rounded-xl flex items-center gap-1.5 border cursor-pointer transition-all active:scale-95 ${
                    isFullscreen
                      ? "bg-rose-550 hover:bg-rose-600 text-white border-rose-650 shadow-3xs"
                      : "bg-sky-550 hover:bg-sky-600 text-white border-sky-650 shadow-3xs"
                  }`}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  <span>{isFullscreen ? "مغادرة الشاشة الكاملة" : "ملء الشاشة الكاملة"}</span>
                </button>
              </div>

              {/* Playback Quality settings */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end order-1 md:order-2">
                <span className="text-[10px] sm:text-xs font-black text-sky-950 dark:text-sky-200">الدقة والجودة:</span>
                <div className="flex items-center gap-1 bg-sky-50/50 dark:bg-sky-950/40 p-1 rounded-xl border border-sky-100/60 dark:border-sky-900/40">
                  {["auto", "1080p", "720p", "480p"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setPlaybackQuality(q)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                        playbackQuality === q
                          ? "bg-sky-500 text-white shadow-3xs scale-102"
                          : "text-sky-605 dark:text-sky-305 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                      }`}
                    >
                      {q === "auto" ? "تلقائي" : q}
                    </button>
                  ))}
                </div>
                <Sliders className="w-4 h-4 text-sky-500" />
              </div>

              {/* Speed controls */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end order-2 md:order-3">
                <span className="text-[10px] sm:text-xs font-black text-sky-950 dark:text-sky-200">سرعة التشغيل:</span>
                <div className="flex items-center gap-1 bg-sky-50/50 dark:bg-sky-950/40 p-1 rounded-xl border border-sky-100/60 dark:border-sky-900/40">
                  {[0.5, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                        playbackRate === rate
                          ? "bg-sky-500 text-white shadow-3xs scale-102"
                          : "text-sky-650 dark:text-sky-305 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                      }`}
                    >
                      {rate === 1.0 ? "طبيعي" : `${rate}x`}
                    </button>
                  ))}
                </div>
                <Gauge className="w-4 h-4 text-sky-500 shrink-0" />
              </div>
            </div>

            {/* Subtitle Appearance Customize Panel */}
            <div className="p-4 bg-white/95 dark:bg-[#070e1a]/95 rounded-2xl border border-sky-150 dark:border-sky-955/65 space-y-4 text-right shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-sky-50 dark:border-sky-950/40 pb-2.5">
                <span className="text-[10px] font-mono font-black text-sky-520 dark:text-sky-400 uppercase tracking-wider">Appearance settings</span>
                <h4 className="text-xs font-black text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                  <span>تنسيق مظهر الترجمة الفورية</span>
                  <SlidersHorizontal className="w-4 h-4 text-sky-500" />
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Right col: Visibilty and text size */}
                <div className="space-y-3">
                  {/* Visbility display */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex bg-sky-50/50 dark:bg-sky-950/40 p-0.5 rounded-xl border border-sky-100/60 dark:border-sky-900/40">
                      <button
                        onClick={() => setShowSubtitles(true)}
                        className={`text-2xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                          showSubtitles
                            ? "bg-sky-500 text-white shadow-3xs"
                            : "text-sky-600 dark:text-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-900/20"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>تفعيل</span>
                      </button>
                      <button
                        onClick={() => setShowSubtitles(false)}
                        className={`text-2xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                          !showSubtitles
                            ? "bg-slate-500 text-white shadow-3xs"
                            : "text-sky-600 dark:text-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-900/20"
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>إخفاء</span>
                      </button>
                    </div>
                    <span className="text-2xs sm:text-xs font-black text-sky-950 dark:text-sky-200">عرض الترجمة:</span>
                  </div>

                  {/* Bilingual option */}
                  <div className="space-y-3 p-3 bg-sky-500/5 dark:bg-sky-950/20 rounded-2xl border border-sky-100/40 dark:border-sky-905/30 text-right">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => setSubBilingual(!subBilingual)}
                        className={`text-3xs sm:text-2xs font-extrabold px-3 py-1.8 rounded-xl border cursor-pointer transition-all ${
                          subBilingual
                            ? "bg-sky-550 border-sky-650 text-white shadow-3xs"
                            : "bg-transparent border-sky-150 dark:border-sky-900/60 text-slate-500 dark:text-sky-300"
                        }`}
                      >
                        {subBilingual ? "مفعل (نص أصلي + ترجمة)" : "معطل (ترجمة فقط)"}
                      </button>
                      <span className="text-2xs sm:text-xs font-black text-sky-950 dark:text-sky-200">الترجمة الثنائية (Bilingual):</span>
                    </div>

                    <AnimatePresence>
                      {subBilingual && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-2 border-t border-sky-100/30 dark:border-sky-900/20 overflow-hidden"
                        >
                          {/* Layout Selection */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex bg-sky-50/50 dark:bg-sky-950/40 p-0.5 rounded-xl border border-sky-105/50 dark:border-sky-900/35">
                              {[
                                { val: "stacked", label: "رأسي متراص" },
                                { val: "side-by-side", label: "أفقي متجاور" }
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  onClick={() => setBilingualLayout(item.val)}
                                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                                    bilingualLayout === item.val
                                      ? "bg-sky-500 text-white shadow-3xs"
                                      : "text-sky-600 dark:text-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-900/20"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-sky-400">تخطيط العرض الثنائي:</span>
                          </div>

                          {/* Original Text Size Selection */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex bg-sky-50/50 dark:bg-sky-950/40 p-0.5 rounded-xl border border-sky-105/50 dark:border-sky-900/35">
                              {[
                                { val: "text-3xs", label: "صغير جداً" },
                                { val: "text-2xs", label: "صغير" },
                                { val: "text-xs", label: "افتراضي" },
                                { val: "text-sm", label: "كبير" }
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  onClick={() => setSubOrigFontSize(item.val)}
                                  className={`text-[9px] font-black px-2 py-1 rounded-lg cursor-pointer transition-all ${
                                    subOrigFontSize === item.val
                                      ? "bg-sky-500 text-white shadow-3xs"
                                      : "text-sky-600 dark:text-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-900/20"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-sky-400">حجم النص الأصلي:</span>
                          </div>

                          {/* Original Text Color Selection */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 bg-sky-50/50 dark:bg-sky-950/40 p-1 rounded-xl border border-sky-105/50 dark:border-sky-900/35">
                              {[
                                { val: "text-slate-100", bgClass: "bg-slate-100", label: "أبيض ناصع" },
                                { val: "text-slate-400", bgClass: "bg-slate-400", label: "رمادي متوسط" },
                                { val: "text-yellow-200", bgClass: "bg-yellow-200", label: "أصفر خافت" },
                                { val: "text-sky-300", bgClass: "bg-sky-300", label: "أزرق ثلجي" },
                                { val: "text-emerald-300", bgClass: "bg-emerald-300", label: "أخضر ناعم" }
                              ].map((item) => (
                                <button
                                  key={item.val}
                                  onClick={() => setSubOrigTextColor(item.val)}
                                  className={`w-4 h-4 rounded-full border cursor-pointer transition-transform ${item.bgClass} ${
                                    subOrigTextColor === item.val ? "border-sky-500 scale-110 shadow-3xs" : "border-slate-350 dark:border-slate-700 hover:scale-105"
                                  }`}
                                  title={item.label}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-sky-400">لون النص الأصلي:</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Font Size controls */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex bg-sky-50/50 dark:bg-sky-950/40 p-0.5 rounded-xl border border-sky-100/60 dark:border-sky-900/40 w-full sm:w-auto overflow-x-auto">
                      {[
                        { val: "text-xs", label: "صغير" },
                        { val: "text-sm", label: "افتراضي" },
                        { val: "text-base", label: "متوسط" },
                        { val: "text-lg", label: "كبير" },
                        { val: "text-xl", label: "ضخم" }
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => setSubFontSize(item.val)}
                          className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
                            subFontSize === item.val
                              ? "bg-sky-500 text-white shadow-3xs"
                              : "text-sky-600 dark:text-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-900/20"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-2xs sm:text-xs font-black text-sky-950 dark:text-sky-200 shrink-0">حجم مضلع الخط:</span>
                  </div>
                </div>

                {/* Left col: color and background styles */}
                <div className="space-y-3">
                  {/* Colors selections */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 bg-sky-50/50 dark:bg-sky-950/40 p-1.5 rounded-xl border border-sky-100/40 dark:border-sky-900/30">
                      {[
                        { val: "text-white", bgClass: "bg-white", label: "أبيض" },
                        { val: "text-yellow-300", bgClass: "bg-yellow-300", label: "أصفر مبهج" },
                        { val: "text-sky-300", bgClass: "bg-sky-300", label: "أزرق سماوي" },
                        { val: "text-emerald-300", bgClass: "bg-emerald-300", label: "أخضر فستقي" },
                        { val: "text-rose-300", bgClass: "bg-rose-305 bg-rose-300", label: "وردي ناعم" }
                      ].map((c) => (
                        <button
                          key={c.val}
                          onClick={() => setSubTextColor(c.val)}
                          className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${c.bgClass} ${
                            subTextColor === c.val ? "border-sky-500 scale-110 shadow-xs" : "border-zinc-350 dark:border-zinc-850 border-transparent"
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                    <span className="text-2xs sm:text-xs font-black text-sky-950 dark:text-sky-200">لون خط الترجمة:</span>
                  </div>

                  {/* Subtitle Background Shape / Style */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1 bg-sky-50/50 dark:bg-sky-950/40 p-0.5 rounded-xl border border-sky-100/60 dark:border-sky-900/40">
                      {[
                        { val: "rounded-2xl", label: "مستطيل مستدير" },
                        { val: "rounded-full px-5", label: "كبسولة دائرية" },
                        { val: "rounded-none", label: "شريط مسطح" },
                        { val: "rounded-3xl border-2 border-sky-500/55 shadow-md", label: "إطار مضيء" }
                      ].map((style) => (
                        <button
                          key={style.val}
                          onClick={() => setSubBgStyle(style.val)}
                          className={`text-[10px] font-black px-2 py-1 rounded-lg cursor-pointer transition-all ${
                            subBgStyle === style.val
                              ? "bg-sky-500 text-white shadow-3xs"
                              : "text-sky-600 dark:text-sky-305 hover:bg-sky-50/50 dark:hover:bg-sky-900/20"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-2xs sm:text-xs font-black text-sky-950 dark:text-sky-200">تصميم حواف الخلفية:</span>
                  </div>

                  {/* Subtitle Background Color */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 bg-sky-50/50 dark:bg-sky-950/40 p-1.5 rounded-xl border border-sky-100/40 dark:border-sky-900/30">
                      {[
                        { val: "bg-slate-950", bgClass: "bg-slate-950", label: "رمادي كوني" },
                        { val: "bg-black", bgClass: "bg-black", label: "أسود خالص" },
                        { val: "bg-zinc-900", bgClass: "bg-zinc-900", label: "معدني داكن" },
                        { val: "bg-sky-950", bgClass: "bg-sky-950", label: "أزرق عميق" },
                        { val: "bg-indigo-950", bgClass: "bg-indigo-950", label: "بنفسجي كحلي" },
                        { val: "bg-rose-950", bgClass: "bg-rose-950", label: "وردي مظلم" },
                        { val: "bg-transparent", bgClass: "bg-white dark:bg-zinc-900", label: "بدون لون" }
                      ].map((c) => (
                        <button
                          key={c.val}
                          onClick={() => setSubBgColor(c.val)}
                          className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center overflow-hidden relative ${c.bgClass} ${
                            subBgColor === c.val ? "border-sky-500 scale-110 shadow-sm" : "border-zinc-300 dark:border-zinc-700"
                          }`}
                          title={c.label}
                        >
                          {c.val === "bg-transparent" && (
                            <span className="absolute inset-0 m-auto w-full h-0.5 bg-rose-500 rotate-45 transform rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                    <span className="text-2xs sm:text-xs font-black text-sky-950 dark:text-sky-200">لون خلفية الترجمة:</span>
                  </div>

                  {/* Subtitle Background Opacity */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1 bg-sky-50/50 dark:bg-sky-950/40 p-0.5 rounded-xl border border-sky-100/60 dark:border-sky-900/40">
                      {[
                        { val: "bg-opacity-0", label: "0% (شفاف)" },
                        { val: "bg-opacity-25", label: "25%" },
                        { val: "bg-opacity-45", label: "45%" },
                        { val: "bg-opacity-65", label: "65%" },
                        { val: "bg-opacity-85", label: "85%" },
                        { val: "bg-opacity-100", label: "100%" }
                      ].map((op) => (
                        <button
                          key={op.val}
                          onClick={() => setSubBgOpacity(op.val)}
                          className={`text-[10px] font-black px-2 py-1 rounded-lg cursor-pointer transition-all ${
                            subBgOpacity === op.val
                              ? "bg-sky-500 text-white shadow-3xs"
                              : "text-sky-600 dark:text-sky-305 hover:bg-sky-50/50 dark:hover:bg-sky-900/20"
                          }`}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-2xs sm:text-xs font-black text-sky-950 dark:text-sky-200">عتامة وتظليل الخلفية:</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Tips */}
            <div className="p-3 bg-sky-50/50 dark:bg-[#13223D]/20 border border-sky-100 dark:border-transparent rounded-xl text-right text-3xs text-sky-600 dark:text-sky-300 flex items-center justify-end gap-1.5 font-black shadow-3xs">
              <span>قم بتشغيل الفيديو وملاحظة تراكب الترجمة الفورية بشكل حي مع النطق!</span>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
            </div>
          </div>

          {/* Transcript sidebar with timelines */}
          <div className="lg:col-span-5 bg-sky-50/10 dark:bg-[#10192C]/30 border border-sky-150 dark:border-sky-950/60 rounded-[2rem] p-4 min-h-[300px] flex flex-col shadow-3xs animate-fade-in_500">
            <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-950/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <h4 className="text-xs font-black text-sky-950 dark:text-sky-200">نص النص الكامل والترجمة الفورية</h4>
              </div>
              {subtitles.length > 0 && (
                <button
                  onClick={() => {
                    const content = subtitles.map(s => `[${s.startTime} - ${s.endTime}] ${s.translated}`).join("\n\n");
                    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `translation_video_${Date.now()}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 text-3xs font-bold rounded hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors"
                  title="حفظ الترجمة كنص (TXT)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير (TXT)</span>
                </button>
              )}
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[320px] scrollbar-thin text-right">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-sky-400">
                  <RefreshCw className="w-6 h-6 text-sky-500 animate-spin" />
                  <p className="text-xs mt-3 font-semibold">جاري استخراج وتحليل المقاطع الصوتية...</p>
                </div>
              ) : subtitles.length > 0 ? (
                subtitles.map((sub, i) => {
                  const startSecs = timeToSeconds(sub.startTime);
                  const endSecs = timeToSeconds(sub.endTime);
                  const isActive = currentTime >= startSecs && currentTime <= endSecs;

                  return (
                    <button
                      key={i}
                      onClick={() => handleSubtitleClick(sub)}
                      className={`block w-full text-right p-3 rounded-xl border text-xs transition-all cursor-pointer shadow-3xs ${
                        isActive
                          ? "bg-sky-50/50 dark:bg-[#13223D]/60 border-sky-305 scale-101 font-black shadow-xs"
                          : "bg-white dark:bg-[#070F1E] border-transparent hover:border-sky-100 dark:hover:border-sky-950 hover:bg-sky-50/30 dark:hover:bg-[#13223D]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-sky-50 dark:border-[#13223D]/60 pb-1.5 mb-1.5 text-2xs">
                        <span className="font-extrabold text-sky-600 dark:text-sky-300">
                          {sub.startTime} - {sub.endTime}
                        </span>
                        {isActive && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-200 opacity-75 animate-duration-1000"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[#4E696E] dark:text-sky-300 text-2xs italic leading-relaxed">
                          {sub.original}
                        </p>
                        <p className="text-sky-950 dark:text-sky-100 font-extrabold leading-relaxed text-xs">
                          {sub.translated}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-sky-400 space-y-2">
                  <PlayCircle className="w-8 h-8 opacity-60 text-sky-550" />
                  <p className="text-xs font-semibold leading-relaxed">
                    بمجرد استيراد المقطع وضغطه بالذكاء الاصطناعي، سيتم توليد النصوص المفرغة والترجمات التفصيلية المتزامنة هنا مباشرة.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
