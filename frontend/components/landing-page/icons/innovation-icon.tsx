export default function InnovationIcon() {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Rocket Body */}
            <g className="animate-[bounce_3s_ease-in-out_infinite]">
                <path
                    d="M100 30 L115 80 L130 140 L115 150 L100 155 L85 150 L70 140 L85 80 Z"
                    fill="url(#rocketGrad)"
                    stroke="url(#rocketStroke)"
                    strokeWidth="2"
                />

                {/* Window */}
                <circle cx="100" cy="60" r="12" fill="url(#windowGrad)" />

                {/* Fins */}
                <path d="M70 120 L55 140 L70 135 Z" fill="url(#finGrad)" />
                <path d="M130 120 L145 140 L130 135 Z" fill="url(#finGrad)" />
            </g>

            {/* Upward Arrow/Trail */}
            <g opacity="0.6">
                <path
                    d="M100 155 L100 175"
                    stroke="url(#trailGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                >
                    <animate
                        attributeName="opacity"
                        values="0.6;0.2;0.6"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                </path>
            </g>

            {/* Sparkles/Stars */}
            {[
                { x: 60, y: 50, delay: 0 },
                { x: 140, y: 70, delay: 0.5 },
                { x: 50, y: 100, delay: 1 },
                { x: 150, y: 110, delay: 1.5 },
                { x: 70, y: 160, delay: 0.3 },
                { x: 130, y: 170, delay: 0.8 }
            ].map((star, i) => (
                <g key={i}>
                    <path
                        d={`M${star.x} ${star.y - 6} L${star.x} ${star.y + 6} M${star.x - 6} ${star.y} L${star.x + 6} ${star.y}`}
                        stroke="url(#sparkleGrad)"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <animate
                            attributeName="opacity"
                            values="0;1;0"
                            dur="2s"
                            begin={`${star.delay}s`}
                            repeatCount="indefinite"
                        />
                    </path>
                </g>
            ))}

            {/* Upward Trending Line */}
            <path
                d="M30 170 L60 150 L90 145 L120 130 L150 110"
                stroke="url(#trendGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="5,5"
                opacity="0.5"
            >
                <animate
                    attributeName="stroke-dashoffset"
                    from="10"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </path>
            <polygon
                points="150,110 145,105 145,115"
                fill="url(#trendGrad)"
                opacity="0.5"
            />

            {/* Gradients */}
            <defs>
                <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="rocketStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <radialGradient id="windowGrad">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#0891b2" />
                </radialGradient>
                <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#0e7490" />
                </linearGradient>
                <linearGradient id="trailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
                <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
            </defs>
        </svg>
    );
}
