import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Check,
  FileType2,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  HelpCircle,
  Layers,
  Globe,
  Star,
  Sparkles,
  Eye,
  Highlighter,
  MousePointer2,
  Download,
  Columns,
  Type,
  ArrowDownCircle,
} from "lucide-react";
import { OCRElement, LANGUAGES } from "../types";
import { TranslationError } from "./TranslationError";
import { motion, AnimatePresence } from "motion/react";
import { SearchableCombobox } from "./SearchableCombobox";

interface PdfTranslatorProps {
  theme: "light" | "dark";
}

import { fetchWithProgress } from "../utils/upload";

export const PdfTranslator: React.FC<PdfTranslatorProps> = ({ theme }) => {
  const [loadingStage, setLoadingStage] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  const [targetLang, setTargetLang] = useState<string>(() => {
    try {
      return localStorage.getItem("pdf_translator_target_lang") || "ar";
    } catch {
      return "ar";
    }
  });
  const [tone, setTone] = useState<string>(() => {
    try {
      return localStorage.getItem("pdf_translator_tone") || "standard";
    } catch {
      return "standard";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("pdf_translator_target_lang", targetLang);
    } catch (e) {}
  }, [targetLang]);

  useEffect(() => {
    try {
      localStorage.setItem("pdf_translator_tone", tone);
    } catch (e) {}
  }, [tone]);

  const [ocrElements, setOcrElements] = useState<OCRElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [activeHoverId, setActiveHoverId] = useState<number | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [blockHighlights, setBlockHighlights] = useState<
    Record<number, string>
  >({});
  const [activeHighlighter, setActiveHighlighter] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"single" | "split">("single");
  const [textScale, setTextScale] = useState<number>(1);

  const HIGHLIGHT_COLORS = [
    {
      id: "yellow",
      bg: "bg-yellow-200/90 dark:bg-yellow-500/60",
      ring: "ring-yellow-400",
    },
    {
      id: "green",
      bg: "bg-emerald-200/90 dark:bg-emerald-500/60",
      ring: "ring-emerald-400",
    },
    {
      id: "blue",
      bg: "bg-blue-200/90 dark:bg-blue-500/60",
      ring: "ring-blue-400",
    },
    {
      id: "pink",
      bg: "bg-pink-200/90 dark:bg-pink-500/60",
      ring: "ring-pink-400",
    },
  ];

  const handleBlockClick = (e: React.MouseEvent, index: number) => {
    if (activeHighlighter) {
      e.stopPropagation();
      setBlockHighlights((prev) => {
        const next = { ...prev };
        if (activeHighlighter === "clear") {
          delete next[index];
        } else {
          next[index] = activeHighlighter;
        }
        return next;
      });
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processPdfFile = (file: File) => {
    setPdfFile(file);
    setOcrElements([]);
    setError(null);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultData = reader.result as string;
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 10;
        if (progress >= 100) {
          progress = 100;
          setUploadProgress(100);
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(null);
            handleTranslatePdf(resultData);
          }, 600);
        } else {
          setUploadProgress(progress);
        }
      }, 300);
    };
    reader.onerror = () => {
      setUploadProgress(null);
      setError("فشلت عملية قراءة ملف الـ PDF. يرجى المحاولة باستخدام ملف آخر.");
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPdf = async (
    type: "full" | "annotated" | "text_only",
  ) => {
    if (!pdfFile || ocrElements.length === 0) return;

    try {
      setIsGeneratingPdf(true);
      const { PDFDocument, rgb } = await import("pdf-lib");
      const fontkit = (await import("@pdf-lib/fontkit")).default;

      // Fetch an Arabic TTF font
      const fontRes = await fetch(
        "https://themes.googleusercontent.com/static/fonts/earlyaccess/droidarabicnaskh/v4/DroidNaskh-Regular.ttf",
      );
      if (!fontRes.ok) throw new Error("Failed to load PDF font");
      const fontBuffer = await fontRes.arrayBuffer();

      let targetPdfDoc;

      if (type === "text_only") {
        targetPdfDoc = await PDFDocument.create();
        targetPdfDoc.registerFontkit(fontkit);
        const customFont = await targetPdfDoc.embedFont(fontBuffer);

        let page = targetPdfDoc.addPage([595.28, 841.89]); // A4 size
        const { width, height } = page.getSize();
        const fontSize = 14;
        const margin = 50;
        let yOrigin = height - margin;

        for (const el of ocrElements) {
          if (yOrigin - fontSize - 10 < margin) {
            page = targetPdfDoc.addPage([595.28, 841.89]);
            yOrigin = height - margin;
          }
          // Simple right aligned logic for arabic
          const simulatedWidth = Math.min(
            width - margin * 2,
            el.translatedText.length * (fontSize * 0.5),
          );
          page.drawText(el.translatedText, {
            x: width - margin - Math.min(simulatedWidth, width - margin * 2),
            y: yOrigin,
            size: fontSize,
            font: customFont,
            color: rgb(0, 0, 0),
            maxWidth: width - margin * 2,
          });
          yOrigin -= fontSize + 15;
        }
      } else {
        const pdfBytes = await pdfFile.arrayBuffer();
        targetPdfDoc = await PDFDocument.load(pdfBytes);
        targetPdfDoc.registerFontkit(fontkit);
        const customFont = await targetPdfDoc.embedFont(fontBuffer);

        if (type === "annotated") {
          const pagesCount = targetPdfDoc.getPageCount();
          for (let i = pagesCount - 1; i > 0; i--) {
            targetPdfDoc.removePage(i);
          }
        }

        const pages = targetPdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        const colorsMap: Record<string, [number, number, number]> = {
          yellow: [253 / 255, 224 / 255, 71 / 255],
          green: [110 / 255, 231 / 255, 183 / 255],
          blue: [147 / 255, 197 / 255, 253 / 255],
          pink: [249 / 255, 168 / 255, 212 / 255],
        };

        ocrElements.forEach((el, i) => {
          const highlightId = blockHighlights[i];
          const [r, g, b] =
            highlightId && colorsMap[highlightId]
              ? colorsMap[highlightId]
              : [248 / 255, 250 / 255, 252 / 255];

          const rectX = (el.x / 100) * width;
          const rectH = (el.height / 100) * height;
          const rectY = height - (el.y / 100) * height - rectH;
          const rectW = (el.width / 100) * width;

          firstPage.drawRectangle({
            x: rectX,
            y: rectY,
            width: rectW,
            height: rectH,
            color: rgb(r, g, b),
          });

          const fontSize = 11 * textScale;
          firstPage.drawText(el.translatedText, {
            x: rectX + 2,
            y: rectY + rectH - fontSize - 4,
            size: fontSize,
            font: customFont,
            color: rgb(15 / 255, 23 / 255, 42 / 255),
            maxWidth: Math.max(rectW - 4, 10),
          });
        });
      }

      const modifiedPdfBytes = await targetPdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "text_only"
          ? `clean_text_${pdfFile.name}`
          : type === "annotated"
            ? `annotated_${pdfFile.name}`
            : `translated_${pdfFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(
        "فشلت عملية إنشاء ملف الـ PDF. تأكد من اتصالك بالإنترنت لتحميل الخطوط.",
      );
    } finally {
      setIsGeneratingPdf(false);
      setDownloadMenuOpen(false);
    }
  };

  const handleTranslatePdf = async (base64Data: string) => {
    setIsLoading(true);
    setOcrElements([]);
    setBlockHighlights({});
    setActiveHighlighter(null);
    setError(null);
    setLoadingStage(0);
    setSimulatedProgress(0);

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      // Background simulated progress after upload or between events
      if (currentProgress >= 90) return; // Wait for server to finish at 90%
      currentProgress += Math.random() * 2 + 0.5;
      if (currentProgress > 95) currentProgress = 95;

      setSimulatedProgress(Math.floor(currentProgress));
      if (currentProgress < 50) {
        setLoadingStage(0); // Uploading
      } else if (currentProgress < 85) {
        setLoadingStage(1); // Processing OCR
      } else {
        setLoadingStage(2); // Translating
      }
    }, 800);

    try {
      const data = await fetchWithProgress("/api/translate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfData: base64Data,
          targetLang,
          tone,
        }),
        onUploadProgress: (e, percentage) => {
          // Map file upload to first 50%
          const mappedProgress = Math.min((percentage / 100) * 50, 50);
          if (mappedProgress > currentProgress) {
            currentProgress = mappedProgress;
            setSimulatedProgress(Math.floor(currentProgress));
            if (currentProgress < 50) setLoadingStage(0);
            else if (currentProgress < 85) setLoadingStage(1);
            else setLoadingStage(2);
          }
        },
      });

      clearInterval(progressInterval);
      setSimulatedProgress(100);
      setLoadingStage(3);

      setTimeout(() => {
        setOcrElements(data.elements || []);
        setIsLoading(false);
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع أثناء المعالجة.");
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPdfFile(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        processPdfFile(file);
      } else {
        setError("يرجى رفع ملف بصيغة PDF فقط للترجمة الهيكلية.");
      }
    }
  };

  return (
    <div className="w-full flex-col flex h-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
        {/* PDF Preview Area */}
        <div
          className={`md:col-span-8 flex flex-col relative w-full ${viewMode === "split" ? "items-stretch" : "items-center"}`}
        >
          <div
            className={`relative w-full ${viewMode === "split" ? "flex gap-4 max-w-[1200px]" : "max-w-[500px]"} h-[550px] md:h-[650px]
            `}
          >
            {pdfFile && !isLoading && ocrElements.length > 0 ? (
              <>
                {/* Translated Preview */}
                <div
                  className={`relative h-full rounded-sm ${viewMode === "split" ? "w-1/2" : "w-full"} bg-white dark:bg-[#070F1E] border border-slate-300 dark:border-slate-800 flex items-center justify-center overflow-hidden transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-2xl`}
                >
                  <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900">
                    {viewMode === "split" && (
                      <div className="absolute top-2 right-2 bg-slate-900/60 dark:bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-md border border-white/10 z-30 font-bold pointer-events-none">
                        الترجمة (النتيجة)
                      </div>
                    )}
                    <AnimatePresence>
                      {showOverlays &&
                        ocrElements.map((el, i) => {
                          const isHovered = activeHoverId === i;
                          const highlightColor = blockHighlights[i];
                          const highlightDef = HIGHLIGHT_COLORS.find(
                            (c) => c.id === highlightColor,
                          );
                          const customBg = highlightDef ? highlightDef.bg : "";

                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{
                                delay: i * 0.05,
                                type: "spring",
                                stiffness: 200,
                                damping: 20,
                              }}
                              onMouseEnter={() => setActiveHoverId(i)}
                              onMouseLeave={() => setActiveHoverId(null)}
                              onClick={(e) => handleBlockClick(e, i)}
                              className={
                                `absolute rounded-sm ${activeHighlighter ? "cursor-crosshair" : "cursor-pointer"} transition-all duration-300 ` +
                                (isHovered
                                  ? `shadow-[0_0_20px_rgba(56,189,248,0.4)] dark:shadow-[0_0_20px_rgba(56,189,248,0.2)] scale-[1.02] z-50 border border-sky-400 backdrop-blur-md ring-2 ring-sky-400/50 ${customBg || "bg-sky-100 text-sky-950 dark:bg-sky-900/90 dark:text-sky-50"}`
                                  : `shadow-sm z-10 border border-slate-200 dark:border-slate-700 backdrop-blur-sm ${customBg ? customBg + " text-slate-900 dark:text-slate-100 border-transparent" : "bg-white/95 text-slate-900 dark:bg-slate-800/90 dark:text-slate-100"}`)
                              }
                              style={{
                                left: `${el.x}%`,
                                top: `${el.y}%`,
                                width: `${el.width}%`,
                                height: `${el.height}%`,
                                padding: "4px",
                              }}
                            >
                              <div
                                className="w-full h-full flex flex-col justify-start overflow-hidden text-[8px] sm:text-[10px] md:text-xs"
                                style={{ fontSize: `${textScale * 100}%` }}
                              >
                                <span
                                  className={`font-black leading-tight ${isHovered ? "opacity-100" : "opacity-90"}`}
                                >
                                  {el.translatedText}
                                </span>

                                <AnimatePresence>
                                  {isHovered && viewMode !== "split" && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-1 pt-1 border-t border-sky-300/50 dark:border-sky-700/50 text-[7px] sm:text-[9px] text-sky-700 dark:text-sky-300"
                                    >
                                      {el.originalText}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Original Preview (Split Mode Only) */}
                {viewMode === "split" && (
                  <div
                    className={`relative h-full rounded-sm w-1/2 bg-white dark:bg-[#070F1E] border border-slate-300 dark:border-slate-800 flex items-center justify-center overflow-hidden transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-2xl`}
                  >
                    <div className="absolute inset-0 w-full h-full bg-slate-50 dark:bg-slate-900/50">
                      <div className="absolute top-2 left-2 bg-slate-900/60 dark:bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-md border border-white/10 z-30 font-bold pointer-events-none">
                        النص الأصلي (المصدر)
                      </div>
                      <AnimatePresence>
                        {ocrElements.map((el, i) => {
                          const isHovered = activeHoverId === i;
                          return (
                            <motion.div
                              key={`orig-${i}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{
                                delay: i * 0.05,
                                type: "spring",
                                stiffness: 200,
                                damping: 20,
                              }}
                              className={
                                `absolute rounded-sm transition-all duration-300 ` +
                                (isHovered
                                  ? `shadow-md z-50 border border-slate-400 bg-white dark:bg-slate-800 ring-2 ring-slate-400/50`
                                  : `shadow-sm z-10 border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50`)
                              }
                              style={{
                                left: `${el.x}%`,
                                top: `${el.y}%`,
                                width: `${el.width}%`,
                                height: `${el.height}%`,
                                padding: "4px",
                              }}
                            >
                              <div className="w-full h-full flex flex-col justify-start text-[8px] sm:text-[10px] md:text-xs overflow-hidden">
                                <span
                                  className={`font-medium leading-tight text-slate-700 dark:text-slate-300`}
                                >
                                  {el.originalText}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </>
            ) : uploadProgress !== null ? (
              <div
                className={`w-full max-w-[500px] mx-auto h-[550px] md:h-[650px] rounded-sm bg-white dark:bg-[#070F1E] border border-slate-300 dark:border-slate-800 flex items-center justify-center overflow-hidden transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-2xl`}
              >
                <div className="flex flex-col items-center justify-center p-8 text-sky-500 w-[60%]">
                  <FileText className="w-14 h-14 mb-4 text-sky-400 animate-bounce" />
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-sky-950 dark:text-sky-200">
                        جاري الرفع...
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div
                className={`w-full max-w-[500px] mx-auto h-[550px] md:h-[650px] rounded-sm bg-white dark:bg-[#070F1E] border border-slate-300 dark:border-slate-800 flex items-center justify-center overflow-hidden transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-2xl`}
              >
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-[#030A16]/50 backdrop-blur-md">
                  <div className="w-full max-w-sm bg-slate-900/96 border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-5 text-right backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span className="text-[10px] font-mono font-black text-sky-400 bg-sky-950/60 border border-sky-900/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        PDF Vision Engine
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        معالجة وهيكلة المستند
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {[
                        {
                          id: 0,
                          title: "1. تحليل المستند (Parsing)",
                          desc: "قراءة النصوص وبنية المستند والأبعاد.",
                          progress: Math.min(
                            100,
                            Math.max(
                              0,
                              Math.round((simulatedProgress / 35) * 100),
                            ),
                          ),
                          barColor: "from-indigo-600 via-indigo-400 to-sky-500",
                        },
                        {
                          id: 1,
                          title: "2. استخراج الكتل (Extraction)",
                          desc: "تحديد مواقع الفقرات الفراغية والهيكلية.",
                          progress:
                            simulatedProgress < 35
                              ? 0
                              : Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Math.round(
                                      ((simulatedProgress - 35) / (72 - 35)) *
                                        100,
                                    ),
                                  ),
                                ),
                          barColor: "from-amber-600 via-amber-400 to-sky-450",
                        },
                        {
                          id: 2,
                          title: "3. مطابقة الترجمة (Reconstruction)",
                          desc: "توليد الترجمة ووضعها في الطبقة الصحيحة.",
                          progress:
                            simulatedProgress < 72
                              ? 0
                              : Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Math.round(
                                      ((simulatedProgress - 72) / (96 - 72)) *
                                        100,
                                    ),
                                  ),
                                ),
                          barColor:
                            "from-emerald-600 via-emerald-400 to-teal-400",
                        },
                      ].map((st) => {
                        const isActive = loadingStage === st.id;
                        const isCompleted = loadingStage > st.id;
                        return (
                          <div key={st.id} className="text-right">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="font-mono text-sky-400">
                                {st.progress}%
                              </span>
                              <span
                                className={`font-bold ${isActive ? "text-white" : isCompleted ? "text-slate-300" : "text-slate-500"}`}
                              >
                                {st.title}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full bg-gradient-to-r ${st.barColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${st.progress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {st.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`w-full max-w-[500px] mx-auto h-[550px] md:h-[650px] rounded-sm flex items-center justify-center overflow-hidden transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-2xl ${
                  isDragActive
                    ? "bg-sky-50 dark:bg-sky-900/20 border-2 border-dashed border-sky-400"
                    : "bg-white dark:bg-[#070F1E] border border-slate-300 dark:border-slate-800"
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div
                  className="text-center p-8 cursor-pointer flex flex-col items-center group max-w-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 rounded-3xl bg-sky-100 dark:bg-[#13223D] flex items-center justify-center text-sky-500 transition-transform group-hover:scale-110 duration-500 mb-6 border border-sky-200 dark:border-sky-800 shadow-xl shadow-sky-500/10">
                    <FileType2 className="w-10 h-10 group-hover:rotate-6 transition-transform" />
                  </div>
                  <h3 className="text-lg font-black text-sky-950 dark:text-sky-200 mb-3 tracking-tight">
                    ترجمة وعكس المستندات
                  </h3>
                  <p className="text-xs text-sky-600/80 dark:text-sky-300/60 font-semibold leading-relaxed px-4">
                    اسحب ملف PDF هنا لعرضه وترجمة محتواه مع الحفاظ على الأماكن
                    الطبيعية، أو اضغط للتصفح من الجهاز.
                  </p>
                  <div className="mt-8 px-5 py-2.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-100 dark:border-sky-800/50 flex items-center gap-2 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>تحديد مستند</span>
                  </div>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {ocrElements.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-6 right-6 z-20 flex justify-between gap-2 pointer-events-none"
            >
              <div className="flex gap-2 pointer-events-auto">
                <button
                  onClick={() => setShowOverlays(!showOverlays)}
                  className="p-2 sm:px-3 rounded-lg bg-white/95 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md text-[10px] sm:text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 backdrop-blur-md hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:block">
                    {showOverlays ? "إخفاء الطبقة" : "إظهار الطبقة"}
                  </span>
                </button>
                <button
                  onClick={() =>
                    setViewMode((v) => (v === "split" ? "single" : "split"))
                  }
                  className="p-2 sm:px-3 rounded-lg bg-white/95 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md text-[10px] sm:text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 backdrop-blur-md hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Columns className="w-4 h-4" />
                  <span className="hidden sm:block">
                    {viewMode === "split" ? "عرض مفرد" : "معاينة مزدوجة"}
                  </span>
                </button>
              </div>

              {showOverlays && (
                <div className="flex gap-1.5 p-1.5 rounded-xl bg-white/95 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md backdrop-blur-md pointer-events-auto">
                  <button
                    onClick={() => setActiveHighlighter(null)}
                    className={`p-1.5 rounded-lg transition-colors ${activeHighlighter === null ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}
                    title="مؤشر عادي"
                  >
                    <MousePointer2 className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-slate-200 dark:bg-slate-700 my-1 mx-0.5"></div>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveHighlighter(c.id)}
                      className={`w-7 h-7 rounded-full outline-none flex items-center justify-center transition-all ${
                        activeHighlighter === c.id
                          ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${c.ring} scale-110 shadow-sm`
                          : "hover:scale-110 border border-black/10 dark:border-white/10"
                      } ${c.bg}`}
                      title={`عنصر ملون`}
                    />
                  ))}
                  <button
                    onClick={() => setActiveHighlighter("clear")}
                    className={`w-7 h-7 rounded-full outline-none transition-all flex items-center justify-center border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-rose-500 ${
                      activeHighlighter === "clear"
                        ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-rose-400 scale-110`
                        : "hover:scale-110 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    }`}
                    title="ممحاة التظليل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Settings panel */}
        <div className="md:col-span-4 flex flex-col space-y-6">
          <div className="bg-white/60 dark:bg-[#0C1525]/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-sky-950 dark:text-sky-200 text-right flex items-center justify-end gap-2">
              <span>إعدادات وثيقة المخرجات</span>
              <Layers className="w-5 h-5 text-sky-500" />
            </h4>

            <div className="space-y-4">
              <div className="space-y-2 text-right">
                <label className="text-xs font-bold text-sky-800 dark:text-sky-305">
                  اللغة الهدف للوثيقة
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#13223D] border border-slate-200 dark:border-slate-700 text-sky-950 dark:text-sky-100 text-sm font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  dir="rtl"
                >
                  {LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-right">
                <label className="text-xs font-bold text-sky-800 dark:text-sky-305">
                  مستوى الصياغة والأسلوب
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#13223D] border border-slate-200 dark:border-slate-700 text-sky-950 dark:text-sky-100 text-sm font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  dir="rtl"
                >
                  <option value="standard">قياسي (منطقي ودقيق)</option>
                  <option value="formal">رسمي (أكاديمي/مستندات)</option>
                  <option value="poetic">
                    إبداعي (للمقالات والمواد الإبداعية)
                  </option>
                </select>
              </div>

              <div className="space-y-4 text-right">
                <label className="text-xs font-bold text-sky-800 dark:text-sky-305 flex items-center justify-end gap-1">
                  حجم الخط للطبقة المترجمة
                  <Type className="w-3.5 h-3.5" />
                </label>
                <div className="flex items-center gap-3" dir="rtl">
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={textScale}
                    onChange={(e) => setTextScale(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500 w-8 text-center">
                    {textScale.toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <TranslationError
                error={error}
                onRetry={() => (pdfFile ? processPdfFile(pdfFile) : null)}
              />
            )}

            {ocrElements.length > 0 && !isLoading && (
              <div className="pt-2 relative">
                <motion.button
                  whileTap={!isGeneratingPdf ? { scale: 0.95 } : undefined}
                  animate={
                    isGeneratingPdf
                      ? {
                          scale: [1, 1.02, 1],
                          transition: {
                            duration: 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                        }
                      : {
                          scale: [1, 1.02, 1],
                          boxShadow: [
                            "0px 0px 5px #0EA5E9",
                            "0px 0px 15px #0EA5E9",
                            "0px 0px 5px #0EA5E9",
                          ],
                          transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                        }
                  }
                  whileHover={
                    !isGeneratingPdf
                      ? {
                          boxShadow: "0px 0px 25px rgba(14, 165, 233, 0.8)",
                          scale: 1.02,
                        }
                      : undefined
                  }
                  onClick={() =>
                    !isGeneratingPdf && setDownloadMenuOpen(!downloadMenuOpen)
                  }
                  disabled={isGeneratingPdf}
                  className={`w-full text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md ${
                    isGeneratingPdf
                      ? "bg-sky-400 cursor-not-allowed opacity-90"
                      : "bg-sky-500 hover:bg-sky-600 hover:shadow-lg"
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {isGeneratingPdf ? (
                      <motion.div
                        key="generating"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                        <span>جاري المعالجة...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="download"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        <span>تنزيل PDF معدّل</span>
                        <ArrowDownCircle className="w-4 h-4 ml-1 opacity-70" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                  {downloadMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl overflow-hidden z-20"
                    >
                      <ul className="py-1 text-sm text-right">
                        <li>
                          <button
                            onClick={() => handleDownloadPdf("full")}
                            className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200"
                          >
                            تنزيل المستند كاملاً (معدلاً)
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => handleDownloadPdf("annotated")}
                            className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200"
                          >
                            تنزيل الصفحات المعالجة فقط
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => handleDownloadPdf("text_only")}
                            className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 font-bold text-sky-600 dark:text-sky-400"
                          >
                            تنزيل النص المترجم فقط (نظيف بصيغة PDF)
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              const content = ocrElements.map(el => el.translatedText).join("\n\n");
                              const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `translation_pdf_${Date.now()}.txt`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                              setDownloadMenuOpen(false);
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-emerald-600 dark:text-emerald-400"
                          >
                            تصدير الترجمة كملف نصي (TXT)
                          </button>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex-1 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-[#0C1525] dark:to-[#070F1E] rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm flex flex-col items-end text-right justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/50 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 w-full space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-sky-500 mb-4 ml-auto">
                <FileType2 className="w-6 h-6" />
              </div>
              <h4 className="font-black text-sky-950 dark:text-sky-200 text-sm">
                التنقيب في بنية المستند
              </h4>
              <p className="text-xs text-sky-700 dark:text-sky-400 font-semibold leading-relaxed">
                يقوم نظامنا بمسح المستند واستخراج الهيكل النصي الأصلي، ومن ثم
                إسقاط الترجمة الدقيقة في نفس الإحداثيات الهندسية لمظهر طبيعي
                ومرتب.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
