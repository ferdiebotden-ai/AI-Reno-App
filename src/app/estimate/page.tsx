import { Metadata } from 'next';
import { ChatInterface } from '@/components/chat/chat-interface';

export const metadata: Metadata = {
  title: 'Get an Instant Estimate | Red White Reno',
  description: 'Chat with our AI assistant to get a preliminary renovation estimate in minutes. Upload photos of your space and describe your project.',
};

export default function EstimatePage() {
  return (
    <main className="min-h-screen">
      <ChatInterface />
    </main>
  );
}
