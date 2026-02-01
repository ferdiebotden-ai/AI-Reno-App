'use client';

/**
 * Chat Interface
 * Main container component for the AI Quote Assistant
 * Uses useChat hook from Vercel AI SDK for streaming
 */

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { EstimateSidebar } from './estimate-sidebar';
import { ProgressIndicator, detectProgressStep, type ProgressStep } from './progress-indicator';
import { QuickReplies } from './quick-replies';
import { SaveProgressModal } from './save-progress-modal';
import { compressImage, fileToBase64 } from '@/lib/utils/image';
import { Save } from 'lucide-react';

interface EstimateData {
  projectType?: string;
  areaSqft?: number;
  finishLevel?: 'economy' | 'standard' | 'premium';
  estimateLow?: number;
  estimateHigh?: number;
  breakdown?: {
    materials: number;
    labor: number;
    hst: number;
  };
}

// Helper to extract text content from UIMessage parts
function getMessageContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join('');
}

// Extended message type to include image data
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[] | undefined;
  createdAt?: Date | undefined;
}

interface ChatInterfaceProps {
  initialMessages?: ChatMessage[] | undefined;
  sessionId?: string | undefined;
}

const WELCOME_MESSAGE = "Hi! I'm your renovation assistant from Red White Reno. I'm here to help you get a preliminary estimate for your project.\n\nTo get started, you can upload a photo of your space, or just tell me what kind of renovation you're thinking about!";

export function ChatInterface({ initialMessages, sessionId: initialSessionId }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Determine starting messages
  const startingMessages: ChatMessage[] = initialMessages && initialMessages.length > 0
    ? initialMessages
    : [{ id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE }];

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(startingMessages);
  const [estimateData, setEstimateData] = useState<EstimateData>({});
  const [uploadedImages, setUploadedImages] = useState<Map<string, string[]>>(new Map());
  const [progressStep, setProgressStep] = useState<ProgressStep>('welcome');

  // Create transport with memoization to avoid recreation on every render
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/ai/chat',
  }), []);

  // Convert initial messages to UIMessage format for useChat
  const initialUIMessages = useMemo(() => {
    return startingMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: msg.content }],
    }));
  }, []);

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport,
    messages: initialUIMessages,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Sync local messages with chat messages and add image data
  useEffect(() => {
    const messagesWithImages: ChatMessage[] = messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: getMessageContent(msg),
      images: uploadedImages.get(msg.id) || undefined,
      createdAt: undefined,
    }));
    setLocalMessages(messagesWithImages);

    // Parse estimate from latest assistant message
    const lastAssistant = messagesWithImages.filter(m => m.role === 'assistant').pop();
    if (lastAssistant) {
      parseEstimateFromResponse(lastAssistant.content);
    }

    // Update progress step based on conversation
    const detectedStep = detectProgressStep(messagesWithImages);
    setProgressStep(detectedStep);
  }, [messages, uploadedImages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, isLoading]);

  // Parse estimate data from AI response
  const parseEstimateFromResponse = useCallback((content: string) => {
    // Look for JSON block in the response
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.estimate) {
          setEstimateData((prev) => ({
            ...prev,
            ...data.estimate,
          }));
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Also check for inline estimate patterns
    const estimateMatch = content.match(/\$([0-9,]+)\s*[-–]\s*\$([0-9,]+)/);
    if (estimateMatch && estimateMatch[1] && estimateMatch[2]) {
      const low = parseInt(estimateMatch[1].replace(/,/g, ''), 10);
      const high = parseInt(estimateMatch[2].replace(/,/g, ''), 10);
      if (!isNaN(low) && !isNaN(high)) {
        setEstimateData((prev) => ({
          ...prev,
          estimateLow: low,
          estimateHigh: high,
        }));
      }
    }

    // Check for project type mentions
    const projectTypes = ['kitchen', 'bathroom', 'basement', 'flooring'];
    for (const type of projectTypes) {
      if (content.toLowerCase().includes(type)) {
        setEstimateData((prev) => ({
          ...prev,
          projectType: prev.projectType || type,
        }));
        break;
      }
    }
  }, []);

  const handleSend = async (message: string, images: File[]) => {
    // Process images if any
    let imageDataUrls: string[] = [];
    let imageDescriptions = '';

    if (images.length > 0) {
      try {
        // Compress and convert images
        const processedImages = await Promise.all(
          images.map(async (file) => {
            const compressed = await compressImage(file);
            return fileToBase64(compressed);
          })
        );
        imageDataUrls = processedImages;
        imageDescriptions = `\n[User uploaded ${images.length} photo${images.length > 1 ? 's' : ''}]`;
      } catch (err) {
        console.error('Error processing images:', err);
      }
    }

    // Create the message content
    const fullMessage = message + imageDescriptions;

    // Store images for display before sending
    const tempImageKey = `temp-${Date.now()}`;
    if (imageDataUrls.length > 0) {
      setUploadedImages((prev) => {
        const next = new Map(prev);
        next.set(tempImageKey, imageDataUrls);
        return next;
      });
    }

    // Send the message using the new API with text parameter
    await sendMessage({
      text: fullMessage,
    });
  };

  // Handle quick reply selection
  const handleQuickReply = (value: string) => {
    handleSend(value, []);
  };

  // Handle save progress
  const handleSaveProgress = async (email: string) => {
    const response = await fetch('/api/sessions/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        messages: localMessages,
        extractedData: estimateData,
        sessionId,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save progress');
    }

    const data = await response.json();
    if (data.sessionId) {
      setSessionId(data.sessionId);
    }
  };

  // Get last assistant message for quick replies
  const lastAssistantMessage = localMessages
    .filter(m => m.role === 'assistant')
    .pop()?.content || '';

  // Show save button only after conversation has started
  const showSaveButton = localMessages.length > 1;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-background">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Progress indicator with save button */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <ProgressIndicator currentStep={progressStep} className="flex-1" />
            {showSaveButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveModal(true)}
                className="flex-shrink-0"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Save Progress</span>
                <span className="sm:hidden">Save</span>
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-1">
            {localMessages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                images={message.images}
                timestamp={message.createdAt}
              />
            ))}
            {isLoading && <TypingIndicator />}
            {error && (
              <div className="px-4 py-3 text-sm text-destructive">
                Something went wrong. Please try again.
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick replies */}
        <QuickReplies
          lastMessage={lastAssistantMessage}
          onSelect={handleQuickReply}
          disabled={isLoading}
          className="px-4 py-2 border-t border-border"
        />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          placeholder="Describe your renovation project..."
        />
      </div>

      {/* Estimate sidebar - desktop only */}
      <div className="hidden lg:block w-80 border-l border-border p-4 overflow-y-auto">
        <EstimateSidebar data={estimateData} isLoading={isLoading} />
      </div>

      {/* Estimate card - mobile (at bottom of chat before input) */}
      <div className="lg:hidden fixed bottom-[140px] left-4 right-4 z-10">
        {(estimateData.estimateLow || estimateData.projectType) && (
          <EstimateSidebar
            data={estimateData}
            isLoading={isLoading}
            className="shadow-lg"
          />
        )}
      </div>

      {/* Save Progress Modal */}
      <SaveProgressModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveProgress}
      />
    </div>
  );
}
