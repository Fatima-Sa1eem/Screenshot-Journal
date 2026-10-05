import { OllamaParsedResponse } from '@/types/journal';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma:2b';

/**
 * Strips data URI prefixes if present, leaving raw base64
 */
export function cleanBase64Image(dataUriOrBase64: string): string {
  if (dataUriOrBase64.includes('base64,')) {
    return dataUriOrBase64.split('base64,')[1];
  }
  return dataUriOrBase64;
}

/**
 * Extracts and parses JSON from text that might contain markdown or commentary
 */
export function extractJsonFromText(rawText: string): OllamaParsedResponse | null {
  try {
    // 1. Direct JSON parse
    const parsed = JSON.parse(rawText.trim());
    if (parsed && typeof parsed === 'object') {
      return normalizeResponse(parsed);
    }
  } catch {
    // Continue to regex extraction
  }

  try {
    // 2. Extract from markdown code blocks ```json ... ```
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed && typeof parsed === 'object') {
        return normalizeResponse(parsed);
      }
    }
  } catch {
    // Continue
  }

  try {
    // 3. Extract the first { ... } block
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = rawText.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonCandidate);
      return normalizeResponse(parsed);
    }
  } catch (err) {
    console.warn('Could not parse JSON from Ollama output:', err);
  }

  return null;
}

function normalizeResponse(parsed: Record<string, unknown>): OllamaParsedResponse {
  const title = typeof parsed.title === 'string' && parsed.title.trim().length > 0 
    ? parsed.title.trim() 
    : 'Screenshot Note';

  const category = typeof parsed.category === 'string' && parsed.category.trim().length > 0
    ? parsed.category.trim()
    : 'Development';

  let tags: string[] = [];
  if (Array.isArray(parsed.tags)) {
    tags = parsed.tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof parsed.tags === 'string') {
    tags = (parsed.tags as string).split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (tags.length === 0) {
    tags = ['journal', 'hacktoberfest'];
  }

  const summary = typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
    ? parsed.summary.trim()
    : (typeof parsed.description === 'string' ? parsed.description.trim() : 'Captured screenshot note with context.');

  return { title, category, tags, summary };
}

/**
 * Intelligent fallback parser when Ollama local instance is unreachable
 */
export function generateFallbackMetadata(instruction?: string): OllamaParsedResponse {
  const text = (instruction || '').trim();
  const lower = text.toLowerCase();

  let category = 'Design';
  const tags: string[] = ['journal', 'paperback'];

  if (lower.includes('recipe') || lower.includes('food') || lower.includes('cook') || lower.includes('pasta') || lower.includes('bake') || lower.includes('dinner')) {
    category = 'Recipes';
    tags.push('recipes', 'food', 'cooking');
  } else if (lower.includes('place') || lower.includes('travel') || lower.includes('trail') || lower.includes('walk') || lower.includes('city') || lower.includes('trip') || lower.includes('hotel') || lower.includes('map')) {
    category = 'Places';
    tags.push('places', 'travel', 'wanderlust');
  } else if (lower.includes('receipt') || lower.includes('expense') || lower.includes('invoice') || lower.includes('price') || lower.includes('bill') || lower.includes('cost') || lower.includes('total') || lower.includes('dollar')) {
    category = 'Receipts';
    tags.push('receipts', 'finance', 'expenses');
  } else if (lower.includes('design') || lower.includes('font') || lower.includes('typography') || lower.includes('ui') || lower.includes('ux') || lower.includes('css') || lower.includes('layout') || lower.includes('sketch')) {
    category = 'Design';
    tags.push('design', 'typography', 'art');
  } else if (lower.includes('bug') || lower.includes('error') || lower.includes('fix') || lower.includes('code') || lower.includes('git')) {
    category = 'Development';
    tags.push('development', 'code');
  } else {
    tags.push('memory', 'journal');
  }

  const title = text.length > 0 
    ? (text.length > 45 ? text.slice(0, 42) + '...' : text)
    : `Journal Entry (${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;

  const summary = text.length > 0
    ? `"${text}" — Recorded to paperback journal canvas.`
    : `Physical journal memory pinned on ${new Date().toLocaleDateString()}.`;

  return {
    title,
    category,
    tags: Array.from(new Set(tags)),
    summary
  };
}

/**
 * Sends the screenshot & instruction to Ollama running local gemma:2b
 */
export async function analyzeScreenshotWithOllama(
  base64Screenshot: string,
  instruction?: string
): Promise<{ result: OllamaParsedResponse; aiStatus: 'ollama_gemma_2b' | 'fallback_parser'; rawModelOutput?: string }> {
  const cleanedImage = cleanBase64Image(base64Screenshot);

  const prompt = `You are an intelligent paperback journal assistant.
Analyze this screenshot/photo and the accompanying voice note or instruction.
Provide a structured JSON object with the following fields:
1. "title": A concise, descriptive title (maximum 6 words, like a Polaroid caption).
2. "category": Choose the single best category from: ["Recipes", "Places", "Design", "Receipts", "Development", "Notes"].
3. "tags": An array of 3-5 lowercase relevant tags (e.g., ["recipes", "pasta", "dinner", "family"]).
4. "summary": A concise 1-2 sentence handwritten-style journal summary note.

User voice note/instruction: "${instruction || 'Photo logged for paperback journal entry.'}"

IMPORTANT: Respond with ONLY a valid JSON object. No explanation before or after.
Example:
{
  "title": "Tuscan Garlic Herb Pasta",
  "category": "Recipes",
  "tags": ["recipes", "pasta", "cooking", "dinner"],
  "summary": "Simmered San Marzano tomatoes with fresh basil and crushed garlic."
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout for local model

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        images: cleanedImage ? [cleanedImage] : undefined,
        stream: false,
        format: 'json',
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.response || '';
    const parsed = extractJsonFromText(responseText);

    if (parsed) {
      return {
        result: parsed,
        aiStatus: 'ollama_gemma_2b',
        rawModelOutput: responseText,
      };
    }

    console.warn('Ollama gemma:2b responded, but JSON parsing required fallback normalization:', responseText);
    const fallback = generateFallbackMetadata(instruction);
    return {
      result: fallback,
      aiStatus: 'fallback_parser',
      rawModelOutput: responseText,
    };
  } catch (error) {
    console.warn(`Ollama request to ${OLLAMA_HOST} with model ${OLLAMA_MODEL} not available, using smart fallback parser:`, error);
    const fallback = generateFallbackMetadata(instruction);
    return {
      result: fallback,
      aiStatus: 'fallback_parser',
    };
  }
}
