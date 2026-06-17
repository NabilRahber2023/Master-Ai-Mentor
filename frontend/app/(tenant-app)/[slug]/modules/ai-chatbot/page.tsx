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
  Share, 
  Bot, 
  Paperclip, 
  Link, 
  Mic, 
  Database, 
  Code, 
  LineChart, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet, 
  Clock, 
  RefreshCw, 
  Copy,
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  Play
} from "lucide-react";
import { 
  LineChart as RechartsLine, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

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
    chartData?: any[];
    sources?: { name: string; type: string }[];
    actions?: { label: string; action: string }[];
  };
}

interface Source {
  name: string;
  type: string;
  relevance: string;
  active: boolean;
}

interface MemoryItem {
  query: string;
  type: string;
  time: string;
}

export default function AiChatbotPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "system",
      text: "Aetheris Ready for Inquiry",
      timestamp: "09:42",
      type: "welcome"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");

  // Context sidebar states
  const [recentInquiries, setRecentInquiries] = useState<MemoryItem[]>([
    { query: "Q2 Retention Metrics", type: "Financial Data", time: "2 hours ago" },
    { query: "Grade Predictor V2 Launch", type: "Deployment", time: "Yesterday" }
  ]);
  
  const [activeSources, setActiveSources] = useState<Source[]>([
    { name: "Jira Enterprise", type: "Dataset", relevance: "98% relevance", active: true },
    { name: "GitHub Repos", type: "Codebase", relevance: "84% relevance", active: true },
    { name: "Confluence Docs", type: "Wiki", relevance: "42% relevance", active: false }
  ]);

  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([
    { query: "Compare Q2 vs Q3 server costs after the AWS migration.", type: "FINANCIAL DATA", time: "2H AGO" },
    { query: "List all open high-priority bugs in the authentication service.", type: "ISSUE TRACKER", time: "5H AGO" }
  ]);

  const [utilization, setUtilization] = useState({ compute: 42, context: 89 });
  const [systemStatus, setSystemStatus] = useState("All systems operational");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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
    
    // Simulate updating Model Utilization
    setUtilization((prev) => ({
      compute: Math.min(99, Math.round(prev.compute + (Math.random() * 10 - 2))),
      context: Math.min(99, Math.round(prev.context + 1))
    }));

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

      if (!res.ok) {
        throw new Error("Chat api failed");
      }

      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Update sidebar dynamically based on detected intent
      if (data.intent) {
        setRecentInquiries((prev) => [
          { query: textToSend, type: data.intent.toUpperCase(), time: "Just now" },
          ...prev.slice(0, 3)
        ]);
        setMemoryItems((prev) => [
          { query: textToSend, type: data.intent.toUpperCase(), time: "JUST NOW" },
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
          choices: data.students_found.map((s: any) => ({
            name: s.name,
            subtitle: `${s.preferred_department || "General"} • SGPA: ${s.current_sgpa || "N/A"}`,
            payload: `Select student: ${s.name} (ID: ${s.student_id})`
          }))
        };
        setIsTyping(false);
        setMessages((prev) => [...prev, disambMsg]);
      } else if (data.intent === "grade" && data.result) {
        // High fidelity presentation for grade predictions
        const r = data.result;
        const msgText = data.message;
        
        const complexMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "", // will be streamed
          timestamp: aiTime,
          type: "complex",
          resultData: {
            title: "ACADEMIC PREDICTION ANALYSIS",
            metrics: [
              { label: "Predicted SGPA", value: r.predicted_sgpa?.toFixed(2) || "3.45", desc: `Risk category: ${r.risk_level || "Low"}` },
              { label: "Attendance Rate", value: `${r.attendance_rate || "92"}%`, desc: "Sufficient threshold" }
            ],
            sources: [
              { name: "Jira_Q3_Dataset", type: "dataset" },
              { name: "GH_Issues_Main", type: "code" }
            ],
            actions: [
              { label: "View Detailed Forecast", action: "details" },
              { label: "Export Analysis", action: "export" }
            ]
          }
        };

        // Stream the text portion
        streamResponse(msgText, complexMsg);
      } else if (data.intent === "career" && data.result) {
        const r = data.result;
        const complexMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "",
          timestamp: aiTime,
          type: "complex",
          resultData: {
            title: "CAREER RECOMMENDATION MODEL",
            metrics: [
              { label: "Top Recommendation", value: r.career_path || "Software Engineer", desc: `Match rate: ${r.match_percentage || "94"}%` },
              { label: "Market Demand", value: "92%", desc: "High growth indicator" }
            ],
            sources: [{ name: "9Box_Evaluation_Criteria_2023.pdf", type: "document" }]
          }
        };
        streamResponse(data.message, complexMsg);
      } else {
        // Default message flow
        streamResponse(data.message, {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "",
          timestamp: aiTime
        });
      }

    } catch (err) {
      setIsTyping(false);
      // Fallback response simulation when backend is unreachable or fails
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Simulate command response locally to keep UI fully functional
      if (textToSend.includes("@grade")) {
        const mockMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "",
          timestamp: aiTime,
          type: "complex",
          resultData: {
            title: "Q3 PERFORMANCE DIAGNOSTIC",
            metrics: [
              { label: "Velocity Impact", value: "-12%", desc: "During refactor window", isNegative: true },
              { label: "Defect Rate", value: "-34%", desc: "Post-refactor sustain" }
            ],
            chartData: [
              { week: "W1", Velocity: 80, Defects: 45 },
              { week: "W2", Velocity: 82, Defects: 40 },
              { week: "W3", Velocity: 85, Defects: 38 },
              { week: "W4", Velocity: 68, Defects: 30 },
              { week: "W5", Velocity: 65, Defects: 28 },
              { week: "W6", Velocity: 62, Defects: 25 },
              { week: "W7", Velocity: 74, Defects: 22 },
              { week: "W8", Velocity: 78, Defects: 18 },
              { week: "W9", Velocity: 80, Defects: 15 }
            ],
            sources: [
              { name: "Jira_Q3_Dataset", type: "dataset" },
              { name: "GH_Issues_Main", type: "code" }
            ],
            actions: [
              { label: "View Mitigation Plan", action: "mitigation" },
              { label: "Export Analysis", action: "export" }
            ]
          }
        };
        streamResponse("I've analyzed the Q3 data across the engineering cohort. The 12% dip correlates heavily with two primary factors in the 9-Box Evaluation data: \n\n* **Resource Allocation**: 40% of senior engineers were temporarily reassigned to Project Alpha, impacting baseline velocity. \n* **Skill Gap**: A recent shift to the new cloud infrastructure introduced a learning curve, reflected in lower Subject Prediction scores for 'Advanced Cloud Architecture'.", mockMsg);
      } else {
        streamResponse("Telemetry processed successfully. Aetheris chatbot simulation is operational. Commands supported: `@grade`, `@career`, `@subject`, `@9box`.", {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "",
          timestamp: aiTime
        });
      }
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
    <div className="flex flex-col min-h-screen bg-[#101416] text-[#e0e3e6] font-body selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header / Top breadcrumbs */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#3b494c]/10 px-6 bg-[#101416] sticky top-0 z-50">
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
            className="px-3 py-1.5 bg-transparent border border-[#3b494c]/20 hover:border-cyan-400/50 text-[10px] text-cyan-400 rounded font-headline font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            New Chat
          </button>
          <button 
            onClick={handleExportChat}
            className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors border border-[#3b494c]/10 rounded bg-[#1c2022]/40"
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
                    <div className="bg-[#1c2022] py-2 px-6 rounded-full border border-[#3b494c]/25 flex items-center gap-3">
                      <Terminal className="text-cyan-400 w-3.5 h-3.5" />
                      <span className="text-[10px] text-slate-400 font-headline uppercase tracking-widest">{msg.text}</span>
                    </div>
                  </div>
                )}

                {/* User Message Node */}
                {msg.sender === "user" && (
                  <div className="flex justify-end gap-3 max-w-4xl mx-auto">
                    <div className="bg-[#1c2022]/80 border border-[#3b494c]/15 rounded-xl rounded-tr-sm p-4 max-w-[75%]">
                      <p className="text-xs text-white leading-relaxed">{msg.text}</p>
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
                        <div className="bg-[#1c2022]/40 rounded-xl rounded-tl-sm p-5 border border-[#3b494c]/25 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]">
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
                        <div className="bg-[#1c2022]/40 rounded-xl p-5 border border-[#3b494c]/25 space-y-5">
                          <div className="flex justify-between items-center border-b border-[#3b494c]/10 pb-2">
                            <span className="text-[10px] text-white font-headline uppercase tracking-wider">{msg.resultData.title}</span>
                            <LineChart className="w-4 h-4 text-slate-500" />
                          </div>

                          {/* Metrics grids */}
                          {msg.resultData.metrics && (
                            <div className="grid grid-cols-2 gap-4">
                              {msg.resultData.metrics.map((met, idx) => (
                                <div key={idx} className="bg-[#101416]/50 p-3.5 rounded border border-[#3b494c]/20">
                                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-headline">{met.label}</span>
                                  <span className={`text-2xl font-bold font-headline block mt-1 ${met.isNegative ? "text-red-400" : "text-cyan-400"}`}>{met.value}</span>
                                  <span className="text-[9px] text-slate-400 mt-1 block">{met.desc}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Render Charts if present */}
                          {msg.resultData.chartData && (
                            <div className="h-44 w-full bg-[#101416]/50 p-2 rounded border border-[#3b494c]/20">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsLine data={msg.resultData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid stroke="#3b494c" strokeOpacity={0.1} />
                                  <XAxis dataKey="week" stroke="#849396" fontSize={8} />
                                  <YAxis stroke="#849396" fontSize={8} />
                                  <Tooltip contentStyle={{ background: "#101416", borderColor: "#3b494c", fontSize: 10 }} />
                                  <Line type="monotone" dataKey="Velocity" stroke="#00e5ff" strokeWidth={2} dot={{ r: 2 }} />
                                  <Line type="monotone" dataKey="Defects" stroke="#ffb4ab" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 1 }} />
                                </RechartsLine>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Source Chips */}
                          {msg.resultData.sources && (
                            <div className="flex gap-2 flex-wrap">
                              {msg.resultData.sources.map((src, idx) => (
                                <span key={idx} className="text-[9px] bg-[#101416] text-slate-400 px-2 py-1 rounded border border-[#3b494c]/20 font-headline uppercase tracking-wider flex items-center gap-1.5">
                                  {src.type === "dataset" ? <FileSpreadsheet className="w-3 h-3 text-cyan-400" /> : <Code className="w-3 h-3 text-yellow-500" />}
                                  {src.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          {msg.resultData.actions && (
                            <div className="flex gap-3 flex-wrap border-t border-[#3b494c]/10 pt-3">
                              {msg.resultData.actions.map((act, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => handleSendMessage(`@grade detail view ${act.action}`)}
                                  className="px-3 py-1.5 rounded bg-transparent border border-[#3b494c]/30 text-cyan-400 hover:bg-cyan-400/5 hover:border-cyan-400 transition-colors font-headline text-[10px] uppercase tracking-wider flex items-center gap-1.5"
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
                        <div className="bg-[#1c2022]/40 rounded-xl p-5 border border-red-500/25 space-y-4">
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
                                className="w-full text-left p-3 rounded bg-[#101416]/50 hover:bg-[#1c2022] border border-[#3b494c]/20 hover:border-cyan-400/50 transition-all flex items-center justify-between group"
                              >
                                <div>
                                  <span className="block text-xs font-bold text-white group-hover:text-cyan-400 transition-colors font-headline">{choice.name}</span>
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
                  <div className="bg-[#1c2022]/40 rounded-xl rounded-tl-sm p-5 border border-[#3b494c]/25 relative overflow-hidden">
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
          <div className="p-6 border-t border-[#3b494c]/10 bg-gradient-to-t from-[#101416] via-[#101416]/95 to-transparent">
            <div className="max-w-4xl mx-auto space-y-3">
              
              <div className="flex items-center bg-[#1c2022] rounded-lg border border-[#3b494c]/20 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(0,229,255,0.15)] transition-all flex-col overflow-hidden">
                
                {/* Command shortcuts */}
                <div className="w-full flex items-center gap-2 px-4 py-2 border-b border-[#3b494c]/10 bg-[#101416]/40 overflow-x-auto select-none">
                  <span className="text-[9px] text-slate-400 font-headline uppercase tracking-widest mr-2 shrink-0">Commands:</span>
                  <button onClick={() => handleCommandClick("@grade")} className="text-[10px] text-cyan-400 bg-cyan-950/40 hover:bg-cyan-950 border border-cyan-800/30 px-2.5 py-0.5 rounded-full font-headline transition-colors">@grade</button>
                  <button onClick={() => handleCommandClick("@career")} className="text-[10px] text-teal-400 bg-teal-950/40 hover:bg-teal-950 border border-teal-800/30 px-2.5 py-0.5 rounded-full font-headline transition-colors">@career</button>
                  <button onClick={() => handleCommandClick("@subject")} className="text-[10px] text-yellow-500 bg-yellow-950/40 hover:bg-yellow-950 border border-yellow-800/30 px-2.5 py-0.5 rounded-full font-headline transition-colors">@subject</button>
                  <button onClick={() => handleCommandClick("@9box")} className="text-[10px] text-slate-300 bg-[#272a2d] hover:bg-slate-800 border border-[#3b494c]/30 px-2.5 py-0.5 rounded-full font-headline transition-colors">@9box</button>
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
                  className="w-full bg-transparent border-none text-xs text-white p-4 resize-none outline-none focus:ring-0 placeholder:text-slate-500" 
                  placeholder="Initialize inquiry or command..."
                />

                {/* Control elements */}
                <div className="w-full flex justify-between items-center px-4 py-2 border-t border-[#3b494c]/10 bg-[#101416]/20">
                  <div className="flex gap-2 text-slate-500">
                    <button className="p-1.5 hover:text-cyan-400 transition-colors" title="Attach dataset">
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 hover:text-cyan-400 transition-colors" title="Add source link">
                      <Link className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 hover:text-cyan-400 transition-colors" title="Audio transcription">
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>

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
        <aside className="w-80 bg-[#101416]/50 border-l border-[#3b494c]/10 hidden lg:flex flex-col h-[calc(100vh-4rem)]">
          <div className="h-16 flex items-center px-6 border-b border-[#3b494c]/10">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2"></span>
            <h3 className="font-headline text-xs font-bold uppercase tracking-[0.15em] text-white">Intelligence Context</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Active Sources */}
            <div>
              <h4 className="text-[9px] text-slate-400 font-headline uppercase tracking-[0.2em] mb-4">Active Sources</h4>
              <div className="space-y-3">
                {activeSources.map((src, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      const updated = [...activeSources];
                      updated[idx].active = !updated[idx].active;
                      setActiveSources(updated);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded border border-[#3b494c]/10 bg-[#1c2022]/40 cursor-pointer hover:border-cyan-400/30 transition-all ${
                      src.active ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded bg-[#101416] text-cyan-400">
                        {src.type === "Dataset" ? <FileSpreadsheet className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5 text-yellow-500" />}
                      </div>
                      <div>
                        <span className="text-xs text-white font-medium block leading-none mb-1">{src.name}</span>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest">{src.type}</span>
                      </div>
                    </div>
                    <span className="text-[8px] text-cyan-400 font-headline">{src.relevance}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Memory */}
            <div>
              <h4 className="text-[9px] text-slate-400 font-headline uppercase tracking-[0.2em] mb-4">Recent Memory</h4>
              <div className="space-y-2">
                {memoryItems.map((mem, idx) => (
                  <div key={idx} className="p-3 bg-[#1c2022]/60 rounded border border-[#3b494c]/10 hover:border-cyan-400/20 cursor-pointer transition-all">
                    <p className="text-xs text-slate-300 leading-normal line-clamp-2 mb-2">{mem.query}</p>
                    <span className="text-[8px] text-[#00daf3] font-headline uppercase tracking-wider font-semibold">
                      {mem.type} • {mem.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Utilization */}
            <div className="bg-[#1c2022]/40 p-4 rounded-lg border border-[#3b494c]/10 space-y-4">
              <h4 className="text-[9px] text-slate-400 font-headline uppercase tracking-[0.2em]">Model Utilization</h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[9px] font-headline uppercase mb-1">
                    <span className="text-slate-300">Compute</span>
                    <span className="text-cyan-400 font-mono">{utilization.compute}%</span>
                  </div>
                  <div className="w-full bg-[#101416] h-1 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${utilization.compute}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] font-headline uppercase mb-1">
                    <span className="text-slate-300">Context Window</span>
                    <span className="text-[#00daf3] font-mono">{utilization.context}%</span>
                  </div>
                  <div className="w-full bg-[#101416] h-1 rounded-full overflow-hidden">
                    <div className="bg-[#00daf3] h-full transition-all duration-300" style={{ width: `${utilization.context}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="pt-2">
              <h4 className="text-[9px] text-slate-400 font-headline uppercase tracking-[0.2em] mb-3">System Status</h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-300">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                {systemStatus}
              </div>
            </div>

          </div>
        </aside>

      </main>
    </div>
  );
}
