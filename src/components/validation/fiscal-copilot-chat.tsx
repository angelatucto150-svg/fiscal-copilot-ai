"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIChatMessage, ValidationRecord } from "@/types";
import { createChatMessage } from "@/services/ai.service";
import { cn } from "@/utils";

const SUGGESTED_QUESTIONS = [
  "¿Puedo usar esta factura?",
  "¿Qué significa operación real?",
  "¿Por qué este comprobante tiene riesgo?",
  "¿Qué documento me falta?",
  "¿Cómo reduzco el riesgo?",
];

interface FiscalCopilotChatProps {
  validation?: ValidationRecord | null;
  compact?: boolean;
}

export function FiscalCopilotChat({ validation, compact = false }: FiscalCopilotChatProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    createChatMessage(
      "assistant",
      "¡Hola! Soy Fiscal Copilot AI. Puedo ayudarte con preguntas sobre crédito fiscal, requisitos de comprobantes y riesgo tributario. ¿En qué te puedo ayudar?"
    ),
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = createChatMessage("user", text, validation?.id);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          validationId: validation?.id,
          history: messages,
        }),
      });
      const data = await res.json();
      const assistantMsg = createChatMessage("assistant", data.response, validation?.id);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg = createChatMessage(
        "assistant",
        "Lo siento, hubo un error al procesar tu consulta. Intenta de nuevo."
      );
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn("flex flex-col", compact ? "h-[400px]" : "h-[500px]")}>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Bot className="h-4 w-4 text-white" />
          </div>
          IA Fiscal Copilot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-xl px-3 py-2 max-w-[80%] text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                  <User className="h-3.5 w-3.5 text-secondary" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando...
            </div>
          )}
        </div>

        {!compact && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-[10px] px-2 py-1 rounded-full border bg-background hover:bg-accent transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Escribe tu pregunta tributaria..."
            disabled={loading}
          />
          <Button size="icon" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
