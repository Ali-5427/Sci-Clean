'use client';

import { useState, useRef, useEffect } from 'react';
import { chatWithContext } from '@/ai/flows/chatbot-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles, MessageSquare } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ProcessedCsvData } from '@/lib/types';

interface ChatbotPanelProps {
  processedData?: ProcessedCsvData | null;
}

const ChatbotPanel = ({ processedData }: ChatbotPanelProps) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hi there! I'm your Sci-Clean Research Assistant. I've got your data ready to analyze. How can I help you clean or explore it today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const context = processedData 
      ? `The user has uploaded a file named "${processedData.fileName}". 
         It contains ${processedData.rowCount.toLocaleString()} rows and ${processedData.columnCount} columns. 
         Overall, about ${processedData.sparsityScore.toFixed(2)}% of the data is missing. 
         We've flagged ${processedData.anomaliesFound} potential anomalies across the dataset.
         Key columns include: ${processedData.columnProfiles.map(p => `${p.name} (${p.missingPercentage.toFixed(1)}% missing)`).join(', ')}.`
      : "The user hasn't uploaded a file yet. Please encourage them to drag and drop a CSV to get started.";

    try {
      const response = await chatWithContext({
        message: userMessage,
        history: messages,
        context: context
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting to my brain right now! Please double-check the API configuration." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform bg-primary text-primary-foreground z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0 flex flex-col pointer-events-auto">
        <SheetHeader className="p-6 border-b bg-card/50">
          <SheetTitle className="flex items-center gap-2 text-xl font-headline">
            <Sparkles className="w-6 h-6 text-primary" />
            Research Assistant
          </SheetTitle>
          <SheetDescription>
            Conversational data cleaning and insights for {processedData?.fileName || "your research"}.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col bg-background/50">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card border border-border rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none text-sm bg-card border border-border animate-pulse text-muted-foreground">
                    Just a moment, I'm thinking...
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          
          <div className="p-6 border-t bg-card/80 backdrop-blur-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Ask me a question about your data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="bg-background border-primary/20 focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="mt-2 text-[10px] text-center text-muted-foreground uppercase tracking-widest">
              Powered by Groq Llama 3.3
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatbotPanel;
