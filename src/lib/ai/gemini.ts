/**
 * Google AI Provider Configuration
 * Gemini provider setup for text and image generation
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Create Google AI provider instance for Vercel AI SDK (text generation)
// API key is read from GOOGLE_GENERATIVE_AI_API_KEY env variable automatically
export const google = createGoogleGenerativeAI({});

// Create native Google Generative AI client for image generation
// This is required because Vercel AI SDK doesn't support image output yet
const apiKey = process.env['GOOGLE_GENERATIVE_AI_API_KEY'];
export const googleNativeAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Image generation model (Gemini 2.0 Flash with native image output)
export const imageModel = 'gemini-2.0-flash-exp';

// Configuration for visualization generation
export const VISUALIZATION_CONFIG = {
  // Model to use for image generation
  model: imageModel,
  // How much to preserve the original room structure (0.0-1.0)
  // Higher = more faithful to original layout
  structureReferenceStrength: 0.85,
  // How strongly to apply the style (0.0-1.0)
  // Moderate to avoid overwhelming the original image
  styleStrength: 0.4,
  // Number of variations to generate
  outputCount: 4,
  // Output resolution
  resolution: '1024x1024' as const,
  // Maximum generation time (ms)
  timeout: 90000,
} as const;

// Type for image generation result
export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

/**
 * Generate an image using Gemini's native image generation capability
 * Uses gemini-2.0-flash-exp with responseModalities: ["Text", "Image"]
 */
export async function generateImageWithGemini(
  prompt: string,
  inputImageBase64?: string,
  inputMimeType?: string
): Promise<GeneratedImage | null> {
  if (!googleNativeAI) {
    console.error('Google AI API key not configured');
    return null;
  }

  try {
    const model = googleNativeAI.getGenerativeModel({
      model: imageModel,
      generationConfig: {
        // Enable image output - this is the key configuration
        // @ts-expect-error - responseModalities is valid but not in older type definitions
        responseModalities: ['Text', 'Image'],
      },
    });

    // Build the content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Add input image if provided (for image editing/transformation)
    if (inputImageBase64 && inputMimeType) {
      // Strip data URL prefix if present
      const base64Data = inputImageBase64.includes('base64,')
        ? inputImageBase64.split('base64,')[1]
        : inputImageBase64;

      parts.push({
        inlineData: {
          mimeType: inputMimeType,
          data: base64Data ?? '',
        },
      });
    }

    // Add the text prompt
    parts.push({ text: prompt });

    const response = await model.generateContent(parts);
    const result = response.response;

    // Extract the generated image from the response
    const candidates = result.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('No candidates in Gemini response');
      return null;
    }

    const content = candidates[0]?.content;
    if (!content?.parts) {
      console.error('No content parts in Gemini response');
      return null;
    }

    // Find the image part in the response
    for (const part of content.parts) {
      // Check if this part contains image data
      const partWithData = part as { inlineData?: { mimeType: string; data: string } };
      if (partWithData.inlineData?.data) {
        return {
          base64: partWithData.inlineData.data,
          mimeType: partWithData.inlineData.mimeType || 'image/png',
        };
      }
    }

    console.error('No image found in Gemini response');
    return null;
  } catch (error) {
    console.error('Gemini image generation error:', error);
    return null;
  }
}
