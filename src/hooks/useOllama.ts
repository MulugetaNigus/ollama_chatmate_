import { useState, useEffect } from 'react';
import { ollamaService } from '@/services/ollama';
import { useChatStore } from '@/store/chat';

export const useOllama = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { ollamaUrl, setAvailableModels } = useChatStore();

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      try {
        ollamaService.setBaseUrl(ollamaUrl);
        const connected = await ollamaService.testConnection();
        setIsConnected(connected);
        
        if (connected) {
          const models = await ollamaService.getAvailableModels();
          setAvailableModels(models);
        }
      } catch (error) {
        console.error('Ollama connection error:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [ollamaUrl, setAvailableModels]);

  return { isConnected, isLoading };
};