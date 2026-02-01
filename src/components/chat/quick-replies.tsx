'use client';

/**
 * Quick Replies
 * Clickable buttons for common responses to reduce friction
 * PRD: QA-009 - Provide quick-reply buttons for common responses
 */

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { QUICK_REPLIES } from '@/lib/ai/question-flow';
import { cn } from '@/lib/utils';

interface QuickRepliesProps {
  lastMessage: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

type QuickReplyCategory = keyof typeof QUICK_REPLIES;

/**
 * Detect which quick reply category to show based on the AI's last message
 */
function detectQuickReplyCategory(message: string): QuickReplyCategory | null {
  const lowerMessage = message.toLowerCase();

  // Project type detection
  if (
    lowerMessage.includes('what type of project') ||
    lowerMessage.includes('what kind of renovation') ||
    lowerMessage.includes('what are you looking to renovate') ||
    lowerMessage.includes('kitchen, bathroom, basement') ||
    (lowerMessage.includes('tell me') && lowerMessage.includes('renovating'))
  ) {
    return 'project_type';
  }

  // Finish level detection
  if (
    lowerMessage.includes('finish level') ||
    lowerMessage.includes('quality level') ||
    lowerMessage.includes('budget range') ||
    lowerMessage.includes('economy, standard, or premium') ||
    lowerMessage.includes('what quality')
  ) {
    return 'finish_level';
  }

  // Timeline detection
  if (
    lowerMessage.includes('timeline') ||
    lowerMessage.includes('when are you looking') ||
    lowerMessage.includes('when would you like') ||
    lowerMessage.includes('time frame') ||
    lowerMessage.includes('start the project')
  ) {
    return 'timeline';
  }

  // Kitchen scope detection
  if (
    lowerMessage.includes('kitchen') &&
    (lowerMessage.includes('full remodel') ||
      lowerMessage.includes('updating specific') ||
      lowerMessage.includes('scope') ||
      lowerMessage.includes('what are you looking to do'))
  ) {
    return 'kitchen_scope';
  }

  // Bathroom scope detection
  if (
    lowerMessage.includes('bathroom') &&
    (lowerMessage.includes('full renovation') ||
      lowerMessage.includes('updating fixtures') ||
      lowerMessage.includes('scope') ||
      lowerMessage.includes('tub to shower'))
  ) {
    return 'bathroom_scope';
  }

  return null;
}

export function QuickReplies({
  lastMessage,
  onSelect,
  disabled = false,
  className,
}: QuickRepliesProps) {
  const category = detectQuickReplyCategory(lastMessage);

  if (!category) {
    return null;
  }

  const replies = QUICK_REPLIES[category];

  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <div className={cn('w-full', className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {replies.map((reply) => (
            <Button
              key={reply.value}
              variant="outline"
              size="sm"
              onClick={() => onSelect(reply.label)}
              disabled={disabled}
              className="flex-shrink-0 h-9 px-4 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {reply.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
