import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export const ChatInput = ({ 
  onSendMessage, 
  isLoading, 
  onStop,
  placeholder = "Ask me anything about code..." 
}: ChatInputProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isLoading) {
      onSendMessage(trimmedInput);
      setInput('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  // Focus on textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "chat-input min-h-[50px] max-h-[150px] resize-none pr-12",
              "focus:ring-2 focus:ring-primary focus:border-transparent"
            )}
            rows={1}
          />
          <div className="absolute right-2 bottom-2">
            {isLoading ? (
              <Button
                onClick={handleStop}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                size="sm"
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="hidden sm:inline">
            {input.length > 0 && `${input.length} characters`}
          </span>
        </div>
      </div>
    </div>
  );
};