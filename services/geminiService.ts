
import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

export const generateProductVariation = async (
  base64Image: string,
  mimeType: string,
  prompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        imagePart,
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image was generated in the response.");
};
