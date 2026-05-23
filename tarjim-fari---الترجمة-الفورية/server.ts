import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON parsing with appropriate limits to handle image and audio base64 data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini API client using the correct SDK configuration
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,

    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn(
    "⚠️ GEMINI_API_KEY is not configured or still holding placeholder. Using structured mockup engine instead.",
  );
}

app.get("/api/status", (req, res) => {
  res.json({ apiKeyConfigured: !!ai });
});

async function callWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 2000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (err: any) {
      const errMsg = err.message || "";
      if (err.status === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("credits are depleted")) {
        throw new Error("لقد نفد الرصيد أو تجاوزت الحد المسموح به لمفتاح API الخاص بك. يرجى مراجعة إعدادات فاتورة Google AI Studio (RESOURCE_EXHAUSTED).");
      }
      if (attempt === maxRetries) {
        throw err;
      }
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[Retry] Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

// 1.a Text Grammar Check API
app.post("/api/check-grammar", async (req, res) => {
  try {
    const { text, sourceLang } = req.body;

    if (!text) {
      return res.status(400).json({ error: "الرجاء إدخال النص" });
    }

    if (!ai) {
      return res.json({
        correctedText: text,
        changes: [],
      });
    }

    const languageStr = sourceLang && sourceLang !== "auto" ? `in ${sourceLang}` : "";
    const prompt = `You are an expert proofreader. Review the following text ${languageStr} for grammar, spelling, and punctuation errors. 
Ensure the meaning remains exactly the same.
Return ONLY a valid JSON object. Do not wrap it in markdown block.

Text to review:
"${text}"`;

    const response = await callWithRetry(() =>
      ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctedText: {
                type: Type.STRING,
                description:
                  "The full text with corrections applied. If no corrections, return original text.",
              },
              changes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    error: {
                      type: Type.STRING,
                      description: "The original incorrect word or phrase.",
                    },
                    suggestion: {
                      type: Type.STRING,
                      description: "The corrected word or phrase.",
                    },
                    reason: {
                      type: Type.STRING,
                      description:
                        "Explanation of the grammar or spelling rule in Arabic.",
                    },
                  },
                  required: ["error", "suggestion", "reason"],
                },
                description:
                  "Array of detailed corrections. Empty array if no changes.",
              },
            },
            required: ["correctedText", "changes"],
          },
        },
      })
    );

    const outputText = response.text || "{}";
    const data = JSON.parse(outputText);

    res.json(data);
  } catch (error) {
    console.error("Text grammar check error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء فحص وتصحيح النص." });
  }
});

