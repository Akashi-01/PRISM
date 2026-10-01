import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const pager = await ai.models.list();
for await (const m of pager) {
  if (m.supportedActions?.includes("generateContent")) {
    console.log(m.name);
  }
}