'use client';

import { useState, useRef, useEffect } from 'react';
import type { ProcessedCsvData, ChatMessage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User } from 'lucide-react';
import { chatWithContext } from '@/ai/flows/chatbot-flow';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatbotPanelProps {
  processedData: ProcessedCsvData | null;
}

const ChatbotPanel = ({ processedData }: ChatbotPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: "Hello! I'm ready to help. Ask me anything about your uploaded file or any general questions you might have.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth'});
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !processedData) return;

    const userMessage: ChatMessage = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const csvContext = {
        fileName: processedData.fileName,
        rowCount: processedData.rowCount,
        columnCount: processedData.columnCount,
        sparsityScore: processedData.sparsityScore,
        columnNames: processedData.columnProfiles.map(p => p.name),
      };
      
      const modelResponse = await chatWithContext({
        messages: newMessages,
        csvContext,
      });

      const modelMessage: ChatMessage = { role: 'model', content: modelResponse };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      const modelMessage: ChatMessage = { role: 'model', content: `Sorry, I ran into an error: ${errorMessage}` };
      setMessages(prev => [...prev, modelMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !processedData;

  return (
    <Card className={`flex flex-col ${isDisabled ? 'bg-muted/50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-headline">
          <Bot />
          Data Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4">
        <ScrollArea className="flex-1 h-72 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'model' && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div className={`rounded-lg px-3 py-2 text-sm max-w-xs md:max-w-sm break-words ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                 <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary shrink-0">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="p-2 space-y-2 rounded-lg bg-muted">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            placeholder={isDisabled ? "Process a file to chat" : "Ask about your data..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isDisabled || isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isDisabled || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotPanel;