// 1.b Text Translation API
app.post("/api/translate-text", async (req, res) => {
  try {
    const { text, sourceLang, targetLang, tone = "standard" } = req.body;

    if (!text) {
      return res
        .status(400)
        .json({ error: "الرجاء إدخال النص المطلوب ترجمته." });
    }

    // Default simulated detection values
    let guessedLang = "en";
    let guessedConfidence = 85;
    let altGuessed: any[] = [
      { code: "fr", confidence: 10 },
      { code: "es", confidence: 5 },
    ];

    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (hasArabic) {
      guessedLang = "ar";
      guessedConfidence = 98;
      altGuessed = [
        { code: "en", confidence: 1 },
        { code: "ru", confidence: 1 },
      ];
    } else {
      const lower = text.toLowerCase();
      if (lower.includes("hola") || lower.includes("gracias")) {
        guessedLang = "es";
        guessedConfidence = 95;
        altGuessed = [
          { code: "it", confidence: 4 },
          { code: "fr", confidence: 1 },
        ];
      } else if (lower.includes("bonjour") || lower.includes("merci")) {
        guessedLang = "fr";
        guessedConfidence = 96;
        altGuessed = [
          { code: "es", confidence: 3 },
          { code: "it", confidence: 1 },
        ];
      } else if (lower.includes("hallo") || lower.includes("danke")) {
        guessedLang = "de";
        guessedConfidence = 94;
        altGuessed = [
          { code: "en", confidence: 4 },
          { code: "tr", confidence: 2 },
        ];
      }
    }

    if (!ai) {
      const simulatedText = `[ترجمة محاكاة - يرجى تفعيل مفتاح API في الإعدادات]\nالنص الأصلي: ${text}\nاللغة المصدر المتوقعة: ${guessedLang} (بثقة %${guessedConfidence})\nاللغة الهدف: ${targetLang}\nالأسلوب: ${tone}`;
      return res.json({
        translatedText: simulatedText,
        pronunciation: "Simulated Pronunciation (Please set API Key)",
        alternatives: [
          `بديل بسيط: ${text} المترجم`,
          `بديل احترافي: ترجمة مخصصة لـ ${text}`,
        ],
        detection: {
          detectedLanguage: guessedLang,
          confidence: guessedConfidence,
          alternatives: altGuessed,
        },
      });
    }

    const prompt = `You are a professional human translator and language classifier. Translate the following text from ${sourceLang || "auto-detected language"} to ${targetLang} using ${tone} tone.
    First, analyze and detect the language of the source text. Provide the most likely language code from: ar, en, es, fr, de, it, tr, zh, ja, ru, and its confidence score (integer 0-100).
    Also provide up to 2 alternative possible languages with their confidence scores.
    Then, translate the text. If pronunciation or transliteration can be provided for the target translation, offer it too.
    Also, please provide 2 alternative translations which might fit different contexts.
    
    Text to translate:
    """
    ${text}
    """
    
    Output your response in the following JSON schema strictly:
    {
      "translatedText": "the direct translation in targetLang",
      "pronunciation": "how to read/pronounce the translated text (optional transliteration, or null if targetLang is easy)",
      "alternatives": ["alternative translation 1", "alternative translation 2"],
      "detection": {
        "detectedLanguage": "the code of the most likely source language, e.g. en, ar, es...",
        "confidence": 95, // percentage integer between 0 and 100
        "alternatives": [
          { "code": "alternative code 1", "confidence": 3 },
          { "code": "alternative code 2", "confidence": 2 }
        ]
      }
    }`;

    const response = await callWithRetry(() => 
      ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: { type: Type.STRING },
              pronunciation: { type: Type.STRING },
              alternatives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              detection: {
                type: Type.OBJECT,
                properties: {
                  detectedLanguage: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  alternatives: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        code: { type: Type.STRING },
                        confidence: { type: Type.INTEGER },
                      },
                      required: ["code", "confidence"],
                    },
                  },
                },
                required: ["detectedLanguage", "confidence"],
              },
            },
            required: ["translatedText"],
          },
        },
      })
    );

    const result = JSON.parse(response.text || "{}");
    res.json({
      translatedText: result.translatedText,
      pronunciation: result.pronunciation || null,
      alternatives: result.alternatives || [],
      detection: result.detection || {
        detectedLanguage: guessedLang,
        confidence: guessedConfidence,
        alternatives: altGuessed,
      },
    });
  } catch (error: any) {
    console.error("Error in translate-text API:", error);
    res.status(500).json({
      error: "عذراً، حدث خطأ أثناء الاتصال بخادم الترجمة: " + error.message,
    });
  }
});

