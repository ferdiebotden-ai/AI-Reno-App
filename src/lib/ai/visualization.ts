/**
 * Visualization Service
 * AI-powered room transformation using Gemini image generation
 */

import { generateImageWithGemini, VISUALIZATION_CONFIG, type GeneratedImage } from './gemini';
import {
  type RoomType,
  type DesignStyle,
  STYLE_DESCRIPTIONS,
  ROOM_CONTEXTS,
  type GeneratedConcept,
} from '@/lib/schemas/visualization';

// Build the visualization prompt for Gemini
export function buildVisualizationPrompt(
  roomType: RoomType,
  style: DesignStyle,
  constraints?: string,
  variationIndex: number = 0
): string {
  const styleDesc = STYLE_DESCRIPTIONS[style];
  const roomContext = ROOM_CONTEXTS[roomType];

  let prompt = `Transform this ${roomType.replace('_', ' ')} photo into a ${style} design style renovation.

Style characteristics: ${styleDesc}

Room focus areas: ${roomContext}

CRITICAL REQUIREMENTS:
- Maintain the exact same room layout, dimensions, and architecture from the input photo
- Keep the camera angle and perspective identical to the original
- Preserve windows, doors, and structural elements in their exact positions
- Apply the ${style} aesthetic to fixtures, finishes, colors, and decor
- Ensure realistic lighting that matches the original room's light sources
- Make the transformation believable as a real renovation result
- High quality, photorealistic output suitable for showing to clients
- Generate a single image showing the renovated room`;

  if (constraints) {
    prompt += `

User preferences: ${constraints}`;
  }

  // Add variation instruction for multiple concepts
  if (variationIndex > 0) {
    const variations = [
      'Explore a slightly warmer color palette while staying true to the style.',
      'Focus more on natural textures and organic materials.',
      'Emphasize clean lines and a more minimalist approach.',
      'Add subtle accent colors and decorative elements.',
    ];
    const variationHint = variations[variationIndex % variations.length];
    prompt += `

Variation ${variationIndex + 1}: ${variationHint}`;
  }

  prompt += `

Generate a photorealistic visualization showing how this room would look after a professional ${style} renovation. Output an image.`;

  return prompt;
}

// Extract mime type from base64 data URL
function extractMimeType(imageBase64: string): string {
  const matches = imageBase64.match(/^data:([^;]+);base64/);
  return matches?.[1] ?? 'image/jpeg';
}

// Generate a single visualization concept using real Gemini image generation
export async function generateVisualizationConcept(
  imageBase64: string,
  roomType: RoomType,
  style: DesignStyle,
  constraints?: string,
  conceptIndex: number = 0
): Promise<GeneratedImage | null> {
  const prompt = buildVisualizationPrompt(roomType, style, constraints, conceptIndex);
  const mimeType = extractMimeType(imageBase64);

  try {
    // Use native Gemini image generation with the input photo
    const result = await generateImageWithGemini(prompt, imageBase64, mimeType);
    return result;
  } catch (error) {
    console.error(`Visualization generation failed for concept ${conceptIndex}:`, error);
    return null;
  }
}

// Generate multiple visualization concepts
export async function generateVisualizationConcepts(
  imageBase64: string,
  roomType: RoomType,
  style: DesignStyle,
  constraints?: string,
  count: number = VISUALIZATION_CONFIG.outputCount
): Promise<GeneratedImage[]> {
  const concepts: GeneratedImage[] = [];

  // Generate concepts in parallel for speed
  const promises = Array.from({ length: count }, (_, i) =>
    generateVisualizationConcept(imageBase64, roomType, style, constraints, i)
  );

  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      concepts.push(result.value);
    }
  }

  return concepts;
}

// Create concept objects with IDs and URLs
export function createConceptObjects(
  imageUrls: string[],
  descriptions?: string[]
): GeneratedConcept[] {
  return imageUrls.map((url, index) => ({
    id: `concept-${index + 1}-${Date.now()}`,
    imageUrl: url,
    description: descriptions?.[index],
    generatedAt: new Date().toISOString(),
  }));
}

// Placeholder image generator (for development/demo)
// Returns placeholder URLs until actual Gemini image generation is available
export function generatePlaceholderConcepts(
  roomType: RoomType,
  style: DesignStyle,
  count: number = 4
): GeneratedConcept[] {
  const placeholders: GeneratedConcept[] = [];

  for (let i = 0; i < count; i++) {
    placeholders.push({
      id: `placeholder-${i + 1}-${Date.now()}`,
      // Use picsum.photos for demo placeholders with room-specific seeds
      imageUrl: `https://picsum.photos/seed/${roomType}-${style}-${i}/1024/768`,
      description: `${style.charAt(0).toUpperCase() + style.slice(1)} ${roomType.replace('_', ' ')} design - Concept ${i + 1}`,
      generatedAt: new Date().toISOString(),
    });
  }

  return placeholders;
}
