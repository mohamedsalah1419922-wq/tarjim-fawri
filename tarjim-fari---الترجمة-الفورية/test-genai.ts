import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "dummy" });
console.log(Object.keys(ai.files));
console.log(ai.files.upload);
