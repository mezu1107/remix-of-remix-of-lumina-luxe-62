import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const SUGGESTIONS = [
  "A gold dress watch under Rs 500,000",
  "Which piece suits daily wear and swimming?",
  "What is your return policy?",
];

/** Renders assistant text with support for [label](/path) links and simple bullets. */
function RichText({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const bullet = /^[-*•]\s+/.test(line);
        const content = bullet ? line.replace(/^[-*•]\s+/, "") : line;
        const parts: React.ReactNode[] = [];
        const re = /\[([^\]]+)\]\(([^)]+)\)/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content))) {
          if (m.index > last) parts.push(strip(content.slice(last, m.index)));
          const href = m[2];
          parts.push(
            href.startsWith("/") ? (
              <Link key={`${i}-${m.index}`} to={href as any} className="text-primary underline underline-offset-2">
                {m[1]}
              </Link>
            ) : (
              <span key={`${i}-${m.index}`}>{m[1]}</span>
            ),
          );
          last = m.index + m[0].length;
        }
        parts.push(strip(content.slice(last)));
        return (
          <p key={i} className={cn("text-sm leading-relaxed", bullet && "pl-3 before:content-['·'] before:mr-2")}>
            {parts}
          </p>
        );
      })}
    </div>
  );
}
const strip = (s: string) => s.replace(/\*\*/g, "").replace(/^#+\s*/gm, "");

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (open && !busy) inputRef.current?.focus();
  }, [open, busy]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    void sendMessage({ text: value });
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close the Timera concierge" : "Ask the Timera concierge"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[70vh] max-h-[560px] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">AI Concierge</p>
            <h2 className="font-serif text-lg">Ask about our watches</h2>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  I can help you choose a timepiece, compare specifications, or explain shipping, returns and warranty.
                </p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm transition hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = m.parts
                .map((p: any) => (p.type === "text" ? p.text : ""))
                .join("")
                .trim();
              if (!text) return null;
              return (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <RichText text={text} />
                  </div>
                </div>
              );
            })}

            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">
                  {error.message?.slice(0, 220) || "The concierge is unavailable right now."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can also reach a human on WhatsApp — the green button on the right.
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-end gap-2 border-t border-border p-3"
          >
            <Textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              placeholder="Ask anything about Timera…"
              className="max-h-28 min-h-[2.75rem] resize-none"
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send message">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="px-4 pb-3 text-[10px] text-muted-foreground">
            AI answers can be imperfect — product pages are the source of truth. Never share payment details here.
          </p>
        </div>
      )}
    </>
  );
}
