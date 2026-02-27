import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

// Gemini 2.5 Flash - sneller en hogere free tier quota
const TEXT_MODEL = 'gemini-2.5-flash-lite';
const VISION_MODEL = 'gemini-2.5-flash';

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is niet geconfigureerd. Voeg je key toe aan .env.local');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRateLimit = error instanceof Error && (
        error.message.includes('429') ||
        error.message.includes('quota') ||
        error.message.includes('RESOURCE_EXHAUSTED')
      );

      if (isRateLimit && attempt < maxRetries) {
        const delay = (attempt + 1) * 1500;
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function generatePackList(prompt: string): Promise<string> {
  const ai = getGenAI();
  return retryWithBackoff(async () => {
    const model = ai.getGenerativeModel({
      model: TEXT_MODEL,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

export async function analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
  const ai = getGenAI();
  return retryWithBackoff(async () => {
    // Vision model: gebruik TEXT_MODEL (flash-lite) voor snelheid + betrouwbaarheid
    // De 2.5-flash vision kan soms traag zijn of JSON fouten geven
    const model = ai.getGenerativeModel({
      model: VISION_MODEL,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ]);
    const text = result.response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('AI gaf een leeg antwoord. Probeer het opnieuw.');
    }
    return text;
  }, 3);
}
