import { OllamaStats } from '@/store/chat';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama connection test failed:', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      return data.models?.map((model: OllamaModel) => model.name) || [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  async *streamChat(
    model: string,
    messages: OllamaMessage[],
    onStats?: (stats: OllamaStats) => void
  ): AsyncGenerator<string, void, unknown> {
    const startTime = Date.now();
    let totalTokens = 0;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data: OllamaResponse = JSON.parse(line);
                if (data.response) {
                  totalTokens++;
                  yield data.response;
                }
                
                if (data.done && onStats) {
                  const endTime = Date.now();
                  const responseTime = endTime - startTime;
                  const tokensPerSecond = totalTokens / (responseTime / 1000);
                  
                  onStats({
                    responseTime,
                    tokensGenerated: totalTokens,
                    tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
                  });
                }
              } catch (parseError) {
                console.warn('Failed to parse JSON line:', line, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Stream chat error:', error);
      throw error;
    }
  }

  async sendMessage(
    model: string,
    messages: OllamaMessage[]
  ): Promise<{ content: string; stats: OllamaStats }> {
    const startTime = Date.now();
    let fullResponse = '';
    let tokenCount = 0;

    const generator = this.streamChat(model, messages);
    
    for await (const chunk of generator) {
      fullResponse += chunk;
      tokenCount++;
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const tokensPerSecond = tokenCount / (responseTime / 1000);

    return {
      content: fullResponse,
      stats: {
        responseTime,
        tokensGenerated: tokenCount,
        tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
      },
    };
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

export const ollamaService = new OllamaService();