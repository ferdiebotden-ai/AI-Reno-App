'use client';

/**
 * Voice Handoff Cards
 * Monitors voice transcript for routing keywords and renders navigation cards
 * when Emma suggests the user talk to Marcus or Mia
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useVoice } from './voice-provider';
import { Calculator, Paintbrush } from 'lucide-react';

interface HandoffRoute {
  label: string;
  description: string;
  href: string;
  icon: typeof Calculator;
  keywords: string[];
}

const HANDOFF_ROUTES: HandoffRoute[] = [
  {
    label: 'Get an Estimate',
    description: 'Talk to Marcus about pricing',
    href: '/estimate',
    icon: Calculator,
    keywords: ['marcus', 'estimate', 'pricing page', 'quote page'],
  },
  {
    label: 'Design Visualizer',
    description: 'Work with Mia on your design',
    href: '/visualizer',
    icon: Paintbrush,
    keywords: ['mia', 'visualizer', 'design consultant', 'visualize', 'design page'],
  },
];

export function VoiceHandoffCards() {
  const { transcript } = useVoice();

  const detectedRoutes = useMemo(() => {
    // Scan the last 3 assistant transcript entries for routing keywords
    const recentAssistant = transcript
      .filter((e) => e.role === 'assistant')
      .slice(-3);

    if (recentAssistant.length === 0) return [];

    const combinedText = recentAssistant
      .map((e) => e.content.toLowerCase())
      .join(' ');

    return HANDOFF_ROUTES.filter((route) =>
      route.keywords.some((kw) => combinedText.includes(kw))
    );
  }, [transcript]);

  if (detectedRoutes.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2">
      {detectedRoutes.map((route) => {
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-sm flex-1 min-w-0"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate">{route.label}</div>
              <div className="text-xs text-muted-foreground truncate">
                {route.description}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
