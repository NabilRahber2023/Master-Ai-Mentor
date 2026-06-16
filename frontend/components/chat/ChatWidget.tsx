"use client";
import React, {useState} from "react";

export default function ChatWidget() {
    const [open, setOpen] = useState(false);

    return (
        <div>
            <div style={{position: "fixed", right: 20, bottom: 20, zIndex: 9999}}>
                {open && (
                    <div style={{width: 360, height: 480, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", borderRadius: 12, overflow: "hidden", background: "#071018"}}>
                        <div style={{padding: 10, background: "linear-gradient(90deg,#02202a,#042832)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                            <div>AI Mentor Chat</div>
                            <button onClick={() => setOpen(false)} style={{background: "transparent", border: "none", color: "#fff"}}>✕</button>
                        </div>
                        <div style={{padding: 12, color: "#fff"}}>
                            <p style={{fontSize: 13}}>Ask questions or start a conversation with the AI.</p>
                            <p style={{fontSize: 12, opacity: 0.8}}>This widget uses the backend chat API.</p>
                        </div>
                        <div style={{flex: 1, padding: 10}}>
                            <iframe src="/api/chatbot/ui" title="AI Mentor Chat" style={{width: "100%", height: 340, border: "none", background: "transparent"}} />
                        </div>
                    </div>
                )}
                <button onClick={() => setOpen(!open)} style={{width: 56, height: 56, borderRadius: 28, background: "linear-gradient(90deg,#00d4d4,#00a6ff)", border: "none", color: "#012"}} aria-label="Open chat">
                    💬
                </button>
            </div>
        </div>
    );
}
