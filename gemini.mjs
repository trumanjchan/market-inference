import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runGemini() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few words",
  });
  return response.text;
}