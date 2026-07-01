// Minimal client for Google Gemini 2.5 Flash Image ("nano-banana").
//
// Docs: https://ai.google.dev/gemini-api/docs/image-generation
// The model returns inline image data as base64 inside `candidates[].content.parts[].inlineData`.

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface GeneratedImage {
  /** Raw decoded image bytes (PNG or JPEG, depending on what the model returned). */
  bytes: Uint8Array;
  mimeType: string;
}

export class GeminiImageError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) {
    super(message);
    this.name = "GeminiImageError";
  }
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiImageError("GEMINI_API_KEY is not set in environment");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiImageError(`Gemini API ${res.status}: ${res.statusText}`, res.status, body);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType: string; data: string };
          text?: string;
        }>;
      };
    }>;
  };

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) {
    throw new GeminiImageError("No image returned in Gemini response", undefined, json);
  }

  const bytes = Uint8Array.from(Buffer.from(imagePart.inlineData.data, "base64"));
  return { bytes, mimeType: imagePart.inlineData.mimeType };
}
