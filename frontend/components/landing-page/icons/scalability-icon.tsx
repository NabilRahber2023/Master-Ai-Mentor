export default function ScalabilityIcon() {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Central Node */}
            <circle
                cx="100"
                cy="100"
                r="16"
                fill="url(#grad1)"
                className="animate-pulse"
            />

            {/* Inner Ring - 6 nodes */}
            <g className="animate-[spin_20s_linear_infinite]" style={{ transformOrigin: '100px 100px' }}>
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                    const x = 100 + 40 * Math.cos((angle * Math.PI) / 180);
                    const y = 100 + 40 * Math.sin((angle * Math.PI) / 180);
                    return (
                        <g key={i}>
                            <line
                                x1="100"
                                y1="100"
                                x2={x}
                                y2={y}
                                stroke="url(#grad2)"
                                strokeWidth="2"
                                opacity="0.4"
                            />
                            <circle cx={x} cy={y} r="8" fill="url(#grad1)" />
                        </g>
                    );
                })}
            </g>

            {/* Outer Ring - 12 nodes */}
            <g className="animate-[spin_30s_linear_infinite_reverse]" style={{ transformOrigin: '100px 100px' }}>
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
                    const x = 100 + 70 * Math.cos((angle * Math.PI) / 180);
                    const y = 100 + 70 * Math.sin((angle * Math.PI) / 180);
                    return (
                        <g key={i}>
                            <line
                                x1="100"
                                y1="100"
                                x2={x}
                                y2={y}
                                stroke="url(#grad3)"
                                strokeWidth="1.5"
                                opacity="0.2"
                            />
                            <circle cx={x} cy={y} r="6" fill="url(#grad2)" opacity="0.8" />
                        </g>
                    );
                })}
            </g>

            {/* Gradients */}
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
                </linearGradient>
            </defs>
        </svg>
    );
}
