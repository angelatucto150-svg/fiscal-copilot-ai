"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIChatMessage, ValidationRecord } from "@/types";
import { createChatMessage } from "@/services/ai.service";
import { cn } from "@/utils";

const SUGGESTED_QUESTIONS = [
  "¿Puedo usar esta factura?",
  "¿Por qué tiene riesgo?",
  "¿Qué significa riesgo moderado?",
  "¿Cómo reducir el riesgo?",
  "¿Qué revisa SUNAT?",
  "¿Qué documentos debo conservar?",
  "¿Qué es operación real?",
  "¿Qué significa RUC habido?",
  "¿Qué pasa si el proveedor está inactivo?",
  "¿Cómo funciona el semáforo?",
  "¿Cuándo procede el crédito fiscal?",
  "¿Qué son requisitos formales?",
  "¿Qué son requisitos sustanciales?",
  "¿Qué hago si el comprobante está anulado?",
  "¿Cómo interpreto el puntaje de riesgo?",
  "¿Qué pasa si falta la guía de remisión?",
  "¿Puedo registrar con RUC no habido?",
  "¿Qué observa SUNAT en una fiscalización?",
];

const INITIAL_MESSAGE =
  "Hola, soy Fiscal Copilot AI. Estoy en línea para ayudarte a interpretar el riesgo tributario de este comprobante, aclarar conceptos de crédito fiscal y orientarte sobre qué revisar antes del registro contable. Elige una pregunta sugerida o escribe la tuya.";

interface FiscalCopilotChatProps {
  validation?: ValidationRecord | null;
  compact?: boolean;
}

export function FiscalCopilotChat({
  validation,
  compact = false,
}: FiscalCopilotChatProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    createChatMessage("assistant", INITIAL_MESSAGE),
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

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
      const assistantMsg = createChatMessage(
        "assistant",
        data.response,
        validation?.id
      );
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
    <Card
      className={cn(
        "flex flex-col overflow-hidden border shadow-sm",
        compact ? "h-[520px]" : "h-[680px]"
      )}
    >
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md shadow-primary/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <span>IA Fiscal Copilot</span>
          </CardTitle>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              IA en línea
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        {/* Mensajes con scroll interno */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 scroll-smooth"
        >
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "justify-end" : "justify-start",
                index === 0 && msg.role === "assistant" && "animate-fade-in"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 max-w-[82%] text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : index === 0
                      ? "bg-primary/5 border border-primary/15 text-foreground rounded-bl-md"
                      : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 border border-secondary/20">
                  <User className="h-4 w-4 text-secondary" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analizando...
              </div>
            </div>
          )}
        </div>

        {/* Chips con scroll horizontal */}
        {!compact && (
          <div className="border-t bg-muted/20 px-4 py-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Preguntas sugeridas
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="shrink-0 whitespace-nowrap rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Caja de escritura */}
        <div className="border-t bg-card p-4">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/30 p-2 shadow-inner focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Escribe tu pregunta tributaria..."
              disabled={loading}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 rounded-lg"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
