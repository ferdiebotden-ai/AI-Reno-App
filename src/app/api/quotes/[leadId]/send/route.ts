/**
 * Send Quote Email API
 * POST /api/quotes/[leadId]/send - Send quote email with PDF attachment
 * [DEV-058]
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServiceClient } from '@/lib/db/server';
import { QuotePdfDocument } from '@/lib/pdf/quote-template';
import { QuoteEmailTemplate } from '@/lib/email/quote-email';
import { getResend } from '@/lib/email/resend';

type RouteContext = { params: Promise<{ leadId: string }> };

// Request schema
const SendQuoteSchema = z.object({
  customMessage: z.string().max(500).optional(),
  recipientEmail: z.string().email().optional(), // Override recipient if needed
});

// Email configuration
const FROM_EMAIL = process.env['FROM_EMAIL'] || 'Red White Reno <noreply@redwhitereno.ca>';
const REPLY_TO_EMAIL = process.env['REPLY_TO_EMAIL'] || 'quotes@redwhitereno.ca';

/**
 * POST /api/quotes/[leadId]/send
 * Send a quote email to the customer with PDF attachment
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { leadId } = await context.params;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const validationResult = SendQuoteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { customMessage, recipientEmail } = validationResult.data;

    const supabase = createServiceClient();

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError);
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Determine recipient email
    const toEmail = recipientEmail || lead.email;
    if (!toEmail) {
      return NextResponse.json(
        { error: 'No email address available for this lead' },
        { status: 400 }
      );
    }

    // Fetch the most recent quote draft
    const { data: quote, error: quoteError } = await supabase
      .from('quote_drafts')
      .select('*')
      .eq('lead_id', leadId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (quoteError || !quote) {
      console.error('Error fetching quote:', quoteError);
      return NextResponse.json(
        { error: 'No quote found for this lead. Please create a quote first.' },
        { status: 404 }
      );
    }

    // Check if quote has line items
    const lineItems = quote.line_items;
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Quote has no line items. Please add items before sending.' },
        { status: 400 }
      );
    }

    // Check for Resend API key
    if (!process.env['RESEND_API_KEY']) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Generate PDF for attachment
    const pdfBuffer = await renderToBuffer(
      QuotePdfDocument({ lead, quote })
    );

    // Create filename
    const quoteDate = new Date(quote.created_at);
    const quoteNumber = `RWR-${quoteDate.getFullYear()}-${String(lead.id).slice(0, 8).toUpperCase()}`;
    const filename = `${quoteNumber}-Quote-${lead.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;

    // Get project type for subject
    const projectTypeLabels: Record<string, string> = {
      kitchen: 'Kitchen',
      bathroom: 'Bathroom',
      basement: 'Basement',
      flooring: 'Flooring',
      painting: 'Painting',
      exterior: 'Exterior',
      other: 'Renovation',
    };
    const projectType = projectTypeLabels[lead.project_type || 'other'] || 'Renovation';

    // Send email with Resend
    const resend = getResend();
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      replyTo: REPLY_TO_EMAIL,
      subject: `Your ${projectType} Quote from Red White Reno - ${quoteNumber}`,
      react: QuoteEmailTemplate({ lead, quote, customMessage }),
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    });

    if (emailResult.error) {
      console.error('Email send error:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error.message },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    // Update quote_drafts with sent info
    await supabase
      .from('quote_drafts')
      .update({
        sent_at: now,
        sent_to_email: toEmail,
        updated_at: now,
      })
      .eq('id', quote.id);

    // Update lead status to 'sent'
    await supabase
      .from('leads')
      .update({
        status: 'sent',
        updated_at: now,
        last_contacted_at: now,
      })
      .eq('id', leadId);

    // Log the send action
    await supabase.from('audit_log').insert({
      lead_id: leadId,
      action: 'quote_sent',
      new_values: {
        quote_id: quote.id,
        quote_version: quote.version,
        sent_to: toEmail,
        total: quote.total,
        email_id: emailResult.data?.id,
        custom_message: customMessage || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quote sent successfully',
      data: {
        emailId: emailResult.data?.id,
        sentTo: toEmail,
        sentAt: now,
        quoteNumber,
      },
    });
  } catch (error) {
    console.error('Send quote error:', error);
    return NextResponse.json(
      { error: 'Failed to send quote' },
      { status: 500 }
    );
  }
}
