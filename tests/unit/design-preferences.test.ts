/**
 * Design Preferences Schema Tests
 * Tests for the unified preferences schema, merge logic, and label helpers
 */

import { describe, it, expect } from 'vitest';
import {
  roomTypeSelectionSchema,
  designStyleSelectionSchema,
  voiceTranscriptEntrySchema,
  voiceExtractedPreferencesSchema,
  voiceSummaryResponseSchema,
  designIntentSchema,
  designPreferencesSchema,
  mergeDesignIntent,
  getRoomTypeLabel,
  getStyleLabel,
  type DesignPreferences,
} from '@/lib/schemas/design-preferences';

describe('Design Preferences Schemas', () => {
  describe('roomTypeSelectionSchema', () => {
    it('accepts standard room types', () => {
      const valid = ['kitchen', 'bathroom', 'living_room', 'bedroom', 'basement', 'dining_room', 'exterior'];
      valid.forEach(type => {
        expect(() => roomTypeSelectionSchema.parse(type)).not.toThrow();
      });
    });

    it('accepts "other" for custom room types', () => {
      expect(roomTypeSelectionSchema.parse('other')).toBe('other');
    });

    it('rejects invalid room types', () => {
      expect(() => roomTypeSelectionSchema.parse('garage')).toThrow();
      expect(() => roomTypeSelectionSchema.parse('')).toThrow();
    });
  });

  describe('designStyleSelectionSchema', () => {
    it('accepts standard design styles', () => {
      const valid = ['modern', 'traditional', 'farmhouse', 'industrial', 'minimalist', 'contemporary'];
      valid.forEach(style => {
        expect(() => designStyleSelectionSchema.parse(style)).not.toThrow();
      });
    });

    it('accepts "other" for custom styles', () => {
      expect(designStyleSelectionSchema.parse('other')).toBe('other');
    });

    it('rejects invalid styles', () => {
      expect(() => designStyleSelectionSchema.parse('art_deco')).toThrow();
    });
  });

  describe('voiceTranscriptEntrySchema', () => {
    it('validates a valid transcript entry', () => {
      const entry = {
        role: 'user',
        content: 'I want a modern kitchen with quartz counters',
        timestamp: new Date().toISOString(),
      };
      expect(() => voiceTranscriptEntrySchema.parse(entry)).not.toThrow();
    });

    it('coerces string timestamps to Date', () => {
      const entry = {
        role: 'assistant',
        content: 'Great choice!',
        timestamp: '2026-02-10T12:00:00Z',
      };
      const parsed = voiceTranscriptEntrySchema.parse(entry);
      expect(parsed.timestamp).toBeInstanceOf(Date);
    });

    it('rejects invalid roles', () => {
      expect(() => voiceTranscriptEntrySchema.parse({
        role: 'system',
        content: 'test',
        timestamp: new Date(),
      })).toThrow();
    });
  });

  describe('voiceExtractedPreferencesSchema', () => {
    it('validates extracted preferences', () => {
      const prefs = {
        desiredChanges: ['open concept layout', 'new countertops'],
        materialPreferences: ['quartz', 'brass hardware'],
        styleIndicators: ['modern', 'bright'],
        preservationNotes: ['keep cabinet layout'],
      };
      expect(() => voiceExtractedPreferencesSchema.parse(prefs)).not.toThrow();
    });

    it('accepts empty arrays', () => {
      const prefs = {
        desiredChanges: [],
        materialPreferences: [],
        styleIndicators: [],
        preservationNotes: [],
      };
      expect(() => voiceExtractedPreferencesSchema.parse(prefs)).not.toThrow();
    });
  });

  describe('voiceSummaryResponseSchema', () => {
    it('validates a complete voice summary response', () => {
      const response = {
        summary: 'You discussed wanting a modern kitchen with quartz counters',
        extractedPreferences: {
          desiredChanges: ['open concept'],
          materialPreferences: ['quartz'],
          styleIndicators: ['modern'],
          preservationNotes: [],
        },
      };
      expect(() => voiceSummaryResponseSchema.parse(response)).not.toThrow();
    });
  });

  describe('designIntentSchema', () => {
    it('validates design intent with all fields', () => {
      const intent = {
        desiredChanges: ['new countertops', 'paint walls'],
        constraintsToPreserve: ['keep window placement'],
        materialPreferences: ['quartz', 'oak flooring'],
      };
      expect(() => designIntentSchema.parse(intent)).not.toThrow();
    });
  });

  describe('designPreferencesSchema', () => {
    it('validates minimal preferences (standard room + style)', () => {
      const prefs = {
        roomType: 'kitchen',
        style: 'modern',
      };
      const parsed = designPreferencesSchema.parse(prefs);
      expect(parsed.roomType).toBe('kitchen');
      expect(parsed.style).toBe('modern');
      expect(parsed.textPreferences).toBe('');
      expect(parsed.voiceTranscript).toEqual([]);
    });

    it('validates preferences with "other" room type and custom value', () => {
      const prefs = {
        roomType: 'other',
        customRoomType: 'Sunroom',
        style: 'farmhouse',
      };
      const parsed = designPreferencesSchema.parse(prefs);
      expect(parsed.roomType).toBe('other');
      expect(parsed.customRoomType).toBe('Sunroom');
    });

    it('validates preferences with "other" style and custom value', () => {
      const prefs = {
        roomType: 'bathroom',
        style: 'other',
        customStyle: 'Mid-century modern',
      };
      const parsed = designPreferencesSchema.parse(prefs);
      expect(parsed.style).toBe('other');
      expect(parsed.customStyle).toBe('Mid-century modern');
    });

    it('validates full preferences with all optional fields', () => {
      const prefs = {
        roomType: 'kitchen',
        style: 'modern',
        textPreferences: 'I want quartz countertops and new lighting',
        voiceTranscript: [
          { role: 'user', content: 'I want a bright kitchen', timestamp: new Date().toISOString() },
          { role: 'assistant', content: 'Great, tell me more!', timestamp: new Date().toISOString() },
        ],
        voicePreferencesSummary: 'User wants a bright, modern kitchen with quartz counters',
        voiceExtractedPreferences: {
          desiredChanges: ['bright space', 'new countertops'],
          materialPreferences: ['quartz'],
          styleIndicators: ['modern'],
          preservationNotes: ['keep cabinet layout'],
        },
        designIntent: {
          desiredChanges: ['new countertops'],
          constraintsToPreserve: ['keep cabinet layout'],
          materialPreferences: ['quartz'],
        },
      };
      expect(() => designPreferencesSchema.parse(prefs)).not.toThrow();
    });

    it('rejects custom room type over 100 characters', () => {
      const prefs = {
        roomType: 'other',
        customRoomType: 'A'.repeat(101),
        style: 'modern',
      };
      expect(() => designPreferencesSchema.parse(prefs)).toThrow();
    });

    it('rejects text preferences over 500 characters', () => {
      const prefs = {
        roomType: 'kitchen',
        style: 'modern',
        textPreferences: 'A'.repeat(501),
      };
      expect(() => designPreferencesSchema.parse(prefs)).toThrow();
    });
  });
});

