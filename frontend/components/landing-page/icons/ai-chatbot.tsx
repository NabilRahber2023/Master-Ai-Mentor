import React from 'react';

const AIChatbot = () => {
    const styles = `
        @keyframes messagePulse {
            0%, 100% {
                transform: scale(1);
                opacity: 0.8;
            }
            50% {
                transform: scale(1.05);
                opacity: 1;
            }
        }

        @keyframes brainGlow {
            0%, 100% {
                opacity: 0.6;
                filter: drop-shadow(0 0 4px var(--ray-color));
            }
            50% {
                opacity: 1;
                filter: drop-shadow(0 0 12px var(--ray-color));
            }
        }

        @keyframes dotBounce {
            0%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-5px);
            }
        }

        .chat-bubble {
            animation: messagePulse 2s ease-in-out infinite;
        }

        .brain-icon {
            animation: brainGlow 3s ease-in-out infinite;
        }

        .typing-dot-1 {
            animation: dotBounce 1.4s infinite;
        }

        .typing-dot-2 {
            animation: dotBounce 1.4s infinite 0.2s;
        }

        .typing-dot-3 {
            animation: dotBounce 1.4s infinite 0.4s;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <svg width="120" height="110" viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="chatbotGradient" x1="60" y1="10" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--ray-color)" />
                        <stop offset="1" stopColor="rgba(0,71,71,1)" />
                    </linearGradient>
                </defs>

                {/* Main chat bubble */}
                <path
                    d="M 25 30 Q 25 20 35 20 L 85 20 Q 95 20 95 30 L 95 60 Q 95 70 85 70 L 50 70 L 35 85 L 35 70 Q 25 70 25 60 Z"
                    fill="url(#chatbotGradient)"
                    fillOpacity="0.8"
                    className="chat-bubble"
                />

                {/* AI Brain symbol inside bubble */}
                <g className="brain-icon">
                    {/* Brain outline */}
                    <path
                        d="M 50 35 Q 45 35 45 40 Q 45 42 46 43 Q 44 44 44 47 Q 44 50 47 51 Q 47 53 49 54 L 71 54 Q 73 53 73 51 Q 76 50 76 47 Q 76 44 74 43 Q 75 42 75 40 Q 75 35 70 35 Q 68 32 65 32 L 55 32 Q 52 32 50 35 Z"
                        fill="currentColor"
                        fillOpacity="0.9"
                    />
                    {/* Brain details */}
                    <path d="M 52 38 Q 54 40 56 38" stroke="#004747" strokeWidth="1" fill="none" />
                    <path d="M 64 38 Q 66 40 68 38" stroke="#004747" strokeWidth="1" fill="none" />
                    <path d="M 50 45 Q 52 47 54 45" stroke="#004747" strokeWidth="1" fill="none" />
                    <path d="M 66 45 Q 68 47 70 45" stroke="#004747" strokeWidth="1" fill="none" />
                </g>

                {/* Secondary chat bubble (response) */}
                <path
                    d="M 30 75 Q 30 70 35 70 L 70 70 Q 75 70 75 75 L 75 90 Q 75 95 70 95 L 35 95 Q 30 95 30 90 Z"
                    fill="url(#chatbotGradient)"
                    fillOpacity="0.5"
                />

                {/* Typing indicator dots */}
                <circle cx="45" cy="82.5" r="2.5" fill="currentColor" className="typing-dot-1" />
                <circle cx="52.5" cy="82.5" r="2.5" fill="currentColor" className="typing-dot-2" />
                <circle cx="60" cy="82.5" r="2.5" fill="currentColor" className="typing-dot-3" />

                {/* Connection lines */}
                <path d="M 60 15 L 60 20" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                <circle cx="60" cy="12" r="3" fill="currentColor" opacity="0.7" />
            </svg>
        </>
    );
};

export default AIChatbot;
