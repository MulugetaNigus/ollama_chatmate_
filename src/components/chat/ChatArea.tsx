import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { useChatStore } from '@/store/chat';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ChatArea = () => {
  const { currentSession, lastStats } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-background">
        <div className="text-center max-w-md mx-auto p-8">
          <Bot className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
          <h2 className="text-2xl font-semibold mb-2">AI Code Assistant</h2>
          <p className="text-muted-foreground mb-6">
            Start a new conversation to get help with coding questions, debugging, 
            code review, and technical explanations.
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              Connected to Ollama
            </div>
            <div>Model: deepseek-r1:1.5b</div>
            {lastStats && (
              <div>
                Last response: {lastStats.responseTime}ms 
                ({lastStats.tokensPerSecond} tokens/s)
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-chat-background">
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Chat Header */}
          <div className="sticky top-0 bg-chat-background/95 backdrop-blur-sm border-b border-border p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="font-medium">{currentSession.title}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentSession.model}
                </div>
              </div>
              {lastStats && (
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{lastStats.responseTime}ms</span>
                  <span>{lastStats.tokensPerSecond} tokens/s</span>
                  <span>{lastStats.tokensGenerated} tokens</span>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-6">
            {currentSession.messages.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              currentSession.messages.map((message) => (
                <div key={message.id} className="animate-fadeInUp">
                  <MessageBubble message={message} />
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};