describe('mergeDesignIntent', () => {
  it('merges text preferences as desired changes', () => {
    const prefs: DesignPreferences = {
      roomType: 'kitchen',
      style: 'modern',
      textPreferences: 'I want quartz countertops',
      voiceTranscript: [],
    };
    const intent = mergeDesignIntent(prefs);
    expect(intent.desiredChanges).toContain('I want quartz countertops');
  });

  it('merges voice extracted preferences', () => {
    const prefs: DesignPreferences = {
      roomType: 'kitchen',
      style: 'modern',
      textPreferences: '',
      voiceTranscript: [],
      voiceExtractedPreferences: {
        desiredChanges: ['open concept layout'],
        materialPreferences: ['quartz', 'brass hardware'],
        styleIndicators: ['modern'],
        preservationNotes: ['keep cabinet layout'],
      },
    };
    const intent = mergeDesignIntent(prefs);
    expect(intent.desiredChanges).toContain('open concept layout');
    expect(intent.materialPreferences).toContain('quartz');
    expect(intent.materialPreferences).toContain('brass hardware');
    expect(intent.constraintsToPreserve).toContain('keep cabinet layout');
  });

  it('combines text and voice sources with deduplication', () => {
    const prefs: DesignPreferences = {
      roomType: 'kitchen',
      style: 'modern',
      textPreferences: 'quartz countertops',
      voiceTranscript: [],
      voiceExtractedPreferences: {
        desiredChanges: ['quartz countertops', 'open concept'],
        materialPreferences: ['quartz'],
        styleIndicators: [],
        preservationNotes: [],
      },
    };
    const intent = mergeDesignIntent(prefs);
    // "quartz countertops" appears in both text and voice — Set deduplicates
    expect(intent.desiredChanges).toContain('quartz countertops');
    expect(intent.desiredChanges).toContain('open concept');
    expect(intent.desiredChanges.length).toBe(2);
    expect(intent.materialPreferences).toContain('quartz');
  });

  it('deduplicates identical entries', () => {
    const prefs: DesignPreferences = {
      roomType: 'kitchen',
      style: 'modern',
      textPreferences: '',
      voiceTranscript: [],
      voiceExtractedPreferences: {
        desiredChanges: ['new lighting'],
        materialPreferences: ['brass'],
        styleIndicators: [],
        preservationNotes: [],
      },
      designIntent: {
        desiredChanges: ['new lighting'],
        constraintsToPreserve: [],
        materialPreferences: ['brass'],
      },
    };
    const intent = mergeDesignIntent(prefs);
    expect(intent.desiredChanges).toEqual(['new lighting']);
    expect(intent.materialPreferences).toEqual(['brass']);
  });

  it('returns empty arrays when no preferences provided', () => {
    const prefs: DesignPreferences = {
      roomType: 'kitchen',
      style: 'modern',
      textPreferences: '',
      voiceTranscript: [],
    };
    const intent = mergeDesignIntent(prefs);
    expect(intent.desiredChanges).toEqual([]);
    expect(intent.constraintsToPreserve).toEqual([]);
    expect(intent.materialPreferences).toEqual([]);
  });

  it('ignores whitespace-only text preferences', () => {
    const prefs: DesignPreferences = {
      roomType: 'kitchen',
      style: 'modern',
      textPreferences: '   ',
      voiceTranscript: [],
    };
    const intent = mergeDesignIntent(prefs);
    expect(intent.desiredChanges).toEqual([]);
  });
});

