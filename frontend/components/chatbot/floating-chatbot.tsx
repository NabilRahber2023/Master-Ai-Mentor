"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";

interface MiniMessage {
    id: string;
    sender: "user" | "ai";
    text: string;
}

/**
 * Compact floating chat widget available on every tenant page. Talks to the
 * same backend chat endpoint as the full AI Chatbot module and shares its
 * session semantics (session_id continuity, student disambiguation).
 * Hidden entirely when the org is not entitled to the ai-chatbot module.
 */
export function FloatingChatbot() {
    const tenant = useTenant();
    const [open, setOpen] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<MiniMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    // The floating widget only exists where the chatbot module is enabled.
    if (!tenant || !tenant.enabledModules.includes("ai-chatbot")) {
        return null;
    }

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setInput("");
        setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: "user", text }]);
        setSending(true);
        try {
            const res = await fetch("/api/v1/chat/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, message: text }),
            });
            if (!res.ok) throw new Error(`Chat failed (${res.status})`);
            const data = await res.json();
            if (data.session_id) setSessionId(data.session_id);
            setMessages((prev) => [
                ...prev,
                { id: `a-${Date.now()}`, sender: "ai", text: data.message ?? "…" },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-${Date.now()}`,
                    sender: "ai",
                    text: "⚠️ Could not reach the AI Mentor backend. Please try again.",
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {open && (
                <div className="mb-3 w-[320px] rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="text-sm font-semibold">AI Mentor Assistant</div>
                        </div>
                        <button
                            type="button"
                            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => setOpen(false)}
                            aria-label="Close chatbot"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3">
                        {messages.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Ask about a student — e.g. &quot;predict SGPA for Ayesha&quot;. For the
                                full console, open the{" "}
                                <Link
                                    href={`/${tenant.slug}/modules/ai-chatbot`}
                                    className="text-cyan-500 hover:underline"
                                >
                                    AI Chatbot module
                                </Link>
                                .
                            </p>
                        )}
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                                    m.sender === "user"
                                        ? "ml-6 bg-cyan-500/10 text-foreground"
                                        : "mr-6 bg-muted text-muted-foreground"
                                }`}
                            >
                                {m.text}
                            </div>
                        ))}
                        {sending && (
                            <div className="mr-6 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    <div className="flex items-center gap-2 border-t px-4 py-3">
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="Type your question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            disabled={sending}
                        />
                        <button
                            type="button"
                            onClick={send}
                            disabled={sending || !input.trim()}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-500 text-white transition-colors hover:bg-cyan-600 disabled:opacity-40"
                            aria-label="Send message"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-[var(--app-text)] shadow-lg hover:bg-cyan-600"
                onClick={() => setOpen((value) => !value)}
                aria-label="Toggle chatbot"
            >
                <Bot className="h-5 w-5" />
            </button>
        </div>
    );
}
