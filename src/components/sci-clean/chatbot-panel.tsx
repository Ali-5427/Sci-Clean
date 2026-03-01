'use client';

import { useState, useRef, useEffect } from 'react';
import type { ProcessedCsvData, ChatMessage } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, MessageSquare } from 'lucide-react';
import { chatWithContext } from '@/ai/flows/chatbot-flow';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
    const historyForAi = [...messages, userMessage];
    
    setMessages(prev => [...prev, userMessage]);
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
        messages: historyForAi,
        csvContext,
      });

      const modelMessage: ChatMessage = { role: 'model', content: modelResponse || "I couldn't generate a response." };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      const modelMessage: ChatMessage = { role: 'model', content: `Sorry, I ran into an error: ${errorMessage}` };
      setMessages(prev => [...prev, modelMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!processedData) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" className="w-14 h-14 rounded-full shadow-2xl animate-in fade-in zoom-in duration-300">
          <MessageSquare className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md flex flex-col h-full bg-card border-l border-border">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl font-headline">
            <Bot className="text-primary" />
            Data Assistant
          </SheetTitle>
          <SheetDescription>
            Ask questions about your research data in {processedData.fileName}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 gap-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'model' && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary shrink-0 mt-1">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}
                  <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] break-words ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground shrink-0 mt-1">
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
                    <div className="p-3 space-y-2 rounded-lg bg-muted flex-1">
                      <Skeleton className="h-3 w-[80%]" />
                      <Skeleton className="h-3 w-[60%]" />
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2 pt-4 border-t border-border">
            <Input
              placeholder="Ask about your data..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              className="bg-background"
            />
            <Button onClick={handleSendMessage} disabled={isLoading} size="icon" className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatbotPanel;
