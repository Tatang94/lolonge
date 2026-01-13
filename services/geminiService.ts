
import { GoogleGenAI, Type } from "@google/genai";
import { LolongAnalysis } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVideoContent = async (description: string): Promise<LolongAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analisa deskripsi konten video ini dan berikan analisis "LOLONG" (Konten Viral Dahsyat) dalam BAHASA INDONESIA. 
    Kamu adalah kritikus konten paling tajam, berani, dan blak-blakan.
    
    Konten: ${description}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rating: { type: Type.NUMBER, description: "Rating kelolongan dari 1 sampai 10" },
          intensity: { type: Type.STRING, description: "Level intensitas (RENDAH, MENENGAH, TINGGI, EKSTRIM)" },
          roast: { type: Type.STRING, description: "Roasting pedas tapi berkelas tentang kontennya" },
          hype: { type: Type.STRING, description: "Teks penyemangat yang meledak-ledak" },
          suggestedTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["rating", "intensity", "roast", "hype", "suggestedTags"]
      }
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text) as LolongAnalysis;
  } catch (e) {
    console.error("Gagal parsing analisa Lolong", e);
    return {
      rating: 5,
      intensity: 'MENENGAH',
      roast: "Kontennya kurang menggigit, Bos! Coba lagi yang lebih gahar.",
      hype: "GAS TERUS JANGAN KASIH KENDOR!",
      suggestedTags: ["#Lolong", "#ViralDahsyat"]
    };
  }
};