// 2. Image OCR + Translation API
app.post("/api/translate-pdf", async (req, res) => {
  try {
    const { pdfData, targetLang, tone = "standard" } = req.body;

    if (!pdfData) {
      return res.status(400).json({ error: "الرجاء رفع ملف PDF صالح." });
    }

    const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, "");

    if (!ai) {
      return res.json({
        elements: [
          {
            originalText: "Document Title",
            translatedText:
              tone === "poetic"
                ? "عنوان المخطوطة"
                : tone === "formal"
                  ? "عنوان المستند الرئيسي"
                  : "عنوان الملف",
            x: 20,
            y: 10,
            width: 60,
            height: 10,
          },
          {
            originalText:
              "First paragraph of the document explaining the contents and providing an introduction.",
            translatedText:
              tone === "poetic"
                ? "يبدأ سرد هذا النص بالتمهيد لما سيأتي من معاني عظيمة ومحتويات فريدة..."
                : tone === "formal"
                  ? "الفقرة الأولى من المستند توضح المحتويات وتوفر مقدمة..."
                  : "الفقرة الأولى تشرح المحتوى وتعطي مقدمة...",
            x: 10,
            y: 30,
            width: 80,
            height: 20,
          },
        ],
        message:
          "تم عرض بيانات افتراضية. يرجى تهيئة مفتاح API لترجمة الملف الحقيقي.",
      });
    }

    const pdfInstruction = `You are a top-tier document translation machinery. 
    Read every piece of text in this document, translate it accurately to ${targetLang} using a ${tone} tone.
    Also, detect the relative position of each text block on its page.
    Express the position bounding boxes as percentages relative to the page dimensions.
    x is % from left, y is % from top, width is % width, height is % height.
    Include ONLY blocks that have meaningful text.
    
    Output JSON of elements matching the schema EXACTLY. Default targetLang to Arabic ("العربية") if not pre-specified.`;

    const tempFilePath = path.join(os.tmpdir(), `doc-${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, "base64"));

    let uploadedFile: any;
    try {
      uploadedFile = await ai.files.upload({
        file: tempFilePath,
        mimeType: "application/pdf",
      });
    } catch (err: any) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      throw new Error("فشل رفع المستند إلى خوادم جيميناي: " + err.message);
    }

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    let fileInfo = await ai.files.get({ name: uploadedFile.name });
    while (fileInfo.state === "PROCESSING") {
      await new Promise((r) => setTimeout(r, 2000));
      fileInfo = await ai.files.get({ name: uploadedFile.name });
    }

    if (fileInfo.state === "FAILED") {
      throw new Error("حدث خطأ في الخادم الذكي أثناء معالجة المستند.");
    }

    const response = await callWithRetry(() =>
      ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [uploadedFile, pdfInstruction],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              elements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalText: { type: Type.STRING },
                    translatedText: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    width: { type: Type.INTEGER },
                    height: { type: Type.INTEGER },
                  },
                  required: [
                    "originalText",
                    "translatedText",
                    "x",
                    "y",
                    "width",
                    "height",
                  ],
                },
              },
            },
            required: ["elements"],
          },
        },
      })
    );

    const result = JSON.parse(response.text || "{}");
    
    // Clean up uploaded file
    try {
      if (uploadedFile) {
        await ai.files.delete({ name: uploadedFile.name });
      }
    } catch (cleanupErr) {
      console.warn("Failed to clean up PDF from Gemini servers:", cleanupErr);
    }
    
    res.json({ elements: result.elements || [] });
  } catch (error: any) {
    console.error("Error in translate-pdf API:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء معالجة وترجمة الملف: " + error.message });
  }
});

// 2. Image OCR + Translation API
app.post("/api/translate-image", async (req, res) => {
  try {
    const {
      imageData,
      mimeType = "image/jpeg",
      targetLang,
      tone = "standard",
    } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: "الرجاء رفع صورة صالحة للترجمة." });
    }

    // Strip out base64 prefixes if present (e.g., data:image/png;base64,)
    const base64Data = imageData.replace(/^data:[a-zA-Z0-9/-]+;base64,/, "");

    if (!ai) {
      // Return beautiful mock coordinates on a placeholder image so that interface still showcases gorgeous OCR overlaps
      return res.json({
        elements: [
          {
            originalText: "Hello World",
            translatedText:
              tone === "poetic"
                ? "أهلاً ومرحباً بك في أرجاء الوجود الجميل"
                : tone === "formal"
                  ? "تحية طيبة وبعد، مرحباً بكم في العالم"
                  : tone === "casual"
                    ? "أهلاً وسهلاً بالجميع في العالم"
                    : "أهلاً بك في العالم",
            x: 15,
            y: 20,
            width: 50,
            height: 10,
          },
          {
            originalText: "Instant AI Image Translation",
            translatedText:
              tone === "poetic"
                ? "ترجمة الصور بسحر الإدراك وتجلي الخيال"
                : tone === "formal"
                  ? "الخدمة الرسمية للترجمة الفورية للصور"
                  : tone === "casual"
                    ? "ترجمة سريعة للصور بالذكاء الاصطناعي"
                    : "الترجمة الفورية للصور بالذكاء الاصطناعي",
            x: 10,
            y: 45,
            width: 80,
            height: 12,
          },
          {
            originalText: "Upload photos to translate text in place",
            translatedText:
              tone === "poetic"
                ? "ارفع روائع الصور لتنبت الحروف المعربة في مكانها"
                : tone === "formal"
                  ? "يرجى تحميل المستندات المصورة ليتم استبدال النصوص بمواضعها المعتمدة"
                  : tone === "casual"
                    ? "نزل صورك عشان تترجم الكلام مكانه علطول"
                    : "ارفع الصور لترجمة النصوص في مكانها تلقائياً",
            x: 15,
            y: 70,
            width: 70,
            height: 10,
          },
        ],
        message:
          "تم عرض ترجمة افتراضية لإيضاح الميزة. الرجاء تهيئة مفتاح API لترجمة الصورة حقيقياً.",
      });
    }

    const imageInstruction = `You are a top-tier visual OCR and translation machinery with perfect Arabic language support (RTL).
    Read every piece of text visible in this image. Ensure you can accurately recognize and extract Arabic text without disjointed letters, then translate it accurately to ${targetLang} using a ${tone} tone (where standard is default, formal is professional/academic, casual is friendly/informal, and poetic is literary/beautiful), and detect its relative visual position in the image.
    Crucially, express the position bounding boxes as percentages relative to the image size.
    For example, x=10 means the text starts at 10% from the left edge of the image width.
    y=15 means it begins at 15% from the top edge of the image height.
    width=50 means the box occupies 50% of the image width.
    height=8 means the box occupies 8% of the image height.
    Include ONLY blocks that have actual meaningful text.
    
    Output JSON of elements matching the schema EXACTLY. Default targetLang to Arabic ("العربية") if not pre-specified.`;

    const ext = mimeType.split("/")[1]?.split(";")[0] || "jpeg";
    const tempFilePath = path.join(os.tmpdir(), `image-${Date.now()}.${ext}`);
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, "base64"));
    
    let uploadedFile: any;
    try {
      uploadedFile = await ai.files.upload({
        file: tempFilePath,
        mimeType: mimeType,
      });
    } catch (e: any) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      throw new Error("فشل رفع الصورة: " + e.message);
    }
    
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    const response = await callWithRetry(() =>
      ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          uploadedFile,
          imageInstruction,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              elements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalText: { type: Type.STRING },
                    translatedText: { type: Type.STRING },
                    x: {
                      type: Type.INTEGER,
                      description: "X percentage from left (0 to 100)",
                    },
                    y: {
                      type: Type.INTEGER,
                      description: "Y percentage from top (0 to 100)",
                    },
                    width: {
                      type: Type.INTEGER,
                      description: "Width percentage (0 to 100)",
                    },
                    height: {
                      type: Type.INTEGER,
                      description: "Height percentage (0 to 100)",
                    },
                  },
                  required: [
                    "originalText",
                    "translatedText",
                    "x",
                    "y",
                    "width",
                    "height",
                  ],
                },
              },
            },
            required: ["elements"],
          },
        },
      })
    );

    const result = JSON.parse(response.text || "{}");
    
    // Clean up uploaded file
    try {
      if (uploadedFile) {
        await ai.files.delete({ name: uploadedFile.name });
      }
    } catch (cleanupErr) {
      console.warn("Failed to clean up image from Gemini servers:", cleanupErr);
    }
    
    res.json({
      elements: result.elements || [],
    });
  } catch (error: any) {
    console.error("Error in translate-image API:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء فحص وترجمة الصورة: " + error.message });
  }
});

// 3. Media (Audio/Video Speech-to-Text & Translation) API
app.post("/api/translate-media", async (req, res) => {
  try {
    const { mediaData, mimeType, targetLang } = req.body;

    if (!mediaData || !mimeType) {
      return res
        .status(400)
        .json({ error: "الرجاء توفير البيانات الصوتية أو المرئية بشكل صحيح." });
    }

    const base64Data = mediaData.replace(/^data:[a-zA-Z0-9\/-]+;base64,/, "");

    if (!ai || base64Data === "dummy_base64_preset_media") {
      // Simulated interactive subtitles
      return res.json({
        subtitles: [
          {
            startTime: "0:01",
            endTime: "0:04",
            original: "Welcome to our instant video and voice translator.",
            translated: "مرحباً بكم في مترجم الفيديو والصوت الفوري الخاص بنا.",
          },
          {
            startTime: "0:05",
            endTime: "0:09",
            original:
              "This is a demonstration subtitle synced with your media timeline.",
            translated:
              "هذه ترجمة تجريبية متزامنة مع المخطط الزمني للوسائط الخاصة بك.",
          },
          {
            startTime: "0:10",
            endTime: "0:14",
            original:
              "Integrate a real API Key in Gemini Settings to transcribe yours automatically.",
            translated: "قم بدمج مفتاح API حقيقي لنسخ وترجمة ملفاتك تلقائياً.",
          },
        ],
      });
    }

    const mediaInstruction = `You are a professional audio/video translation engine. 
    Analyze the uploaded voice, audio, or video stream. Transcribe what is being said in its native tongue, 
    then translate each statement accurately into ${targetLang}.
    Output the results as a synchronized list of subtitles with precise startTime and endTime markers formatted as 'm:ss' or 'h:mm:ss'.
    
    Respond in JSON matching this schema:
    {
      "subtitles": [
        {
          "startTime": "0:02",
          "endTime": "0:07",
          "original": "Transcript sentence in native tongue",
          "translated": "Translated sentence in ${targetLang}"
        }
      ]
    }`;

    // Write base64 to temp file
    const ext = mimeType.split("/")[1]?.split(";")[0] || "tmp";
    const tempFilePath = path.join(os.tmpdir(), `media-${Date.now()}.${ext}`);
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, "base64"));
    
    let uploadedFile: any;
    try {
      uploadedFile = await ai.files.upload({
        file: tempFilePath,
        mimeType: mimeType,
      });
    } catch (e: any) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      throw new Error("فشل الرفع للملف الاعلامي: " + e.message);
    }
    
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    
    let fileInfo = await ai.files.get({ name: uploadedFile.name });
    while (fileInfo.state === "PROCESSING") {
      await new Promise(r => setTimeout(r, 2000));
      fileInfo = await ai.files.get({ name: uploadedFile.name });
    }
    
    if (fileInfo.state === "FAILED") {
      throw new Error("فشلت عملية معالجة الوسائط على خوادم جيميناي.");
    }

    const response = await callWithRetry(() =>
      ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          uploadedFile,
          mediaInstruction,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtitles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    original: { type: Type.STRING },
                    translated: { type: Type.STRING },
                  },
                  required: ["startTime", "endTime", "original", "translated"],
                },
              },
            },
            required: ["subtitles"],
          },
        },
      })
    );

    const result = JSON.parse(response.text || "{}");
    
    // Clean up uploaded file
    try {
      if (uploadedFile) {
        await ai.files.delete({ name: uploadedFile.name });
      }
    } catch (cleanupErr) {
      console.warn("Failed to clean up media from Gemini servers:", cleanupErr);
    }
    
    res.json({
      subtitles: result.subtitles || [],
    });
  } catch (error: any) {
    console.error("Error in translate-media API:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء نسخ وترجمة ملف الوسائط: " + error.message,
    });
  }
});

// 4. Dictionary Definition API
app.post("/api/dictionary", async (req, res) => {
  try {
    const { word, context, language = "ar" } = req.body;

    if (!word) {
      return res.status(400).json({ error: "الرجاء إدخال الكلمة." });
    }

    if (!ai) {
      return res.json({
        definition: "تعريف محاكى (يرجى إضافة مفتاح API)",
        contextualMeaning: "معنى محاكي السياق: يشير إلى الكلمة في هذا النص",
      });
    }

    const dictInstruction = `You are an expert lexicographer and translator.
    Define the word "${word}" in the context of the sentence: "${context}".
    Provide a quick, concise definition, and its contextual meaning in the target language (${language}).
    
    Output JSON of elements matching the schema EXACTLY.
    {
      "definition": "The general dictionary definition of the word",
      "contextualMeaning": "What the word means exactly in the provided context sentence."
    }`;

    const response = await callWithRetry(() =>
      ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: dictInstruction,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              definition: { type: Type.STRING },
              contextualMeaning: { type: Type.STRING },
            },
            required: ["definition", "contextualMeaning"],
          },
        },
      })
    );

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in dictionary API:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء البحث في القاموس: " + error.message });
  }
});

// Serve frontend assets asynchronously
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🚀 Translation Server is actively serving client on http://localhost:${PORT}`,
    );
  });
}

startServer();
