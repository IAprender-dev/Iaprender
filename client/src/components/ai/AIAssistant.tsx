import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { SendHorizontal, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIMessage } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AIAssistantProps {
  role: "student" | "teacher";
}

export default function AIAssistant({ role }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "1",
      sender: "ai",
      content: role === "teacher" 
        ? "Olá! Como posso ajudar você hoje? Precisa de apoio com algum plano de aula ou criação de material didático?"
        : "Olá! Precisa de ajuda com as próximas tarefas ou com algum conceito que está estudando?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const form = useForm({
    defaultValues: {
      message: ""
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getQuickPrompts = () => {
    if (role === "teacher") {
      return [
        "Plano de aula sobre frações",
        "Atividade de álgebra",
        "Gerar imagem didática"
      ];
    } else {
      return [
        "Como resolver equações de 2º grau?",
        "Resumo sobre Brasil Império",
        "Ajuda com a redação"
      ];
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    form.setValue("message", prompt);
    handleSubmit({ message: prompt });
  };

  const handleSubmit = async (data: { message: string }) => {
    if (!data.message.trim()) return;

    // Add user message to the chat
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: data.message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    form.reset();
    setIsLoading(true);

    try {
      // Call AI assistant API
      const response = await apiRequest("POST", "/api/ai/assistant", {
        message: data.message,
        role
      });

      const aiResponse = await response.json();

      // Add AI response to the chat
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: aiResponse.content || "Desculpe, não consegui processar sua solicitação.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      
      // Add error message
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {role === "teacher" ? "Assistente Virtual" : "Assistente de Estudos"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden pb-4">
        <ScrollArea className="flex-grow pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className={`h-8 w-8 ${message.sender === 'user' ? 'ml-2' : 'mr-2'}`}>
                    <AvatarFallback className={message.sender === 'user' ? 'bg-primary text-white' : 'bg-primary-50 text-primary'}>
                      {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                    <AvatarImage src={message.sender === 'user' ? '/user-avatar.png' : '/ai-avatar.png'} />
                  </Avatar>
                  <div className={`rounded-lg px-4 py-3 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-neutral-100 text-neutral-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs text-right mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[80%]">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-primary-50 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-4 py-3 bg-neutral-100 text-neutral-800">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <p className="text-sm">Escrevendo...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t border-neutral-200 pt-4">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex">
              <Input
                {...form.register("message")}
                placeholder={`Digite sua pergunta...`}
                className="flex-1 rounded-r-none"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                className="rounded-l-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {getQuickPrompts().map((prompt, index) => (
              <Button
                key={index}
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
