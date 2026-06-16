import React from 'react';

const NineBox = () => {
    const styles = `
        @keyframes boxHighlight {
            0%, 100% {
                opacity: 0.6;
            }
            50% {
                opacity: 1;
            }
        }

        @keyframes markerPulse {
            0%, 100% {
                transform: scale(1);
                filter: drop-shadow(0 0 4px var(--ray-color));
            }
            50% {
                transform: scale(1.2);
                filter: drop-shadow(0 0 10px var(--ray-color));
            }
        }

        .highlight-box {
            animation: boxHighlight 2s ease-in-out infinite;
        }

        .performance-marker {
            animation: markerPulse 2s ease-in-out infinite;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="nineBoxGradient" x1="60" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--ray-color)" />
                        <stop offset="1" stopColor="rgba(0,71,71,1)" />
                    </linearGradient>
                </defs>

                {/* 9-Box Grid */}
                {/* Row 1 */}
                <rect x="25" y="25" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.2" />
                <rect x="50" y="25" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.3" />
                <rect x="75" y="25" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.5" className="highlight-box" />

                {/* Row 2 */}
                <rect x="25" y="50" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.2" />
                <rect x="50" y="50" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.4" />
                <rect x="75" y="50" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.6" className="highlight-box" />

                {/* Row 3 */}
                <rect x="25" y="75" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.1" />
                <rect x="50" y="75" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.3" />
                <rect x="75" y="75" width="20" height="20" rx="2" stroke="url(#nineBoxGradient)" strokeWidth="1.5" fill="url(#nineBoxGradient)" fillOpacity="0.4" />

                {/* Axis labels */}
                {/* Performance axis (horizontal) */}
                <text x="60" y="110" fill="currentColor" fontSize="8" textAnchor="middle" opacity="0.7">Performance</text>
                <path d="M 25 105 L 95 105" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <path d="M 90 103 L 95 105 L 90 107" stroke="currentColor" strokeWidth="1" opacity="0.5" />

                {/* Potential axis (vertical) */}
                <text x="15" y="62" fill="currentColor" fontSize="8" textAnchor="middle" opacity="0.7" transform="rotate(-90 15 62)">Potential</text>
                <path d="M 20 95 L 20 25" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <path d="M 18 30 L 20 25 L 22 30" stroke="currentColor" strokeWidth="1" opacity="0.5" />

                {/* Performance markers (dots showing student positions) */}
                <circle cx="85" cy="35" r="4" fill="currentColor" className="performance-marker" />
                <circle cx="60" cy="60" r="3.5" fill="currentColor" opacity="0.7" />
                <circle cx="80" cy="60" r="3.5" fill="currentColor" opacity="0.8" />
                <circle cx="35" cy="85" r="3" fill="currentColor" opacity="0.5" />

                {/* Star for high potential */}
                <path d="M 85 35 L 87 30 L 89 35 L 94 35 L 90 38 L 92 43 L 85 39 L 78 43 L 80 38 L 76 35 L 81 35 Z" fill="currentColor" opacity="0.3" />
            </svg>
        </>
    );
};

export default NineBox;
