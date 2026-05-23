import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, Camera, Image as ImageIcon, Eye, EyeOff, RefreshCw, 
  Trash2, HelpCircle, Layers, Globe, SwitchCamera, Check, Sparkles, Cpu,
  Bold, Italic, Download, ZoomIn, ZoomOut, Type
} from "lucide-react";
import { OCRElement, LANGUAGES } from "../types";
import { TranslationError } from "./TranslationError";
import { motion, AnimatePresence } from "motion/react";
import { fetchWithProgress } from "../utils/upload";

interface ImageTranslatorProps {
  theme: "light" | "dark";
}

export const ImageTranslator: React.FC<ImageTranslatorProps> = ({ theme }) => {
  const [imagesLoadingStage, setImagesLoadingStage] = useState(0); // 0 = prep, 1 = OCR, 2 = Translating
  const [imagesSimulatedProgress, setImagesSimulatedProgress] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string>(() => {
    try {
      return localStorage.getItem("image_translator_target_lang") || "ar";
    } catch {
      return "ar";
    }
  });
  const [tone, setTone] = useState<string>(() => {
    try {
      return localStorage.getItem("image_translator_tone") || "standard";
    } catch {
      return "standard";
    }
  });

  const [ocrElements, setOcrElements] = useState<OCRElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [activeHoverId, setActiveHoverId] = useState<number | null>(null);
  
  // Text Editor State for Image Blocks
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [blockStyles, setBlockStyles] = useState<Record<number, { bold?: boolean, italic?: boolean, fontSize?: number }>>({});
  
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem("image_translator_target_lang", targetLang);
    } catch (e) {
      console.error("Local storage error in ImageTranslator targetLang:", e);
    }
  }, [targetLang]);

  // Persist selected OCR tone in localStorage
  useEffect(() => {
    try {
      localStorage.setItem("image_translator_tone", tone);
    } catch (e) {
      console.error("Local storage error in ImageTranslator tone:", e);
    }
  }, [tone]);

  // Camera settings
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleStyle = (id: number, style: 'bold' | 'italic') => {
    setBlockStyles(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [style]: !prev[id]?.[style]
      }
    }));
  };

  const changeFontSize = (id: number, change: number) => {
    setBlockStyles(prev => {
      const currentSize = prev[id]?.fontSize || 1;
      const newSize = Math.max(0.5, Math.min(2.5, currentSize + change));
      return {
        ...prev,
        [id]: {
          ...prev[id],
          fontSize: newSize
        }
      };
    });
  };

  const handleDownloadAnnotatedImage = () => {
    if (!imagePreview || ocrElements.length === 0) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imagePreview;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      ocrElements.forEach((el, index) => {
        if (!showOverlays) return; 

        const style = blockStyles[index] || {};
        const isBold = style.bold ? "bold" : "normal";
        const isItalic = style.italic ? "italic" : "normal";
        const fontSizeMultiplier = style.fontSize || 1;
        
        // Approximate standard font size based on block height
        const baseFontSize = (el.height / 100) * img.height * 0.7;
        const fontPixelSize = baseFontSize * fontSizeMultiplier;

        ctx.font = `${isItalic} ${isBold} ${fontPixelSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.direction = "rtl";

        const xPos = (el.x / 100) * img.width;
        const yPos = (el.y / 100) * img.height;
        const widthPos = (el.width / 100) * img.width;
        const heightPos = (el.height / 100) * img.height;

        ctx.fillStyle = theme === "dark" ? "rgba(3, 10, 22, 0.95)" : "rgba(240, 249, 255, 0.95)";
        ctx.fillRect(xPos, yPos, widthPos, heightPos);

        ctx.strokeStyle = theme === "dark" ? "rgba(30, 58, 138, 0.6)" : "rgba(125, 211, 252, 0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(xPos, yPos, widthPos, heightPos);

        ctx.fillStyle = theme === "dark" ? "#e0f2fe" : "#082f49";
        
        // Ensure bounded width fitting if it overflows, this is native to fillText
        ctx.fillText(el.translatedText, xPos + widthPos/2, yPos + heightPos/2, widthPos - 10);
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const element = document.createElement("a");
      element.href = dataUrl;
      element.download = "translated-image.jpg";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };
  };

  // Stop camera tracks
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Launch browser camera
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setImagePreview(null);
    setImageFile(null);
    setOcrElements([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // prefer rear camera on mobile
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      setIsCameraActive(false);
      setCameraError(
        "لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات أو تحديث المتصفح."
      );
    }
  };

  // Capture frame from active camera stream
  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImagePreview(dataUrl);
        stopCamera();

        // Convert base64 dataurl to a simulated File object
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], "camera_capture.jpg", {
              type: "image/jpeg",
            });
            setImageFile(file);
          });
      }
    }
  };

  // Helper to process image file with realistic upload progress
  const processImageFile = (file: File) => {
    setImageFile(file);
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
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(null);
            setImagePreview(resultData);
          }, 300);
        }
        setUploadProgress(progress);
      }, 70);
    };
    reader.readAsDataURL(file);
  };

  // Read upload files or file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const triggerSearch = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      } else {
        setError("يرجى سحب ملفات صور صالحة فقط (PNG, JPEG).");
      }
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setOcrElements([]);
    setError(null);
    setUploadProgress(null);
    setBlockStyles({});
    setSelectedBlockId(null);
    stopCamera();
  };

  // Call translation backend with original base64
  const handleImageTranslate = async () => {
    if (!imagePreview) return;

    setIsLoading(true);
    setError(null);
    setImagesLoadingStage(0);
    setImagesSimulatedProgress(5);
    setBlockStyles({});
    setSelectedBlockId(null);

    // Dynamic, high-fidelity progressive step simulation intervals
    let prog = 5;
    const progressInterval = setInterval(() => {
      if (prog >= 90) return; // Wait at 90
      prog += Math.floor(Math.random() * 3) + 1;
      if (prog > 96) prog = 96;
      setImagesSimulatedProgress(prog);

      // Determine the active stage based on percentage thresholds
      if (prog < 50) {
        setImagesLoadingStage(0);
      } else if (prog < 80) {
        setImagesLoadingStage(1);
      } else {
        setImagesLoadingStage(2);
      }
    }, 200);

    try {
      const data = await fetchWithProgress("/api/translate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imagePreview,
          mimeType: imageFile?.type || "image/jpeg",
          targetLang: targetLang,
          tone: tone,
        }),
        onUploadProgress: (e, percentage) => {
          const mappedProg = Math.floor(5 + (percentage / 100) * 45); // Map to 5-50%
          if (mappedProg > prog) {
            prog = mappedProg;
            setImagesSimulatedProgress(prog);
            if (prog < 50) setImagesLoadingStage(0);
            else if (prog < 80) setImagesLoadingStage(1);
            else setImagesLoadingStage(2);
          }
        }
      });

      setImagesSimulatedProgress(100);
      setImagesLoadingStage(2);
      
      // Give a tiny moment for the completion animation
      setTimeout(() => {
        setOcrElements(data.elements || []);
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع أثناء معالجة الصورة.");
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  // Clear previews & automatically translate when target language or tone switches if image loaded
  useEffect(() => {
    if (imagePreview) {
      handleImageTranslate();
    }
  }, [targetLang, tone]);

  return (
    <div className="space-y-6">
      {/* Target Language and Tone Selection Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4.5 rounded-2xl bg-sky-50/40 dark:bg-[#10192C] border border-sky-100/85 dark:border-sky-950/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <span className="text-sm font-black text-sky-950 dark:text-sky-200 whitespace-nowrap">
              ترجمة نصوص الصورة:
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-3xs sm:text-2xs font-bold text-sky-950/70 dark:text-sky-200/70 whitespace-none sm:whitespace-nowrap">الكود المترجم إلى:</span>
              <select
                id="image-target-lang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-white dark:bg-[#070F1E] py-2 px-3.5 rounded-xl border border-sky-150 dark:border-sky-900/60 text-xs text-sky-950 dark:text-sky-205 font-bold focus:ring-2 focus:ring-sky-500/20 focus:outline-none cursor-pointer"
              >
                {LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
                  <option key={l.code} value={l.code} className="dark:bg-[#070F1E] dark:text-sky-200">
                    {l.flag} {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-3xs sm:text-2xs font-bold text-sky-950/70 dark:text-sky-200/70 whitespace-none sm:whitespace-nowrap">منظور النبرة / الأسلوب:</span>
              <select
                id="image-translation-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-white dark:bg-[#070F1E] py-2 px-3.5 rounded-xl border border-sky-150 dark:border-sky-900/60 text-xs text-sky-950 dark:text-sky-205 font-bold focus:ring-2 focus:ring-sky-500/20 focus:outline-none cursor-pointer"
              >
                <option value="standard" className="dark:bg-[#070F1E] dark:text-sky-200">عادي / متوازن</option>
                <option value="formal" className="dark:bg-[#070F1E] dark:text-sky-200">رسمي / أكاديمي</option>
                <option value="casual" className="dark:bg-[#070F1E] dark:text-sky-200">عامي / ودي للدردشة</option>
                <option value="poetic" className="dark:bg-[#070F1E] dark:text-sky-200">بليغ / شاعري وأدبي</option>
              </select>
            </div>
          </div>
        </div>

        {/* Helpful text indication of selected tone */}
        <div className="hidden lg:flex items-center gap-1.5 text-3xs font-black text-sky-650 dark:text-sky-450 bg-sky-500/10 dark:bg-sky-950/30 px-3 py-1.5 rounded-xl border border-sky-100/35 dark:border-sky-900/20">
          <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse animate-duration-1000" />
          <span>
            {tone === "poetic" ? "سيتم توليد ترجمة بليغة مليئة بالصياغة الإبداعية والشعرية." :
             tone === "formal" ? "ترجمة رسمية ورصينة تليق بالبيانات والمستندات المهنية." :
             tone === "casual" ? "ترجمة مبسطة وتعبيرات عامية ودية مألوفة." :
             "الترجمة المعتادة بدقة التراكيب الفصحى المتوازنة."}
          </span>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Area: Uplader / Player & Overlays */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {error && (
            <TranslationError error={error} onRetry={imagePreview ? handleImageTranslate : undefined} />
          )}

          {cameraError && (
            <TranslationError error={cameraError} onRetry={startCamera} />
          )}
          
          {/* UPLOAD & STREAM CONTAINER */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center justify-center min-h-[410px] overflow-hidden group shadow-sm ${
              isDragActive
                ? "border-solid border-sky-500 dark:border-sky-400 bg-sky-50/70 dark:bg-sky-950/30 scale-[1.015] shadow-lg shadow-sky-500/10 ring-4 ring-sky-500/10"
                : "border-dashed border-sky-150 dark:border-sky-950/65 hover:border-sky-400 dark:hover:border-sky-500 bg-white dark:bg-[#030A16] hover:shadow-md hover:shadow-sky-500/5 hover:scale-[1.005]"
            }`}
          >
            {/* Ambient Background Glows for Premium Vibe */}
            <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-40 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-sky-400/30 blur-3xl animate-pulse" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />
            </div>
            {/* Upload Progress Loader State */}
            <AnimatePresence>
              {uploadProgress !== null && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 dark:bg-[#030A16]/95 backdrop-blur-md p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.92, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.92, y: 15 }}
                    transition={{ type: "spring", stiffness: 150, damping: 20 }}
                    className="w-full max-w-xs space-y-6 text-center animate-pulse"
                  >
                    <div className="relative inline-flex items-center justify-center">
                      {/* Decorative outer spinning gradient ring */}
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute w-20 h-20 rounded-full border-2 border-dashed border-sky-550/30 dark:border-sky-400/30"
                      />
                      
                      {/* Animated processing icon container with premium transition */}
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                        className="relative p-5 rounded-full bg-gradient-to-tr from-sky-500 to-sky-400 text-white shadow-xl shadow-sky-500/20 z-10"
                      >
                        <Upload className="w-8 h-8" />
                      </motion.div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <h4 className="text-base font-black text-sky-950 dark:text-sky-105 tracking-tight">
                        جاري رفع وتحليل الصورة...
                      </h4>
                      <p className="text-2xs text-[#4E696E] dark:text-sky-300/80 font-bold leading-relaxed max-w-[245px] mx-auto">
                        الرجاء الانتظار، جاري تهيئة وفحص نصوص ومواقع الكلمات بالكامل
                      </p>
                    </div>

                    {/* Elegant progress track with micro shadow and glow */}
                    <div className="space-y-2">
                      <div className="relative w-full h-3 bg-sky-100/50 dark:bg-sky-950/80 rounded-full overflow-hidden border border-sky-200/50 dark:border-sky-900/40 p-[1px] shadow-inner">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-500 dark:to-sky-450 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.35)]"
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ type: "spring", stiffness: 100, damping: 18 }}
                        />
                      </div>
                      <div className="flex items-center justify-between px-1 text-xs font-black text-sky-600 dark:text-sky-300">
                        <span className="font-mono">{uploadProgress}%</span>
                        <span className="text-3xs tracking-wider opacity-75">PROCESSING</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drag Overlay visual feedback */}
            <AnimatePresence>
              {isDragActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-25 pointer-events-none flex flex-col items-center justify-center bg-sky-100/30 dark:bg-sky-950/20 backdrop-blur-xs p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.88, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.88, y: 15 }}
                    transition={{ type: "spring", damping: 15, stiffness: 140 }}
                    className="p-6 rounded-3xl bg-white/95 dark:bg-[#070F1E]/95 border-2 border-dashed border-sky-500 dark:border-sky-400 flex flex-col items-center gap-4 max-w-xs text-center shadow-2xl shadow-sky-500/10"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.14, 1] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                      className="p-4 rounded-full bg-sky-100 dark:bg-[#13223D] text-sky-500 dark:text-sky-300 shadow-md shadow-sky-500/5"
                    >
                      <Upload className="w-9 h-9" />
                    </motion.div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-sky-950 dark:text-sky-100 tracking-tight">
                        أفلت الصورة هنا الآن!
                      </h4>
                      <p className="text-[11px] text-sky-6500 dark:text-sky-300/80 leading-relaxed font-extrabold text-sky-600">
                        سيبدأ فحص النصوص والترجمة الفورية فوراً تلقائياً
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Camera View */}
            <AnimatePresence>
              {isCameraActive && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-10 flex flex-col bg-black"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-5 inset-x-0 mx-auto flex items-center justify-center gap-4 z-20">
                    <button
                      onClick={captureSnapshot}
                      className="p-4 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg active:scale-95 transition-all cursor-pointer hover:shadow-sky-500/40"
                      title="التقاط لقطة"
                    >
                      <Camera className="w-6 h-6 animate-pulse" />
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-350 hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                      إلغاء الكاميرا
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Default State: No Image Loaded */}
            {!imagePreview && !isCameraActive ? (
              <div className="p-8 text-center text-sky-800/80 dark:text-sky-200/80 space-y-5 max-w-sm z-10">
                <div className="inline-flex p-4.5 rounded-2xl bg-sky-100 dark:bg-[#13223D] text-sky-500 dark:text-sky-300 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="w-10 h-10" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-sky-950 dark:text-sky-100 tracking-tight">
                    اسحب وأفلت صورتك هنا
                  </h4>
                  <p className="text-xs text-sky-600/90 dark:text-sky-305/70 font-semibold leading-relaxed">
                    أو تصفح الملفات من جهازك للترجمة المباشرة للعلامات والملصقات والنصوص
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={triggerSearch}
                    className="px-4 py-2.5 text-xs font-black rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/10 cursor-pointer transition-all active:scale-95 hover:scale-[1.03]"
                  >
                    اختر صورة
                  </button>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-sky-50/70 hover:bg-sky-100 dark:bg-[#10192C] dark:hover:bg-[#13223D] text-sky-600 dark:text-sky-300 border border-sky-150 dark:border-transparent cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 hover:scale-[1.03]"
                  >
                    <Camera className="w-4 h-4" />
                    التقط بالكاميرا
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              /* Image Loaded with Overlays & OCR Visual layout */
              imagePreview && (
                <div 
                  className="relative w-full h-full flex items-center justify-center p-3"
                  onClick={() => setSelectedBlockId(null)}
                >
                  <div className="relative inline-block max-w-full overflow-hidden rounded-xl border border-sky-150 dark:border-sky-950/65 shadow-lg">
                    {/* Background original image */}
                    <img
                      src={imagePreview}
                      alt="نص مراد ترجمته"
                      className="max-h-[500px] object-contain max-w-full block"
                      referrerPolicy="no-referrer"
                    />

                    {/* OCR Translations Bounding Box Layer */}
                    {showOverlays && (
                      <AnimatePresence>
                        {ocrElements.map((el, index) => {
                          const style = blockStyles[index] || {};
                          return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.25, delay: Math.min(index * 0.012, 0.45) }}
                            dir="auto"
                            onMouseEnter={() => setActiveHoverId(index)}
                            onMouseLeave={() => setActiveHoverId(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBlockId(index);
                            }}
                            className={`absolute flex items-center justify-center p-1 border transition-all rounded-sm leading-tight text-center break-words select-none text-2xs ${
                              selectedBlockId === index 
                                ? "bg-sky-500 border-sky-300 text-white z-40 ring-2 ring-sky-400 shadow-xl cursor-default"
                                : activeHoverId === index
                                ? "bg-sky-500 border-sky-400 text-white z-30 scale-102 shadow-lg cursor-pointer"
                                : theme === "dark"
                                ? "bg-[#030A16]/95 border-sky-950/60 text-sky-100 shadow-3xs cursor-pointer hover:border-sky-700/50"
                                : "bg-sky-50/95 border-sky-300/40 text-sky-950 shadow-3xs cursor-pointer hover:bg-sky-100"
                            }`}
                            style={{
                              left: `${el.x}%`,
                              top: `${el.y}%`,
                              width: `${el.width}%`,
                              height: `${el.height}%`,
                              fontSize: `calc(min(3vw, 12px) * ${style.fontSize || 1})`,
                              fontWeight: style.bold ? '900' : 'bold',
                              fontStyle: style.italic ? 'italic' : 'normal',
                            }}
                          >
                            <span className="truncate">{el.translatedText}</span>

                            {/* Float hovering details widget */}
                            <AnimatePresence>
                              {activeHoverId === index && selectedBlockId !== index && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  transition={{ type: "spring", stiffness: 180, damping: 16 }}
                                  className="absolute top-full right-0 mt-1.5 w-60 p-2.5 rounded-lg bg-[#070F1E] text-white text-xs border border-sky-950 shadow-xl z-50 text-right space-y-1.5"
                                >
                                  <div>
                                    <span className="text-3xs text-[#4E696E] block font-bold">النص الأصلي المُكتشف:</span>
                                    <span className="font-semibold">{el.originalText}</span>
                                  </div>
                                  <div className="border-t border-sky-950/50 pt-1">
                                    <span className="text-3xs text-sky-400 block font-bold">الترجمة الفورية:</span>
                                    <span className="text-sky-200 font-black">{el.translatedText}</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )})}
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Dynamic background processing load screen with futuristic scan line & multi-stage indicators */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-[#020813]/90 backdrop-blur-sm z-20 p-4 sm:p-6"
                      >
                        {/* Dynamic Sweep Beam */}
                        <motion.div 
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent z-10 opacity-85 shadow-[0_0_15px_#0EA5E9]"
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                        />

                        <motion.div 
                          initial={{ scale: 0.94, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.94, y: 20 }}
                          transition={{ type: "spring", stiffness: 190, damping: 22 }}
                          className="w-full max-w-md bg-slate-900/96 border border-slate-800/90 rounded-3xl p-5 sm:p-6.5 shadow-2xl space-y-6 text-right backdrop-blur-md"
                        >
                          {/* Heading info */}
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                            <span className="text-[10px] font-mono font-black text-sky-400 bg-sky-950/60 border border-sky-900/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              AI Vision Engine v2
                            </span>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-white">معالجة وتوطين مضلع المستند</h4>
                              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                            </div>
                          </div>

                          {/* 3 Sophisticated Independent Progress Tracks */}
                          <div className="space-y-4">
                            {[
                              { 
                                id: 0, 
                                title: "1. تهيئة ورفع الصورة (Buffering)", 
                                desc: "تعديل الموازنة، قراءة بكسلات العرض وحجم الصورة", 
                                progress: Math.min(100, Math.max(0, Math.round((imagesSimulatedProgress / 35) * 100))),
                                barColor: "from-indigo-600 via-indigo-400 to-sky-500",
                                glowColor: "indigo",
                                icon: ImageIcon
                              },
                              { 
                                id: 1, 
                                title: "2. المعالجة البصرية للأحرف (OCR)", 
                                desc: "تحديد إحداثيات ومواقع الكلمات وتفسير الفراغات", 
                                progress: imagesSimulatedProgress < 35 ? 0 : Math.min(100, Math.max(0, Math.round(((imagesSimulatedProgress - 35) / (72 - 35)) * 100))),
                                barColor: "from-amber-600 via-amber-400 to-sky-450",
                                glowColor: "amber",
                                icon: Cpu
                              },
                              { 
                                id: 2, 
                                title: "3. الصيانة ومحاذاة الترجمة (Translation)", 
                                desc: "توليد الصياغة التعبيرية ومطابقة العبارات في موضعها", 
                                progress: imagesSimulatedProgress < 72 ? 0 : Math.min(100, Math.max(0, Math.round(((imagesSimulatedProgress - 72) / (96 - 72)) * 100))),
                                barColor: "from-emerald-600 via-emerald-400 to-teal-400",
                                glowColor: "emerald",
                                icon: Globe
                              }
                            ].map((st) => {
                              const isActive = imagesLoadingStage === st.id;
                              const isCompleted = imagesLoadingStage > st.id;
                              const StepIcon = st.icon;

                              return (
                                <div 
                                  key={st.id} 
                                  className={`p-3 rounded-2xl border transition-all duration-300 ${
                                    isActive 
                                      ? "bg-slate-950 border-slate-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                                      : isCompleted
                                      ? "bg-slate-900/40 border-slate-850/60 opacity-80"
                                      : "bg-transparent border-transparent opacity-40"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    {/* Action Percentage */}
                                    <span className={`font-mono text-xs font-black shrink-0 ${
                                      isActive ? "text-sky-400" : isCompleted ? "text-emerald-400" : "text-slate-600"
                                    }`}>
                                      {st.progress}%
                                    </span>

                                    {/* Description and Title */}
                                    <div className="flex-1 text-right min-w-0">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className={`text-[11px] font-black leading-tight ${
                                          isActive ? "text-white" : isCompleted ? "text-slate-300" : "text-slate-500"
                                        }`}>
                                          {st.title}
                                        </span>
                                        <StepIcon className={`w-3.5 h-3.5 shrink-0 ${
                                          isActive ? "text-sky-400 animate-bounce" : isCompleted ? "text-emerald-400" : "text-slate-600"
                                        }`} />
                                      </div>
                                      <p className="text-[10px] text-slate-500 truncate leading-relaxed mt-0.5">
                                        {st.desc}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Custom individual stage track bar */}
                                  <div className="relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850/50 shadow-inner">
                                    <motion.div 
                                      className={`h-full rounded-full bg-gradient-to-r ${st.barColor}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${st.progress}%` }}
                                      transition={{ ease: "easeOut", duration: 0.15 }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Unified Bottom Total Overview Panel */}
                          <div className="pt-3 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 select-none">
                              <span className="font-mono text-sky-400 font-extrabold text-xs">{imagesSimulatedProgress}%</span>
                              <span className="text-slate-500 uppercase font-bold tracking-widest text-[9px]">التقدم الكلي لمعالجة المستند</span>
                            </div>
                            
                            <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-850/60 shadow-inner">
                              <motion.div 
                                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 shadow-[0_0_10px_#38bdf8]"
                                initial={{ width: 0 }}
                                animate={{ width: `${imagesSimulatedProgress}%` }}
                                transition={{ ease: "easeOut", duration: 0.15 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            )}
          </div>

          {/* Bottom Action bar */}
          {imagePreview && (
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 mt-4 bg-sky-50/40 dark:bg-[#10192C]/90 border border-sky-150 dark:border-sky-950/60 p-3 rounded-xl shadow-3xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={clearImage}
                  className="p-2.5 rounded-lg bg-white dark:bg-[#070F1E] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowOverlays(!showOverlays)}
                  className="p-2.5 rounded-lg bg-white dark:bg-[#070F1E] text-sky-500 dark:text-sky-305 hover:bg-sky-50 dark:hover:bg-[#13223D]/80 border border-sky-150 dark:border-sky-950/65 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs"
                >
                  {showOverlays ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="hidden sm:inline">{showOverlays ? "إخفاء التراكيب" : "رسم النصوص OCR"}</span>
                </button>
                <button
                  onClick={handleDownloadAnnotatedImage}
                  className="p-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md hover:shadow-lg"
                  title="تنزيل الصورة مع نصوص الترجمة"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">حفظ الصورة</span>
                </button>
                <button
                  onClick={() => {
                    const content = ocrElements.map(el => el.translatedText).join("\n\n");
                    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `translation_image_${Date.now()}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md hover:shadow-lg"
                  title="حفظ نصوص الترجمة كملف (TXT)"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">حفظ كنص TXT</span>
                </button>
              </div>

              {selectedBlockId !== null ? (
                <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in_200">
                  <div className="flex items-center gap-1 px-1">
                    <Type className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-2xs text-slate-500 font-bold ml-1">تحرير الكتلة #{selectedBlockId + 1}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  <button 
                    onClick={() => toggleStyle(selectedBlockId, 'bold')} 
                    className={`p-1.5 rounded-md transition-colors ${blockStyles[selectedBlockId]?.bold ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    title="عريض (Bold)"
                  >
                    <Bold className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={() => toggleStyle(selectedBlockId, 'italic')} 
                    className={`p-1.5 rounded-md transition-colors ${blockStyles[selectedBlockId]?.italic ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    title="مائل (Italic)"
                  >
                    <Italic className="w-4 h-4"/>
                  </button>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  <button 
                    onClick={() => changeFontSize(selectedBlockId, 0.2)} 
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                    title="تكبير الخط"
                  >
                    <ZoomIn className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={() => changeFontSize(selectedBlockId, -0.2)} 
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                    title="تصغير الخط"
                  >
                    <ZoomOut className="w-4 h-4"/>
                  </button>
                </div>
              ) : (
                <div className="text-2xs text-[#4E696E] dark:text-sky-300 font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
                  <span>انقر على الكتلة لتنسيق النص وتغيير المظهر</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Area: List of Extracted Paragraphs */}
        <div className="lg:col-span-4 bg-sky-50/20 dark:bg-[#10192C]/30 border border-sky-150 dark:border-sky-950/60 rounded-[2rem] p-4 min-h-[400px] flex flex-col shadow-3xs animate-fade-in_500">
          <div className="flex items-center gap-2 border-b border-sky-100 dark:border-sky-950/60 pb-3 mb-3">
            <Layers className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <h4 className="text-xs font-black text-sky-950 dark:text-sky-200">تجزئة النصوص والترجمة</h4>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-sky-400/80">
                <RefreshCw className="w-6 h-6 text-sky-500 animate-spin" />
                <p className="text-xs mt-3 font-semibold">جاري استخراج النصوص والموقع الجغرافي للكتل...</p>
              </div>
            ) : ocrElements.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {ocrElements.map((el, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -25 }}
                    transition={{ type: "spring", stiffness: 140, damping: 18, delay: Math.min(i * 0.02, 0.4) }}
                    dir="auto"
                    className={`p-3 rounded-xl border text-right transition-all text-xs space-y-1.5 shadow-3xs hover:border-sky-405/60 cursor-pointer ${
                      activeHoverId === i
                        ? "bg-sky-50/50 dark:bg-[#13223D]/60 border-sky-305 scale-[1.02] shadow-sm"
                        : "bg-white dark:bg-[#070F1E] border-sky-100/80 dark:border-sky-950"
                    }`}
                    onMouseEnter={() => setActiveHoverId(i)}
                    onMouseLeave={() => setActiveHoverId(null)}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1 border-b border-sky-50 dark:border-transparent pb-1">
                      <span className="text-3xs font-mono px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-500 dark:text-sky-300 font-black">
                        كتلة #{i + 1}
                      </span>
                      <span className="text-2xs text-[#4E696E] dark:text-sky-300 font-semibold">الموقع: ({el.x}%, {el.y}%)</span>
                    </div>
                    <div>
                      <span className="text-3xs text-[#4E696E] dark:text-sky-300 block font-bold">النص الأصلي:</span>
                      <p className="text-sky-500 dark:text-sky-300 leading-relaxed italic">{el.originalText}</p>
                    </div>
                    <div className="pt-1">
                      <span className="text-3xs text-sky-500 dark:text-sky-305 block font-bold">الترجمة العربية:</span>
                      <p className="text-sky-950 dark:text-sky-100 font-black leading-relaxed">{el.translatedText}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-sky-400/80 space-y-2">
                <ImageIcon className="w-8 h-8 opacity-60 text-sky-550" />
                <p className="text-xs font-semibold leading-relaxed">
                  بمجرد استيراد الصورة وفحصها بالذكاء الاصطناعي، سيتم عرض الكتل والفقرات المكتشفة هنا بشكل طردي مفصّل.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
