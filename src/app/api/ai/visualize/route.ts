/**
 * AI Visualization API Route
 * Generates AI design visualizations using Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/server';
import {
  visualizationRequestSchema,
  type VisualizationResponse,
  type VisualizationError,
  type GeneratedConcept,
  type RoomType,
  type DesignStyle,
} from '@/lib/schemas/visualization';
import {
  generatePlaceholderConcepts,
  generateVisualizationConcept,
} from '@/lib/ai/visualization';
import { VISUALIZATION_CONFIG, type GeneratedImage } from '@/lib/ai/gemini';

// Maximum execution time for Vercel
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const parseResult = visualizationRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const error: VisualizationError = {
        error: 'Invalid request',
        code: 'INVALID_IMAGE',
        details: parseResult.error.issues[0]?.message,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const { image, roomType, style, constraints, count } = parseResult.data;

    // Initialize Supabase service client
    const supabase = createServiceClient();

    // Upload original image to Supabase Storage
    const originalImageUrl = await uploadOriginalImage(supabase, image);
    if (!originalImageUrl) {
      const error: VisualizationError = {
        error: 'Failed to store original image',
        code: 'STORAGE_ERROR',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Generate visualization concepts
    let concepts: GeneratedConcept[];

    if (process.env['GOOGLE_GENERATIVE_AI_API_KEY']) {
      // Use real Gemini image generation
      concepts = await generateConceptsWithGemini(
        supabase,
        image,
        roomType as RoomType,
        style as DesignStyle,
        constraints,
        count
      );
    } else {
      // Use placeholder images for development/demo (no API key)
      console.warn('GOOGLE_GENERATIVE_AI_API_KEY not set, using placeholders');
      concepts = generatePlaceholderConcepts(
        roomType as RoomType,
        style as DesignStyle,
        count
      );
    }

    // Upload generated concepts to Supabase Storage (for real generated images)
    // For placeholders, we use external URLs directly

    const generationTimeMs = Date.now() - startTime;

    // Generate share token
    const shareToken = generateShareToken();

    // Save visualization to database
    const { data: visualization, error: dbError } = await supabase
      .from('visualizations')
      .insert({
        original_photo_url: originalImageUrl,
        room_type: roomType,
        style: style,
        constraints: constraints || null,
        generated_concepts: concepts,
        generation_time_ms: generationTimeMs,
        share_token: shareToken,
        source: 'visualizer',
        device_type: getDeviceType(request),
        user_agent: request.headers.get('user-agent') || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      const error: VisualizationError = {
        error: 'Failed to save visualization',
        code: 'STORAGE_ERROR',
        details: dbError.message,
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Build response
    const response: VisualizationResponse = {
      id: visualization.id,
      originalImageUrl,
      roomType,
      style,
      constraints: constraints || undefined,
      concepts,
      generationTimeMs,
      createdAt: visualization.created_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Visualization error:', error);

    // Check for timeout
    const elapsed = Date.now() - startTime;
    if (elapsed >= VISUALIZATION_CONFIG.timeout) {
      const errorResponse: VisualizationError = {
        error: 'Generation timed out',
        code: 'TIMEOUT',
        details: 'The AI took too long to generate visualizations. Please try again.',
      };
      return NextResponse.json(errorResponse, { status: 504 });
    }

    const errorResponse: VisualizationError = {
      error: 'Failed to generate visualization',
      code: 'UNKNOWN',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Upload original image to Supabase Storage
async function uploadOriginalImage(
  supabase: ReturnType<typeof createServiceClient>,
  imageBase64: string
): Promise<string | null> {
  try {
    // Extract base64 data and mime type
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error('Invalid base64 image format');
      return null;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const extension = mimeType?.split('/')[1] || 'jpg';

    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data ?? '', 'base64');

    // Generate unique filename
    const filename = `original/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('visualizations')
      .upload(filename, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      // If bucket doesn't exist, return a placeholder URL for development
      if (error.message.includes('Bucket not found')) {
        console.warn('Visualizations bucket not found, using data URL');
        return imageBase64; // Return original base64 as fallback
      }
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('visualizations')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return null;
  }
}

// Upload generated image to Supabase Storage
async function uploadGeneratedImage(
  supabase: ReturnType<typeof createServiceClient>,
  image: GeneratedImage,
  index: number
): Promise<string | null> {
  try {
    const extension = image.mimeType.split('/')[1] || 'png';
    const filename = `generated/${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.${extension}`;
    const buffer = Buffer.from(image.base64, 'base64');

    const { data, error } = await supabase.storage
      .from('visualizations')
      .upload(filename, buffer, {
        contentType: image.mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      // If bucket doesn't exist, return data URL as fallback
      if (error.message.includes('Bucket not found')) {
        console.warn('Visualizations bucket not found, using data URL');
        return `data:${image.mimeType};base64,${image.base64}`;
      }
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('visualizations')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload generated image:', error);
    return null;
  }
}

// Generate concepts using real Gemini image generation
async function generateConceptsWithGemini(
  supabase: ReturnType<typeof createServiceClient>,
  imageBase64: string,
  roomType: RoomType,
  style: DesignStyle,
  constraints: string | undefined,
  count: number
): Promise<GeneratedConcept[]> {
  const concepts: GeneratedConcept[] = [];

  // Generate concepts in parallel for speed
  const promises = Array.from({ length: count }, async (_, i) => {
    try {
      const result = await generateVisualizationConcept(
        imageBase64,
        roomType,
        style,
        constraints,
        i
      );

      if (result) {
        // Upload to Supabase Storage and get URL
        const imageUrl = await uploadGeneratedImage(supabase, result, i);
        if (imageUrl) {
          return {
            id: `concept-${i + 1}-${Date.now()}`,
            imageUrl,
            description: `${style.charAt(0).toUpperCase() + style.slice(1)} ${roomType.replace('_', ' ')} design - Concept ${i + 1}`,
            generatedAt: new Date().toISOString(),
          };
        }
      }
      return null;
    } catch (error) {
      console.error(`Failed to generate concept ${i + 1}:`, error);
      return null;
    }
  });

  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      concepts.push(result.value);
    }
  }

  // If no concepts were generated, fall back to placeholders
  if (concepts.length === 0) {
    console.warn('No Gemini images generated, falling back to placeholders');
    return generatePlaceholderConcepts(roomType, style, count);
  }

  // If we got fewer than requested, fill with more attempts or placeholders
  if (concepts.length < count) {
    console.warn(`Only generated ${concepts.length}/${count} concepts`);
  }

  return concepts;
}

// Generate a unique share token
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Detect device type from user agent
function getDeviceType(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || '';
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}
