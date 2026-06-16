import React from 'react';

const GradePrediction = () => {
    const styles = `
        @keyframes chartGlow {
            0%, 100% {
                opacity: 0.6;
                filter: drop-shadow(0 0 4px var(--ray-color));
            }
            50% {
                opacity: 1;
                filter: drop-shadow(0 0 12px var(--ray-color));
            }
        }

        @keyframes lineGrow {
            0% {
                stroke-dashoffset: 200;
            }
            100% {
                stroke-dashoffset: 0;
            }
        }

        .chart-glow {
            animation: chartGlow 3s ease-in-out infinite;
        }

        .trend-line {
            stroke-dasharray: 200;
            animation: lineGrow 2s ease-out forwards;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <svg width="120" height="110" viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradePredictionGradient" x1="60" y1="10" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--ray-color)" />
                        <stop offset="1" stopColor="rgba(0,71,71,1)" />
                    </linearGradient>
                </defs>

                {/* Chart bars */}
                <rect x="20" y="70" width="12" height="20" rx="2" fill="url(#gradePredictionGradient)" fillOpacity="0.6" />
                <rect x="38" y="60" width="12" height="30" rx="2" fill="url(#gradePredictionGradient)" fillOpacity="0.7" />
                <rect x="56" y="50" width="12" height="40" rx="2" fill="url(#gradePredictionGradient)" fillOpacity="0.8" />
                <rect x="74" y="35" width="12" height="55" rx="2" fill="url(#gradePredictionGradient)" fillOpacity="0.9" className="chart-glow" />
                <rect x="92" y="25" width="12" height="65" rx="2" fill="url(#gradePredictionGradient)" fillOpacity="1" className="chart-glow" />

                {/* Trend line */}
                <path
                    d="M 26 75 L 44 65 L 62 55 L 80 40 L 98 30"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="trend-line"
                />

                {/* Data points */}
                <circle cx="26" cy="75" r="4" fill="currentColor" className="chart-glow" />
                <circle cx="44" cy="65" r="4" fill="currentColor" className="chart-glow" />
                <circle cx="62" cy="55" r="4" fill="currentColor" className="chart-glow" />
                <circle cx="80" cy="40" r="4" fill="currentColor" className="chart-glow" />
                <circle cx="98" cy="30" r="5" fill="currentColor" className="chart-glow" />

                {/* Axis lines */}
                <line x1="15" y1="90" x2="110" y2="90" stroke="#004747" strokeWidth="1.5" />
                <line x1="15" y1="20" x2="15" y2="90" stroke="#004747" strokeWidth="1.5" />

                {/* Prediction arrow */}
                <path d="M 98 30 L 105 22 M 98 30 L 105 30 M 98 30 L 98 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </>
    );
};

export default GradePrediction;
