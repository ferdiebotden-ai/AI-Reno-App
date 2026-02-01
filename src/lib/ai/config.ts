/**
 * AI Configuration
 * Model constants and parameters for AI services
 */

export const AI_CONFIG = {
  openai: {
    chat: 'gpt-4o',           // Production chat model
    extraction: 'gpt-4o',      // Structured extraction
    vision: 'gpt-4o',          // Photo analysis (multimodal)
    moderation: 'omni-moderation-latest',
  },
  parameters: {
    chat: {
      maxTokens: 1024,
      temperature: 0.7,
    },
    extraction: {
      maxTokens: 2048,
      temperature: 0.3,
    },
    vision: {
      maxTokens: 1024,
      temperature: 0.5,
    },
  },
} as const;

export type ModelType = keyof typeof AI_CONFIG.openai;
