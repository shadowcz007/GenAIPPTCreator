
import { GoogleGenAI, Type, setDefaultBaseUrls } from "@google/genai";
import { SlideData, Language } from "../types";

// Configure custom endpoint for Shengsuan Cloud
setDefaultBaseUrls({ geminiUrl: 'https://router.shengsuanyun.com/api' });

const STORAGE_KEY = 'GENAI_API_KEY';

export const getApiKey = (): string => {
  return (localStorage.getItem(STORAGE_KEY) || '').trim();
};

export const setApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, key.trim());
};

// Helper to check for API Key
export const checkAndRequestApiKey = async (): Promise<boolean> => {
  const key = getApiKey();
  return !!key && key.length > 0;
};

export const generatePresentationStructure = async (topic: string, language: Language): Promise<SlideData[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using 2.5 Flash for fast structure generation
    const modelId = "gemini-2.5-flash";
    
    const langInstruction = language === 'zh' ? 'Chinese (Simplified)' : 'English';
    
    const prompt = `
      Create a presentation outline for the topic: "${topic}".
      Generate 5 to 8 slides.
      Output language: ${langInstruction}.
      
      For each slide, provide:
      1. A catchy title (in ${langInstruction}).
      2. 3-4 bullet points of content (concise, in ${langInstruction}).
      3. A highly detailed, descriptive image prompt for an AI image generator. Write this in English.
      4. A layout type. Choose one of the following based on the content function:
         - 'TITLE': Use this ONLY for the first slide (the cover slide).
         - 'CONTENT_RIGHT': Standard content (Text on Left, Image on Right).
         - 'CONTENT_LEFT': Standard content (Image on Left, Text on Right).
         - 'FULL_IMAGE': For slides that need high visual impact or emotional resonance (Image background, Text overlay).
         - 'IMAGE_ONLY': Use this for complex concepts, processes, summaries, or data visualization that require a dedicated infographic.
      
      CRITICAL INSTRUCTION FOR 'IMAGE_ONLY' LAYOUT PROMPTS:
      For slides with 'IMAGE_ONLY' layout, act as a world-class infographic designer. The 'imagePrompt' MUST describe an Explanatory Infographic strictly following these Visual Style Requirements:
      
      1. Art Style: Flat vector illustration, corporate Memphis style, clean lines, minimal shading.
      2. Color Palette: Cream/Off-white background (approx #FDFBF7). Use distinct colors for sections: Mustard Yellow, Teal/Mint, Coral Red, Purple.
      3. Layout: Include a header area with large typography, visual comparison elements, or flowchart-like connections.
      4. Elements: Stylized icons (brains, gears, documents), rounded UI containers, connection lines.
      5. Content: Visualize the specific concept of the slide ("${topic}" or the slide sub-topic) effectively.
      
      Example snippet for IMAGE_ONLY prompt: "Flat vector illustration infographic. Cream background. Header text 'Growth'. A flowchart showing a mustard yellow seed connecting to a teal tree..."
      
      For other layouts ('TITLE', 'FULL_IMAGE', etc.), continue to use high-quality photorealistic, cinematic, or 3D render styles as appropriate for the presentation theme.
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              imagePrompt: { type: Type.STRING },
              layout: { type: Type.STRING, enum: ['TITLE', 'CONTENT_RIGHT', 'CONTENT_LEFT', 'FULL_IMAGE', 'IMAGE_ONLY'] }
            },
            required: ["title", "content", "imagePrompt", "layout"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");

    const rawSlides = JSON.parse(jsonText) as any[];
    
    return rawSlides.map((s, index) => ({
      id: `slide-${Date.now()}-${index}`,
      title: s.title,
      content: s.content,
      imagePrompt: s.imagePrompt,
      layout: s.layout || 'CONTENT_RIGHT', // Default fallback
    }));

  } catch (error) {
    console.error("Error generating structure:", error);
    throw error;
  }
};

export const generateSlideImage = async (imagePrompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  // Create a NEW instance to use the current key
  const ai = new GoogleGenAI({ apiKey });

  try {
    // Using Gemini 3 Pro Image Preview as requested for high quality and text rendering capability
    const modelId = "gemini-3-pro-image-preview";
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K" 
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