describe('Label helpers', () => {
  describe('getRoomTypeLabel', () => {
    it('formats standard room types', () => {
      const prefs: DesignPreferences = {
        roomType: 'living_room',
        style: 'modern',
        textPreferences: '',
        voiceTranscript: [],
      };
      expect(getRoomTypeLabel(prefs)).toBe('living room');
    });

    it('returns custom room type for "other"', () => {
      const prefs: DesignPreferences = {
        roomType: 'other',
        customRoomType: 'Sunroom',
        style: 'modern',
        textPreferences: '',
        voiceTranscript: [],
      };
      expect(getRoomTypeLabel(prefs)).toBe('Sunroom');
    });

    it('returns fallback for "other" without custom value', () => {
      const prefs: DesignPreferences = {
        roomType: 'other',
        style: 'modern',
        textPreferences: '',
        voiceTranscript: [],
      };
      expect(getRoomTypeLabel(prefs)).toBe('Custom Room');
    });
  });

  describe('getStyleLabel', () => {
    it('capitalizes standard styles', () => {
      const prefs: DesignPreferences = {
        roomType: 'kitchen',
        style: 'farmhouse',
        textPreferences: '',
        voiceTranscript: [],
      };
      expect(getStyleLabel(prefs)).toBe('Farmhouse');
    });

    it('returns custom style for "other"', () => {
      const prefs: DesignPreferences = {
        roomType: 'kitchen',
        style: 'other',
        customStyle: 'Art Deco',
        textPreferences: '',
        voiceTranscript: [],
      };
      expect(getStyleLabel(prefs)).toBe('Art Deco');
    });

    it('returns fallback for "other" without custom value', () => {
      const prefs: DesignPreferences = {
        roomType: 'kitchen',
        style: 'other',
        textPreferences: '',
        voiceTranscript: [],
      };
      expect(getStyleLabel(prefs)).toBe('Custom Style');
    });
  });
});
