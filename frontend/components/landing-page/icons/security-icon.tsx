export default function SecurityIcon() {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Shield Outline */}
            <path
                d="M100 20 L160 50 L160 100 C160 140 130 170 100 180 C70 170 40 140 40 100 L40 50 Z"
                fill="url(#shieldBg)"
                stroke="url(#shieldStroke)"
                strokeWidth="3"
            />

            {/* Lock */}
            <g>
                {/* Lock Body */}
                <rect
                    x="80"
                    y="100"
                    width="40"
                    height="40"
                    rx="4"
                    fill="url(#lockGrad)"
                    stroke="url(#lockStroke)"
                    strokeWidth="2"
                />

                {/* Lock Shackle */}
                <path
                    d="M85 100 L85 85 C85 76.716 91.716 70 100 70 C108.284 70 115 76.716 115 85 L115 100"
                    stroke="url(#lockStroke)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Keyhole */}
                <circle cx="100" cy="115" r="5" fill="#164e63" />
                <rect x="98" y="115" width="4" height="12" rx="2" fill="#164e63" />
            </g>

            {/* Circuit Pattern */}
            <g opacity="0.3">
                {/* Horizontal lines */}
                <line x1="50" y1="60" x2="70" y2="60" stroke="url(#circuitGrad)" strokeWidth="2" />
                <line x1="130" y1="60" x2="150" y2="60" stroke="url(#circuitGrad)" strokeWidth="2" />
                <line x1="50" y1="150" x2="70" y2="150" stroke="url(#circuitGrad)" strokeWidth="2" />
                <line x1="130" y1="150" x2="150" y2="150" stroke="url(#circuitGrad)" strokeWidth="2" />

                {/* Vertical lines */}
                <line x1="60" y1="50" x2="60" y2="70" stroke="url(#circuitGrad)" strokeWidth="2" />
                <line x1="140" y1="50" x2="140" y2="70" stroke="url(#circuitGrad)" strokeWidth="2" />

                {/* Nodes */}
                <circle cx="60" cy="60" r="3" fill="#06b6d4" />
                <circle cx="140" cy="60" r="3" fill="#06b6d4" />
                <circle cx="60" cy="150" r="3" fill="#06b6d4" />
                <circle cx="140" cy="150" r="3" fill="#06b6d4" />
            </g>

            {/* Encryption particles */}
            {[
                { x: 55, y: 80, delay: 0 },
                { x: 145, y: 85, delay: 0.5 },
                { x: 50, y: 120, delay: 1 },
                { x: 150, y: 125, delay: 1.5 }
            ].map((particle, i) => (
                <text
                    key={i}
                    x={particle.x}
                    y={particle.y}
                    fontSize="12"
                    fill="url(#particleGrad)"
                    fontFamily="monospace"
                    fontWeight="bold"
                >
                    <tspan>
                        {['01', '10', '11', '00'][i]}
                    </tspan>
                    <animate
                        attributeName="opacity"
                        values="0;0.8;0"
                        dur="3s"
                        begin={`${particle.delay}s`}
                        repeatCount="indefinite"
                    />
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 0,-10; 0,-20"
                        dur="3s"
                        begin={`${particle.delay}s`}
                        repeatCount="indefinite"
                    />
                </text>
            ))}

            {/* Pulsing glow */}
            <path
                d="M100 20 L160 50 L160 100 C160 140 130 170 100 180 C70 170 40 140 40 100 L40 50 Z"
                fill="none"
                stroke="url(#glowGrad)"
                strokeWidth="2"
                opacity="0.5"
            >
                <animate
                    attributeName="opacity"
                    values="0.3;0.7;0.3"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </path>

            {/* Gradients */}
            <defs>
                <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0e7490" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <linearGradient id="lockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#0e7490" />
                </linearGradient>
                <linearGradient id="lockStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
                <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <linearGradient id="particleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
                <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
            </defs>
        </svg>
    );
}
