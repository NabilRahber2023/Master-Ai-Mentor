"use client";

import { useState, useRef, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Send,
  Terminal,
  Download,
  Bot,
  Code,
  LineChart,
  FileSpreadsheet,
  RefreshCw,
  Copy,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

// Interfaces
interface Message {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
  type?: "default" | "disambiguation" | "complex" | "welcome";
  choices?: { name: string; subtitle: string; payload: string }[];
  resultData?: {
    title?: string;
    metrics?: { label: string; value: string; desc: string; isNegative?: boolean }[];
    sources?: { name: string; type: string }[];
    actions?: { label: string; action: string }[];
  };
}

interface Source {
  name: string;
  type: string;
  detail: string;
  active: boolean;
}

interface MemoryItem {
  query: string;
  type: string;
  time: string;
}

/** Shapes echoed by the backend chat endpoint (see backend ChatResponse). */
interface StudentFound {
  student_id: string;
  name: string;
  preferred_department?: string | null;
  current_sgpa?: number | null;
}

interface FactorLike {
  feature: string;
  value: number | string;
  impact_score?: number;
}

export default function AiChatbotPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "system",
      text: "Aetheris Ready for Inquiry",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "welcome"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");

  // Context sidebar — populated from the real backend (chat health + dataset),
  // never from placeholder entries.
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);

  // Real session telemetry: measured round-trip latency of the last request and
  // the number of conversation turns held in the session's memory.
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [systemStatus, setSystemStatus] = useState<{ label: string; healthy: boolean }>({
    label: "Checking system status…",
    healthy: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load real system status + data sources on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Chatbot component health (LLM + dispatcher).
      let llmHealthy = false;
      let llmModel = "LLM";
      try {
        const res = await fetch("/api/v1/chat/health");
        if (res.ok) {
          const h = await res.json();
          llmHealthy = h?.llm?.status === "healthy";
          llmModel = h?.llm?.model || llmModel;
          if (!cancelled) {
            setSystemStatus(
              llmHealthy
                ? { label: "All systems operational", healthy: true }
                : { label: "LLM unavailable — fallback mode active", healthy: false },
            );
          }
        } else if (!cancelled) {
          setSystemStatus({ label: "Chat service degraded", healthy: false });
        }
      } catch {
        if (!cancelled) setSystemStatus({ label: "Backend unreachable", healthy: false });
      }

      // Tenant dataset presence (drives the "Students Dataset" source chip).
      let studentTotal: number | null = null;
      try {
        const res = await fetch("/api/v1/prediction/csv/students?search=&limit=1");
        if (res.ok) {
          const d = await res.json();
          studentTotal = typeof d?.total === "number" ? d.total : null;
        }
      } catch {
        /* dataset source will show as unavailable */
      }

      if (!cancelled) {
        setActiveSources([
          {
            name: "Students Dataset",
            type: "Dataset",
            detail: studentTotal === null ? "unavailable" : `${studentTotal} records`,
            active: studentTotal !== null && studentTotal > 0,
          },
          {
            name: "ML Prediction Engines",
            type: "Models",
            detail: "SGPA · Career · 9-Box · Subject",
            active: true,
          },
          {
            name: `Ollama (${llmModel})`,
            type: "LLM",
            detail: llmHealthy ? "healthy" : "fallback mode",
            active: llmHealthy,
          },
        ]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle command tags clicked
  const handleCommandClick = (cmd: string) => {
    setInputVal((prev) => (prev ? `${prev} ${cmd}` : cmd));
  };

  // Reset/New chat
  const handleNewChat = async () => {
    try {
      if (sessionId) {
        await fetch("/api/v1/chat/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId })
        });
      }
    } catch (err) {
      console.error("Failed to reset session on backend", err);
    }
    setSessionId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "system",
        text: "Aetheris Ready for Inquiry",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "welcome"
      }
    ]);
  };

  // Streaming Text Helper
  const streamResponse = (fullText: string, messageObj: Message) => {
    setIsTyping(true);
    let index = 0;
    setTypingText("");

    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypingText((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setMessages((prev) => [...prev, { ...messageObj, text: fullText }]);
        setTypingText("");
      }
    }, 12);
  };

  // Send message handler
  const handleSendMessage = async (customMsg?: string) => {
    const textToSend = customMsg || inputVal;
    if (!textToSend.trim()) return;

    if (!customMsg) {
      setInputVal("");
    }

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: userTime
    };

    setMessages((prev) => [...prev, userMsg]);

    // Show processing state
    setIsTyping(true);

    const startedAt = performance.now();

    try {
      // API call to backend chatbot
      const res = await fetch("/api/v1/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: textToSend
        })
      });

      setLastLatencyMs(Math.round(performance.now() - startedAt));

      if (!res.ok) {
        throw new Error("Chat api failed");
      }

      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Update session memory sidebar from the real detected intent
      if (data.intent) {
        setMemoryItems((prev) => [
          {
            query: textToSend,
            type: data.intent.toUpperCase(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev.slice(0, 3)
        ]);
      }

      // Check for custom structured views or disambiguation requirements
      if (data.requires_selection && data.students_found) {
        const disambMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.message,
          timestamp: aiTime,
          type: "disambiguation",
          choices: data.students_found.map((s: StudentFound) => ({
            name: s.name,
            subtitle: `${s.preferred_department || "General"} • SGPA: ${s.current_sgpa || "N/A"}`,
            payload: `Select student: ${s.name} (ID: ${s.student_id})`
          }))
        };
        setIsTyping(false);
        setMessages((prev) => [...prev, disambMsg]);
      } else if (data.result?.result && ["grade", "career", "subject", "9box"].includes(data.intent)) {
        // Structured prediction cards bound to the REAL nested result payload.
        const r = data.result.result;
        const studentName = data.result.student_name || "Student";
        let resultData: Message["resultData"] | undefined;

        if (data.intent === "grade") {
          const factors = (r.contributing_factors || []).slice(0, 4);
          resultData = {
            title: `ACADEMIC PREDICTION · ${studentName}`,
            metrics: [
              { label: "Predicted SGPA", value: r.predicted_sgpa?.toFixed(2) ?? "—", desc: `Risk: ${r.risk_level ?? "—"}` },
              ...(factors[0] ? [{ label: "Top Factor", value: factors[0].feature, desc: `Impact ${factors[0].impact_score?.toFixed(3)}` }] : []),
            ],
            sources: factors.map((f: FactorLike) => ({ name: `${f.feature}: ${f.value}`, type: "factor" })),
          };
        } else if (data.intent === "career") {
          const alts = r.alternative_paths || [];
          resultData = {
            title: `CAREER RECOMMENDATION · ${studentName}`,
            metrics: [
              { label: "Top Career", value: r.predicted_career ?? "—", desc: `Confidence ${Math.round((r.confidence_score ?? 0) * 100)}%` },
              ...(alts[0] ? [{ label: "Alternative", value: alts[0].career, desc: `${Math.round(alts[0].probability * 100)}% match` }] : []),
            ],
            sources: (r.contributing_factors || []).slice(0, 4).map((f: FactorLike) => ({ name: `${f.feature}: ${f.value}`, type: "factor" })),
          };
        } else if (data.intent === "subject") {
          const alts = r.alternative_options || [];
          resultData = {
            title: `SUBJECT RECOMMENDATION · ${studentName}`,
            metrics: [
              { label: "Recommended", value: r.recommended_department ?? "—", desc: `Confidence ${Math.round((r.confidence_score ?? 0) * 100)}%` },
              ...(alts[0] ? [{ label: "Alternative", value: alts[0].department, desc: `${Math.round(alts[0].probability * 100)}% match` }] : []),
            ],
            sources: (r.contributing_factors || []).slice(0, 4).map((f: FactorLike) => ({ name: `${f.feature}: ${f.value}`, type: "factor" })),
          };
        } else {
          // 9box
          resultData = {
            title: `9-BOX EVALUATION · ${studentName}`,
            metrics: [
              { label: "Position", value: r.nine_box_position_label ?? "—", desc: `Grid ${r.position_in_grid ?? "—"}` },
              { label: "Confidence", value: `${Math.round((r.confidence_score ?? 0) * 100)}%`, desc: `Perf ${r.performance_level_score}/2 · Pot ${r.potential_level_score}/2` },
            ],
            sources: r.descriptive_recommendation ? [{ name: r.descriptive_recommendation, type: "recommendation" }] : [],
          };
        }

        streamResponse(data.message, {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "",
          timestamp: aiTime,
          type: "complex",
          resultData,
        });
      } else {
        // Default message flow (search results, info, errors, missing fields, etc.)
        streamResponse(data.message, {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "",
          timestamp: aiTime
        });
      }

    } catch (err) {
      setIsTyping(false);
      // Surface the real failure instead of faking a response.
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const reason = err instanceof Error ? err.message : "Unknown error";
      streamResponse(
        `⚠️ Unable to reach the AI Mentor backend (${reason}). Please make sure the API is running on port 8001 and try again.`,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "",
          timestamp: aiTime
        }
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExportChat = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chat_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] font-body selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header / Top breadcrumbs */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--app-border)]/10 px-6 bg-[var(--app-bg)] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-headline text-slate-300 uppercase tracking-widest text-[10px]">
                  Aetheris Chat Console
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleNewChat}
            className="px-3 py-1.5 bg-transparent border border-[var(--app-border)]/20 hover:border-cyan-400/50 text-[10px] text-cyan-400 rounded font-headline font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            New Chat
          </button>
          <button 
            onClick={handleExportChat}
            className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors border border-[var(--app-border)]/10 rounded bg-[var(--app-card)]/40"
            title="Export Chat Session"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main chat layout */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00daf3]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/4"></div>

        {/* Central Chat area */}
        <div className="flex-1 flex flex-col justify-between h-[calc(100vh-4rem)] relative z-10">
          
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4">
                
                {/* System message node */}
                {msg.sender === "system" && (
                  <div className="flex justify-center my-4">
                    <div className="bg-[var(--app-card)] py-2 px-6 rounded-full border border-[var(--app-border)]/25 flex items-center gap-3">
                      <Terminal className="text-cyan-400 w-3.5 h-3.5" />
                      <span className="text-[10px] text-slate-400 font-headline uppercase tracking-widest">{msg.text}</span>
                    </div>
                  </div>
                )}

                {/* User Message Node */}
                {msg.sender === "user" && (
                  <div className="flex justify-end gap-3 max-w-4xl mx-auto">
                    <div className="bg-[var(--app-card)]/80 border border-[var(--app-border)]/15 rounded-xl rounded-tr-sm p-4 max-w-[75%]">
                      <p className="text-xs text-[var(--app-text)] leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                )}

                {/* AI Message Node */}
                {msg.sender === "ai" && (
                  <div className="flex gap-4 max-w-4xl mx-auto items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-transparent flex items-center justify-center border border-cyan-400/30 shadow-[0_0_10px_rgba(0,229,255,0.1)] shrink-0">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>

                    <div className="flex-1 space-y-4 max-w-[85%]">
                      
                      {/* Text Bubble */}
                      {msg.text && (
                        <div className="bg-[var(--app-card)]/40 rounded-xl rounded-tl-sm p-5 border border-[var(--app-border)]/25 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
                          
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] text-cyan-400 font-headline font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                              Analysis Complete
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => copyToClipboard(msg.text)} className="text-slate-400 hover:text-cyan-400 transition-colors" title="Copy response">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{msg.text}</p>
                        </div>
                      )}

                      {/* Complex predictions/visual details */}
                      {msg.resultData && (
                        <div className="bg-[var(--app-card)]/40 rounded-xl p-5 border border-[var(--app-border)]/25 space-y-5">
                          <div className="flex justify-between items-center border-b border-[var(--app-border)]/10 pb-2">
                            <span className="text-[10px] text-[var(--app-text)] font-headline uppercase tracking-wider">{msg.resultData.title}</span>
                            <LineChart className="w-4 h-4 text-slate-500" />
                          </div>

                          {/* Metrics grids */}
                          {msg.resultData.metrics && (
                            <div className="grid grid-cols-2 gap-4">
                              {msg.resultData.metrics.map((met, idx) => (
                                <div key={idx} className="bg-[var(--app-bg)]/50 p-3.5 rounded border border-[var(--app-border)]/20">
                                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-headline">{met.label}</span>
                                  <span className={`text-2xl font-bold font-headline block mt-1 ${met.isNegative ? "text-red-400" : "text-cyan-400"}`}>{met.value}</span>
                                  <span className="text-[9px] text-slate-400 mt-1 block">{met.desc}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Source Chips */}
                          {msg.resultData.sources && (
                            <div className="flex gap-2 flex-wrap">
                              {msg.resultData.sources.map((src, idx) => (
                                <span key={idx} className="text-[9px] bg-[var(--app-bg)] text-slate-400 px-2 py-1 rounded border border-[var(--app-border)]/20 font-headline uppercase tracking-wider flex items-center gap-1.5">
                                  {src.type === "dataset" ? <FileSpreadsheet className="w-3 h-3 text-cyan-400" /> : <Code className="w-3 h-3 text-yellow-500" />}
                                  {src.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          {msg.resultData.actions && (
                            <div className="flex gap-3 flex-wrap border-t border-[var(--app-border)]/10 pt-3">
                              {msg.resultData.actions.map((act, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => handleSendMessage(`@grade detail view ${act.action}`)}
                                  className="px-3 py-1.5 rounded bg-transparent border border-[var(--app-border)]/30 text-cyan-400 hover:bg-cyan-400/5 hover:border-cyan-400 transition-colors font-headline text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                                >
                                  {act.label}
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              ))}
                            </div>
                          )}

                        </div>
                      )}

                      {/* Disambiguation matching */}
                      {msg.type === "disambiguation" && msg.choices && (
                        <div className="bg-[var(--app-card)]/40 rounded-xl p-5 border border-red-500/25 space-y-4">
                          <h4 className="text-red-400 text-xs font-headline uppercase tracking-[0.1em] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Action Required: Disambiguation
                          </h4>
                          <p className="text-xs text-slate-300 leading-normal">{msg.text}</p>
                          <div className="space-y-2">
                            {msg.choices.map((choice, cidx) => (
                              <button 
                                key={cidx}
                                onClick={() => handleSendMessage(choice.payload)}
                                className="w-full text-left p-3 rounded bg-[var(--app-bg)]/50 hover:bg-[var(--app-card)] border border-[var(--app-border)]/20 hover:border-cyan-400/50 transition-all flex items-center justify-between group"
                              >
                                <div>
                                  <span className="block text-xs font-bold text-[var(--app-text)] group-hover:text-cyan-400 transition-colors font-headline">{choice.name}</span>
                                  <span className="block text-[9px] text-slate-400 uppercase tracking-widest mt-1">{choice.subtitle}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>
            ))}

            {/* Simulated typing animation */}
            {isTyping && (
              <div className="flex gap-4 max-w-4xl mx-auto items-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-transparent flex items-center justify-center border border-cyan-400/30 shrink-0">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="space-y-4 max-w-[85%]">
                  <div className="bg-[var(--app-card)]/40 rounded-xl rounded-tl-sm p-5 border border-[var(--app-border)]/25 relative overflow-hidden">
                    {typingText ? (
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {typingText}
                        <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse"></span>
                      </p>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-300"></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* User Input & Commands Container */}
          <div className="p-6 border-t border-[var(--app-border)]/10 bg-gradient-to-t from-[var(--app-bg)] via-[var(--app-bg)]/95 to-transparent">
            <div className="max-w-4xl mx-auto space-y-3">
              
              <div className="flex items-center bg-[var(--app-card)] rounded-lg border border-[var(--app-border)]/20 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(0,229,255,0.15)] transition-all flex-col overflow-hidden">
                
                {/* Command shortcuts */}
                <div className="w-full flex items-center gap-2 px-4 py-2 border-b border-[var(--app-border)]/10 bg-[var(--app-bg)]/40 overflow-x-auto select-none">
                  <span className="text-[9px] text-slate-400 font-headline uppercase tracking-widest mr-2 shrink-0">Commands:</span>
                  <button onClick={() => handleCommandClick("@grade")} className="text-[10px] text-cyan-400 bg-cyan-950/40 hover:bg-cyan-950 border border-cyan-800/30 px-2.5 py-0.5 rounded-full font-headline transition-colors">@grade</button>
                  <button onClick={() => handleCommandClick("@career")} className="text-[10px] text-teal-400 bg-teal-950/40 hover:bg-teal-950 border border-teal-800/30 px-2.5 py-0.5 rounded-full font-headline transition-colors">@career</button>
                  <button onClick={() => handleCommandClick("@subject")} className="text-[10px] text-yellow-500 bg-yellow-950/40 hover:bg-yellow-950 border border-yellow-800/30 px-2.5 py-0.5 rounded-full font-headline transition-colors">@subject</button>
                  <button onClick={() => handleCommandClick("@9box")} className="text-[10px] text-slate-300 bg-[var(--app-surface)] hover:bg-slate-800 border border-[var(--app-border)]/30 px-2.5 py-0.5 rounded-full font-headline transition-colors">@9box</button>
                </div>

                {/* Input Textbox */}
                <textarea 
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  className="w-full bg-transparent border-none text-xs text-[var(--app-text)] p-4 resize-none outline-none focus:ring-0 placeholder:text-slate-500" 
                  placeholder="Initialize inquiry or command..."
                />

                {/* Control elements */}
                <div className="w-full flex justify-between items-center px-4 py-2 border-t border-[var(--app-border)]/10 bg-[var(--app-bg)]/20">
                  <span className="text-[9px] text-slate-500 font-headline uppercase tracking-widest">
                    Enter to send • Shift+Enter for newline
                  </span>

                  <button
                    onClick={() => handleSendMessage()}
                    className="p-2 bg-gradient-to-r from-cyan-400 to-[#44d8f1] hover:from-cyan-300 hover:to-cyan-400 text-[#101416] rounded-md transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              <div className="text-center">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-headline">Aetheris OS Core Model • May hallucinate performance details</span>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Intelligence Context Sidebar */}
        <aside className="w-80 bg-[var(--app-bg)]/50 border-l border-[var(--app-border)]/10 hidden lg:flex flex-col h-[calc(100vh-4rem)]">
          <div className="h-16 flex items-center px-6 border-b border-[var(--app-border)]/10">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2"></span>
            <h3 className="font-headline text-xs font-bold uppercase tracking-[0.15em] text-[var(--app-text)]">Intelligence Context</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Active Sources — real backend components + live status */}
            <div>
              <h4 className="text-[9px] text-slate-400 font-headline uppercase tracking-[0.2em] mb-4">Active Sources</h4>
              <div className="space-y-3">
                {activeSources.length === 0 && (
                  <p className="text-[10px] text-slate-500">Loading sources…</p>
                )}
                {activeSources.map((src, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded border border-[var(--app-border)]/10 bg-[var(--app-card)]/40 transition-all ${
                      src.active ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded bg-[var(--app-bg)] text-cyan-400">
                        {src.type === "Dataset" ? <FileSpreadsheet className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5 text-yellow-500" />}
                      </div>
                      <div>
                        <span className="text-xs text-[var(--app-text)] font-medium block leading-none mb-1">{src.name}</span>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest">{src.type}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-headline ${src.active ? "text-cyan-400" : "text-red-400"}`}>{src.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Memory — this session's real queries + detected intents */}
            <div>
              <h4 className="text-[9px] text-slate-400 font-headline uppercase tracking-[0.2em] mb-4">Recent Memory</h4>
              <div className="space-y-2">
                {memoryItems.length === 0 && (
                  <p className="text-[10px] text-slate-500">
                    No inquiries yet — your session history will appear here.
                  </p>
                )}
                {memoryItems.map((mem, idx) => (
                  <div
                    key={idx}
                    onClick={() => setInputVal(mem.query)}
                    className="p-3 bg-[var(--app-card)]/60 rounded border border-[var(--app-border)]/10 hover:border-cyan-400/20 cursor-pointer transition-all"
                    title="Click to reuse this query"
                  >
                    <p className="text-xs text-slate-300 leading-normal line-clamp-2 mb-2">{mem.query}</p>
                    <span className="text-[8px] text-[#00daf3] font-headline uppercase tracking-wider font-semibold">
                      {mem.type} • {mem.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Telemetry — real measured values */}
            <div className="bg-[var(--app-card)]/40 p-4 rounded-lg border border-[var(--app-border)]/10 space-y-4">
              <h4 className="text-[9px] text-slate-400 font-headline uppercase tracking-[0.2em]">Session Telemetry</h4>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[9px] font-headline uppercase mb-1">
                    <span className="text-slate-300">Last Response</span>
                    <span className="text-cyan-400 font-mono">
                      {lastLatencyMs === null ? "—" : lastLatencyMs < 1000 ? `${lastLatencyMs}ms` : `${(lastLatencyMs / 1000).toFixed(1)}s`}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--app-bg)] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${lastLatencyMs === null ? 0 : Math.min(100, (lastLatencyMs / 10000) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] font-headline uppercase mb-1">
                    <span className="text-slate-300">Conversation Turns</span>
                    <span className="text-[#00daf3] font-mono">
                      {messages.filter((m) => m.sender === "user").length}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--app-bg)] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00daf3] h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, messages.filter((m) => m.sender === "user").length * 5)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status — from /api/v1/chat/health */}
            <div className="pt-2">
              <h4 className="text-[9px] text-slate-400 font-headline uppercase tracking-[0.2em] mb-3">System Status</h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-300">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${systemStatus.healthy ? "bg-green-400" : "bg-red-400"}`}></span>
                {systemStatus.label}
              </div>
            </div>

          </div>
        </aside>

      </main>
    </div>
  );
}
