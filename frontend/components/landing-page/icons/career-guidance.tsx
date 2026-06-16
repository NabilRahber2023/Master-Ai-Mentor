import React from 'react';

const CareerGuidance = () => {
    const styles = `
        @keyframes compassRotate {
            0%, 100% {
                transform: rotate(-5deg);
            }
            50% {
                transform: rotate(5deg);
            }
        }

        @keyframes needleGlow {
            0%, 100% {
                opacity: 0.7;
                filter: drop-shadow(0 0 4px var(--ray-color));
            }
            50% {
                opacity: 1;
                filter: drop-shadow(0 0 10px var(--ray-color));
            }
        }

        .compass-needle {
            transform-origin: 60px 60px;
            animation: compassRotate 4s ease-in-out infinite, needleGlow 2s ease-in-out infinite;
        }

        .compass-ring {
            animation: needleGlow 3s ease-in-out infinite;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="careerGuidanceGradient" x1="60" y1="10" x2="60" y2="110" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--ray-color)" />
                        <stop offset="1" stopColor="rgba(0,71,71,1)" />
                    </linearGradient>
                    <radialGradient id="compassGlow" cx="60" cy="60" r="50">
                        <stop offset="0%" stopColor="var(--ray-color)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--ray-color)" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Outer glow */}
                <circle cx="60" cy="60" r="50" fill="url(#compassGlow)" />

                {/* Outer ring */}
                <circle cx="60" cy="60" r="45" stroke="url(#careerGuidanceGradient)" strokeWidth="2" fill="none" className="compass-ring" />
                <circle cx="60" cy="60" r="40" stroke="url(#careerGuidanceGradient)" strokeWidth="1" fill="none" opacity="0.5" />

                {/* Cardinal direction markers */}
                <circle cx="60" cy="20" r="3" fill="currentColor" />
                <circle cx="100" cy="60" r="3" fill="currentColor" opacity="0.7" />
                <circle cx="60" cy="100" r="3" fill="currentColor" opacity="0.7" />
                <circle cx="20" cy="60" r="3" fill="currentColor" opacity="0.7" />

                {/* Direction lines */}
                <line x1="60" y1="25" x2="60" y2="35" stroke="#004747" strokeWidth="1.5" />
                <line x1="95" y1="60" x2="85" y2="60" stroke="#004747" strokeWidth="1" opacity="0.5" />
                <line x1="60" y1="95" x2="60" y2="85" stroke="#004747" strokeWidth="1" opacity="0.5" />
                <line x1="25" y1="60" x2="35" y2="60" stroke="#004747" strokeWidth="1" opacity="0.5" />

                {/* Compass needle */}
                <g className="compass-needle">
                    <path d="M 60 60 L 55 35 L 60 25 L 65 35 Z" fill="currentColor" />
                    <path d="M 60 60 L 55 85 L 60 75 L 65 85 Z" fill="url(#careerGuidanceGradient)" fillOpacity="0.6" />
                </g>

                {/* Center dot */}
                <circle cx="60" cy="60" r="5" fill="currentColor" />
                <circle cx="60" cy="60" r="3" fill="#004747" />

                {/* Path indicators (roadmap) */}
                <path d="M 60 60 Q 75 45 90 40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
                <path d="M 60 60 Q 45 75 30 80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
            </svg>
        </>
    );
};

export default CareerGuidance;
