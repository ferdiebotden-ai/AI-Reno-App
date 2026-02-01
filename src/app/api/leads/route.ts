import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/server';
import { calculateEstimate } from '@/lib/pricing/engine';
import type { LeadInsert, ProjectType, FinishLevel, Timeline, BudgetBand, Json } from '@/types/database';

/**
 * Lead submission schema
 */
const LeadSubmissionSchema = z.object({
  // Required contact info
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),

  // Project details
  projectType: z.enum(['kitchen', 'bathroom', 'basement', 'flooring', 'painting', 'exterior', 'other']),
  areaSqft: z.number().positive().optional(),
  finishLevel: z.enum(['economy', 'standard', 'premium']).optional(),
  timeline: z.enum(['asap', '1_3_months', '3_6_months', '6_plus_months', 'just_exploring']).optional(),
  budgetBand: z.enum(['under_15k', '15k_25k', '25k_40k', '40k_60k', '60k_plus', 'not_sure']).optional(),
  goalsText: z.string().max(2000).optional(),

  // AI-generated data
  chatTranscript: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
  scopeJson: z.record(z.string(), z.unknown()).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  aiNotes: z.string().optional(),

  // Files
  uploadedPhotos: z.array(z.string()).optional(),

  // Tracking
  sessionId: z.string().uuid().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = LeadSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Calculate estimate if we have enough data
    let quoteDraftJson = null;
    if (data.projectType && (data.projectType === 'kitchen' || data.projectType === 'bathroom' || data.projectType === 'basement' || data.projectType === 'flooring')) {
      const estimate = calculateEstimate({
        projectType: data.projectType,
        areaSqft: data.areaSqft,
        finishLevel: data.finishLevel,
      });

      quoteDraftJson = {
        estimateLow: estimate.low,
        estimateHigh: estimate.high,
        breakdown: estimate.breakdown,
        confidence: estimate.confidence,
        notes: estimate.notes,
      };
    }

    // Create lead record
    const leadData: LeadInsert = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      postal_code: data.postalCode || null,
      project_type: data.projectType as ProjectType,
      area_sqft: data.areaSqft || null,
      finish_level: (data.finishLevel as FinishLevel) || null,
      timeline: (data.timeline as Timeline) || null,
      budget_band: (data.budgetBand as BudgetBand) || null,
      goals_text: data.goalsText || null,
      chat_transcript: (data.chatTranscript || null) as Json,
      scope_json: (data.scopeJson || null) as Json,
      quote_draft_json: quoteDraftJson as Json,
      confidence_score: data.confidenceScore || null,
      ai_notes: data.aiNotes || null,
      uploaded_photos: data.uploadedPhotos || null,
      session_id: data.sessionId || null,
      utm_source: data.utmSource || null,
      utm_medium: data.utmMedium || null,
      utm_campaign: data.utmCampaign || null,
      status: quoteDraftJson ? 'draft_ready' : 'new',
      source: 'ai_chat',
    };

    // Insert into database
    const supabase = createServiceClient();
    const { data: lead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select('id, status, created_at')
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Update chat session if provided
    if (data.sessionId) {
      await supabase
        .from('chat_sessions')
        .update({
          state: 'completed',
          extracted_data: {
            leadId: lead.id,
            projectType: data.projectType,
            estimate: quoteDraftJson,
          } as Json,
        })
        .eq('id', data.sessionId);
    }

    // Log the action
    await supabase.from('audit_log').insert({
      lead_id: lead.id,
      action: 'lead_created',
      new_values: {
        source: 'ai_chat',
        project_type: data.projectType,
        has_estimate: !!quoteDraftJson,
      },
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      status: lead.status,
      hasEstimate: !!quoteDraftJson,
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
