"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";

export function FloatingChatbot() {
    const [open, setOpen] = useState(false);

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {open && (
                <div className="mb-3 w-[320px] rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="text-sm font-semibold">AI Chatbot</div>
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
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                        Chatbot UI is ready. Connect this panel to the backend chat endpoint when available.
                    </div>
                    <div className="border-t px-4 py-3">
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="Type your question..."
                            disabled
                        />
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
