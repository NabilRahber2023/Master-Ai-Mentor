// Round trig results so server and client render identical coordinate strings
// (prevents float last-digit hydration mismatches).
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export default function AccessibilityIcon() {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Globe */}
            <circle
                cx="100"
                cy="100"
                r="60"
                stroke="url(#globeGrad)"
                strokeWidth="3"
                fill="none"
            />

            {/* Latitude lines */}
            <ellipse cx="100" cy="100" rx="60" ry="20" stroke="url(#globeGrad)" strokeWidth="1.5" opacity="0.5" fill="none" />
            <ellipse cx="100" cy="100" rx="60" ry="40" stroke="url(#globeGrad)" strokeWidth="1.5" opacity="0.5" fill="none" />

            {/* Longitude line */}
            <ellipse cx="100" cy="100" rx="20" ry="60" stroke="url(#globeGrad)" strokeWidth="1.5" opacity="0.5" fill="none" />

            {/* 24/7 Clock indicator - rotating */}
            <g className="animate-[spin_10s_linear_infinite]" style={{ transformOrigin: '100px 100px' }}>
                <circle cx="100" cy="40" r="8" fill="url(#clockGrad)">
                    <animate
                        attributeName="opacity"
                        values="0.5;1;0.5"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle cx="100" cy="160" r="8" fill="url(#clockGrad)">
                    <animate
                        attributeName="opacity"
                        values="1;0.5;1"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </circle>
            </g>

            {/* Connection Signals */}
            <g opacity="0.6">
                {[0, 90, 180, 270].map((angle, i) => {
                    const x = r4(100 + 75 * Math.cos((angle * Math.PI) / 180));
                    const y = r4(100 + 75 * Math.sin((angle * Math.PI) / 180));
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="url(#signalGrad)">
                                <animate
                                    attributeName="r"
                                    values="4;8;4"
                                    dur="2s"
                                    begin={`${i * 0.5}s`}
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    values="1;0;1"
                                    dur="2s"
                                    begin={`${i * 0.5}s`}
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </g>
                    );
                })}
            </g>

            {/* Gradients */}
            <defs>
                <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <linearGradient id="clockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
                <linearGradient id="signalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
            </defs>
        </svg>
    );
}
