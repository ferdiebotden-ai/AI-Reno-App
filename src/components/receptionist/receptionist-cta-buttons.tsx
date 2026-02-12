'use client';

/**
 * Receptionist CTA Buttons
 * Parses [CTA:Label:/path] markers from message text and renders:
 * - HandoffCard for persona routes (/estimate, /visualizer)
 * - Regular link buttons for non-persona routes
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { HandoffCard } from '@/components/chat/handoff-card';
import type { PersonaKey } from '@/lib/ai/personas/types';

const CTA_REGEX = /\[CTA:([^:]+):([^\]]+)\]/g;

/** Routes that trigger persona handoff cards */
const PERSONA_ROUTES: Record<string, PersonaKey> = {
  '/estimate': 'quote-specialist',
  '/visualizer': 'design-consultant',
};

interface CTAMatch {
  label: string;
  path: string;
}

/**
 * Extract CTA markers from text
 */
function extractCTAs(text: string): CTAMatch[] {
  const matches: CTAMatch[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  CTA_REGEX.lastIndex = 0;
  while ((match = CTA_REGEX.exec(text)) !== null) {
    if (match[1] && match[2]) {
      matches.push({ label: match[1], path: match[2] });
    }
  }
  return matches;
}

/**
 * Remove CTA markers from text, returning clean text for display
 */
export function stripCTAs(text: string): string {
  return text.replace(CTA_REGEX, '').trim();
}

/**
 * Render inline CTA buttons parsed from message text
 * Persona routes render as HandoffCard; other routes render as link buttons
 */
export function ReceptionistCTAButtons({
  text,
  messages,
}: {
  text: string;
  messages?: { role: 'user' | 'assistant'; content: string }[];
}) {
  const ctas = extractCTAs(text);

  if (ctas.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {ctas.map((cta, index) => {
        const toPersona = PERSONA_ROUTES[cta.path];

        if (toPersona && messages) {
          return (
            <HandoffCard
              key={`${cta.path}-${index}`}
              fromPersona="receptionist"
              toPersona={toPersona}
              messages={messages}
            />
          );
        }

        // Regular link button for non-persona routes
        return (
          <Button
            key={`${cta.path}-${index}`}
            variant="outline"
            size="sm"
            className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
            asChild
          >
            <Link href={cta.path}>
              {cta.label}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
