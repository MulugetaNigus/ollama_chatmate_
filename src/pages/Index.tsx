import { ChatInterface } from '@/components/chat/ChatInterface';
import { useChatStore } from '@/store/chat';
import { useEffect } from 'react';

const Index = () => {
  const { createNewSession, currentSession } = useChatStore();

  // Create initial session if none exists
  useEffect(() => {
    if (!currentSession) {
      createNewSession();
    }
  }, [currentSession, createNewSession]);

  return <ChatInterface />;
};

export default Index;
