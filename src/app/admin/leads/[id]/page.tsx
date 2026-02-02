import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/server';
import { LeadDetailHeader } from '@/components/admin/lead-detail-header';
import { LeadContactCard } from '@/components/admin/lead-contact-card';
import { LeadProjectCard } from '@/components/admin/lead-project-card';
import { PhotoGallery } from '@/components/admin/photo-gallery';
import { ChatTranscript } from '@/components/admin/chat-transcript';
import { QuoteEditor } from '@/components/admin/quote-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getLeadData(id: string) {
  const supabase = createServiceClient();

  // Fetch lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (leadError || !lead) {
    return null;
  }

  // Fetch quote draft
  const { data: quote } = await supabase
    .from('quote_drafts')
    .select('*')
    .eq('lead_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { lead, quote };
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const data = await getLeadData(id);

  if (!data) {
    notFound();
  }

  const { lead, quote } = data;

  return (
    <div className="space-y-6">
      {/* Header with status and actions */}
      <LeadDetailHeader lead={lead} />

      {/* Main content */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="transcript">Chat</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left column */}
            <div className="space-y-6">
              <LeadContactCard lead={lead} />
              <LeadProjectCard lead={lead} />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <PhotoGallery
                uploadedPhotos={lead.uploaded_photos}
                generatedConcepts={lead.generated_concepts}
              />
            </div>
          </div>
        </TabsContent>

        {/* Quote Tab */}
        <TabsContent value="quote">
          <QuoteEditor
            leadId={lead.id}
            initialQuote={quote}
            initialEstimate={lead.quote_draft_json}
          />
        </TabsContent>

        {/* Chat Transcript Tab */}
        <TabsContent value="transcript">
          <ChatTranscript transcript={lead.chat_transcript} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
