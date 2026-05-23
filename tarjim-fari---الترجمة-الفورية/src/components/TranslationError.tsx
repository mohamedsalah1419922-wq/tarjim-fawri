import React from "react";
import { 
  AlertCircle, WifiOff, CameraOff, MicOff, RefreshCw, FileWarning, HelpCircle 
} from "lucide-react";

interface TranslationErrorProps {
  error: string | null;
  onRetry?: () => void;
}

export const TranslationError: React.FC<TranslationErrorProps> = ({ error, onRetry }) => {
  if (!error) return null;

  // Classify error to give customized suggestions and icons
  const lowercaseError = error.toLowerCase();
  
  let type: "permission" | "network" | "file" | "browser" | "general" = "general";
  let title = "حدث خطأ غير متوقع";
  let Icon = AlertCircle;
  let suggestions: string[] = [];

  if (
    lowercaseError.includes("ميكروفون") ||
    lowercaseError.includes("كاميرا") ||
    lowercaseError.includes("camera") ||
    lowercaseError.includes("microphone") ||
    lowercaseError.includes("access") ||
    lowercaseError.includes("permission") ||
    lowercaseError.includes("not-allowed") ||
    lowercaseError.includes("أذونات")
  ) {
    type = "permission";
    title = "مشكلة في الوصول المباشر للأجهزة";
    Icon = lowercaseError.includes("ميكروفون") || lowercaseError.includes("microphone") ? MicOff : CameraOff;
    suggestions = [
      "تأكد من إعطاء متصفحك الإذن للوصول إلى الكاميرا أو الميكروفون من إعدادات الأمان (أيقونة القفل في شريط العنوان).",
      "تحقق من أن الكاميرا أو الميكروفون غير قيد الاستخدام حالياً في تطبيق آخر (مثل Zoom أو Google Meet).",
      "تأكد من توصيل الميكروفون/الكاميرا بشكل صحيح بجهازك وتفعيل مفتاح التشغيل المادي إن وُجد."
    ];
  } else if (
    lowercaseError.includes("fetch") ||
    lowercaseError.includes("network") ||
    lowercaseError.includes("server") ||
    lowercaseError.includes("اتصال") ||
    lowercaseError.includes("شبكة") ||
    lowercaseError.includes("الإنترنت") ||
    lowercaseError.includes("فشلت عملية") ||
    lowercaseError.includes("فشل") ||
    lowercaseError.includes("http")
  ) {
    type = "network";
    title = "خطأ في الاتصال بالخادم الذكي";
    Icon = WifiOff;
    suggestions = [
      "يرجى التحقق من اتصال جهازك بشبكة الإنترنت ومن جودة الإشارة المحلية.",
      "قد يكون خادم الذكاء الاصطناعي تحت ضغط شديد مؤقتاً؛ يرجى الانتظار بضع ثوانٍ والمحاولة مرة أخرى.",
      "إذا كنت متصلاً بخدمة شبكة خاصة (VPN)، جرب تعطيلها مؤقتاً فقد تعرقل الاتصال المباشر بالبوابات الفورية."
    ];
  } else if (
    lowercaseError.includes("صيغة") ||
    lowercaseError.includes("ملف") ||
    lowercaseError.includes("متوافق") ||
    lowercaseError.includes("سحب") ||
    lowercaseError.includes("سحبت") ||
    lowercaseError.includes("حجم") ||
    lowercaseError.includes("تالف") ||
    lowercaseError.includes("صورة") ||
    lowercaseError.includes("مقطع") ||
    lowercaseError.includes("file") ||
    lowercaseError.includes("format") ||
    lowercaseError.includes("mime") ||
    lowercaseError.includes("type")
  ) {
    type = "file";
    title = "تعذر قراءة أو معالجة الملف";
    Icon = FileWarning;
    suggestions = [
      "تأكد من أن صيغة الملف المرفوع مدعومة (PNG و JPEG للصور، أو MP3 و MP4 و WAV و M4A للمقاطع الصوتية والمرئية).",
      "تجنب رفع ملفات ذات أحجام ضخمة جداً لتفادي انقطاع الاتصال أثناء الرفع أو التشفير الثنائي.",
      "تأكد من أن الملف سليم تماماً ويعمل محلياً على جهازك قبل محاولة رفعه للترجمة مجدداً."
    ];
  } else if (
    lowercaseError.includes("متصفح") ||
    lowercaseError.includes("مدعومة") ||
    lowercaseError.includes("support") ||
    lowercaseError.includes("browser")
  ) {
    type = "browser";
    title = "ميزة غير مدعومة في المتصفح الحالي";
    Icon = HelpCircle;
    suggestions = [
      "يرجى استخدام أو تحديث متصفح حديث ومتكامل الأركان مثل Google Chrome أو Microsoft Edge أو Apple Safari.",
      "تحقق من عدم وجود إضافات للمتصفح (Extensions) أو أدوات أمان تقوم بحظر واجهات الذكاء الاصطناعي أو حزم المكونات.",
      "تأكد من أن إعدادات نظام التشغيل تسمح بتبادل الأصوات والوسائط المتعددة بشكل طبيعي للتطبيق."
    ];
  } else {
    type = "general";
    title = "تعذر إكمال العملية بنجاح";
    Icon = AlertCircle;
    suggestions = [
      "يرجى مراجعة النص أو الملف المرفق للتأكد من خلوه من أي غموض أو صياغات غير قابلة للقراءة.",
      "جرب تبديل لغات الهدف والبدء بعبارات أو مدخلات أبسط وأكثر وضوحاً لتسهيل الفهم البرمجي.",
      "قد تساعد إعادة تنشيط الصفحة بالكامل (Refresh) في تهيئة مستودع الاتصال الذكي من جديد مع الحل التلقائي."
    ];
  }

  return (
    <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-right space-y-3 animate-fade-in shadow-3xs">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-100/50 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <h4 className="text-xs font-black text-red-700 dark:text-red-300 leading-tight">
            {title}
          </h4>
          <p className="text-2xs text-red-600 dark:text-red-400 font-semibold leading-relaxed">
            {error}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 cursor-pointer text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            title="أعد المحاولة"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعادة محاولة</span>
          </button>
        )}
      </div>

      <div className="border-t border-red-200/40 dark:border-red-900/20 pt-2.5">
        <span className="text-3xs font-black text-red-700 dark:text-red-400 block mb-1">
          💡 خطوات وحلول مقترحة لمعالجة المشكلة:
        </span>
        <ul className="list-disc list-inside space-y-1">
          {suggestions.map((sug, i) => (
            <li key={i} className="text-3xs text-[#7F3434] dark:text-red-300/80 font-medium leading-relaxed pr-1 list-none before:content-['•_'] before:text-red-500/80">
              {sug}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
