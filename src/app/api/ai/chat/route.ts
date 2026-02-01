import { streamText, type UserModelMessage, type AssistantModelMessage } from 'ai';
import { openai } from '@/lib/ai/providers';
import { AI_CONFIG } from '@/lib/ai/config';
import { QUOTE_ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export const runtime = 'edge';

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  data?: { images?: string[] };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Convert messages to the format expected by the AI SDK
    const formattedMessages: Array<UserModelMessage | AssistantModelMessage> = messages
      .filter((msg: IncomingMessage) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: IncomingMessage) => {
        // Handle user messages with images
        if (msg.role === 'user' && msg.data?.images && msg.data.images.length > 0) {
          return {
            role: 'user' as const,
            content: [
              { type: 'text' as const, text: msg.content },
              ...msg.data.images.map((img: string) => ({
                type: 'image' as const,
                image: img,
              })),
            ],
          };
        }

        // Handle user messages without images
        if (msg.role === 'user') {
          return {
            role: 'user' as const,
            content: msg.content,
          };
        }

        // Handle assistant messages
        return {
          role: 'assistant' as const,
          content: msg.content,
        };
      });

    const result = streamText({
      model: openai(AI_CONFIG.openai.chat),
      system: QUOTE_ASSISTANT_SYSTEM_PROMPT,
      messages: formattedMessages,
      maxOutputTokens: AI_CONFIG.parameters.chat.maxTokens,
      temperature: AI_CONFIG.parameters.chat.temperature,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
