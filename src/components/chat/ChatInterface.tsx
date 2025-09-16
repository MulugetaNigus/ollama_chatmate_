import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat';
import { ollamaService, OllamaMessage } from '@/services/ollama';
import { ChatSidebar } from '../sidebar/ChatSidebar';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { Menu, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export const ChatInterface = () => {
  const {
    currentSession,
    isLoading,
    sidebarOpen,
    ollamaUrl,
    currentModel,
    systemPrompt,
    createNewSession,
    addMessage,
    updateMessage,
    setLoading,
    setStats,
    toggleSidebar,
  } = useChatStore();

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Test Ollama connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        ollamaService.setBaseUrl(ollamaUrl);
        const isConnected = await ollamaService.testConnection();
        if (!isConnected) {
          setConnectionError('Cannot connect to Ollama. Make sure it\'s running on ' + ollamaUrl);
        } else {
          setConnectionError(null);
        }
      } catch (error) {
        setConnectionError('Failed to connect to Ollama service');
      }
    };

    testConnection();
  }, [ollamaUrl]);

  const handleSendMessage = async (content: string) => {
    if (!currentSession) {
      createNewSession();
    }

    // Add user message
    addMessage(content, 'user');
    
    // Add AI message placeholder
    const aiMessageId = addMessage('', 'assistant', true);
    
    setLoading(true);
    setIsStreaming(true);
    
    try {
      // Create new abort controller for this request
      streamControllerRef.current = new AbortController();
      
      // Prepare messages for Ollama
      const messages: OllamaMessage[] = [
        { role: 'system', content: systemPrompt },
        ...(currentSession?.messages || []).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content },
      ];

      // Stream the response
      let accumulatedResponse = '';
      const generator = ollamaService.streamChat(
        currentModel,
        messages,
        (stats) => setStats(stats)
      );

      for await (const chunk of generator) {
        if (streamControllerRef.current?.signal.aborted) {
          break;
        }
        
        accumulatedResponse += chunk;
        updateMessage(aiMessageId!, accumulatedResponse, true);
      }

      // Mark streaming as complete
      updateMessage(aiMessageId!, accumulatedResponse, false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      updateMessage(
        aiMessageId!,
        'Sorry, I encountered an error while processing your request. Please make sure Ollama is running and the model is available.',
        false
      );
    } finally {
      setLoading(false);
      setIsStreaming(false);
      streamControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    setLoading(false);
    setIsStreaming(false);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "h-8 w-8 p-0",
              sidebarOpen && "lg:hidden"
            )}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className={cn(
                "h-2 w-2 rounded-full",
                connectionError ? "bg-red-500" : "bg-green-500"
              )} />
              {connectionError ? "Disconnected" : "Connected"}
            </div>
          </div>
        </div>

        {/* Connection error alert */}
        {connectionError && (
          <Alert className="m-4 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Chat area */}
        <ChatArea />

        {/* Input area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStopGeneration}
          placeholder={connectionError ? "Fix connection to start chatting..." : "Ask me anything about code..."}
        />
      </div>
    </div>
  );
};