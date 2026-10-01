import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const MODEL_NAME = process.env.GEMINI_MODEL || DEFAULT_MODEL;

let genAIClient: GoogleGenAI | null = null;

if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('YOUR_GEMINI_API_KEY')) {
  try {
    genAIClient = new GoogleGenAI({ apiKey });
    console.info(`[GeminiClient] Google Gen AI SDK initialized successfully with model: ${MODEL_NAME}`);
  } catch (error) {
    console.warn('[GeminiClient] Failed to initialize Google Gen AI client:', error);
  }
}

/**
 * Returns the active GoogleGenAI instance, or null if unconfigured
 */
export function getGeminiClient(): GoogleGenAI | null {
  return genAIClient;
}

/**
 * Checks if a valid GEMINI_API_KEY has been provided
 */
export function isGeminiConfigured(): boolean {
  return genAIClient !== null;
}

/**
 * Returns the configured Gemini model name
 */
export function getGeminiModelName(): string {
  return MODEL_NAME;
}

/**
 * Helper to execute structured JSON queries using gemini-2.5-flash.
 * If API key is not provided or quota/network fails, falls back to a deterministic generator
 * to guarantee resilience during hackathon live judging.
 */
export async function queryGeminiJson<T>(
  prompt: string,
  systemInstruction: string,
  fallbackGenerator?: () => T
): Promise<{ data: T; source: 'gemini' | 'fallback'; rawResponse?: string }> {
  if (!genAIClient) {
    if (fallbackGenerator) {
      return {
        data: fallbackGenerator(),
        source: 'fallback',
      };
    }
    throw new Error('GEMINI_API_KEY is not configured and no fallback generator was provided.');
  }

  try {
    const response = await genAIClient.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text || '';
    if (!text) {
      throw new Error('Empty response received from Gemini API');
    }

    const parsed = JSON.parse(text) as T;
    return {
      data: parsed,
      source: 'gemini',
      rawResponse: text,
    };
  } catch (error) {
    console.warn('[GeminiClient] Gemini API call failed, falling back to local reasoning:', error);
    if (fallbackGenerator) {
      return {
        data: fallbackGenerator(),
        source: 'fallback',
      };
    }
    throw error;
  }
}
