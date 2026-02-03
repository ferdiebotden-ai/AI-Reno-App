'use client';

/**
 * Quick Replies
 * Clickable buttons for common responses to reduce friction
 * PRD: QA-009 - Provide quick-reply buttons for common responses
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { QUICK_REPLIES } from '@/lib/ai/question-flow';
import { cn } from '@/lib/utils';

interface QuickRepliesProps {
  lastMessage: string;
  lastMessageId?: string | undefined;
  onSelect: (value: string) => void;
  disabled?: boolean | undefined;
  className?: string | undefined;
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
  lastMessageId,
  onSelect,
  disabled = false,
  className,
}: QuickRepliesProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [lastSeenMessageId, setLastSeenMessageId] = useState<string | undefined>(undefined);

  const category = detectQuickReplyCategory(lastMessage);

  // Reset state when message ID changes (new AI response arrived)
  useEffect(() => {
    if (lastMessageId !== lastSeenMessageId) {
      setIsExiting(false);
      setPendingValue(null);
      setLastSeenMessageId(lastMessageId);
    }
  }, [lastMessageId, lastSeenMessageId]);

  const handleClick = useCallback(
    (value: string) => {
      if (isExiting || disabled) return;

      // Start exit animation
      setIsExiting(true);
      setPendingValue(value);

      // After animation completes, trigger the selection
      setTimeout(() => {
        onSelect(value);
      }, 250);
    },
    [isExiting, disabled, onSelect]
  );

  // Don't show quick replies when loading/disabled or no matching category
  if (disabled || !category) {
    return null;
  }

  const replies = QUICK_REPLIES[category];

  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <div
      key={lastMessageId}
      className={cn(
        'w-full transition-all duration-250 ease-out',
        isExiting && 'opacity-0 translate-y-2',
        className
      )}
    >
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {replies.map((reply) => (
            <Button
              key={reply.value}
              variant="outline"
              size="sm"
              onClick={() => handleClick(reply.label)}
              disabled={disabled || isExiting}
              className={cn(
                'flex-shrink-0 h-11 px-4 text-sm font-medium transition-all duration-200',
                'hover:bg-primary hover:text-primary-foreground',
                // Highlight the clicked button
                pendingValue === reply.label && 'bg-primary text-primary-foreground scale-95'
              )}
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
