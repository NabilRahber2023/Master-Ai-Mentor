const HorizontalArrow = () => {
    const styles = `
        @keyframes horizontalArrowGlow {
            0% {
                offset-distance: 0%;
                opacity: 1;
            }
            100% {
                offset-distance: 100%;
                opacity: 1;
            }
        }

        .horizontal-arrow-dot {
            animation: horizontalArrowGlow 3s linear infinite;
            filter: drop-shadow(0 0 4px var(--ray-color)) drop-shadow(0 0 8px var(--ray-color));
        }
    `

    return (
        <>
            <style>{styles}</style>
            <svg
                viewBox="0 0 100 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id="horizontal_arrow_gradient" x1="0" y1="20" x2="100" y2="20" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--ray-color)" stopOpacity="0.3" />
                        <stop offset="0.5" stopColor="var(--ray-color)" stopOpacity="0.8" />
                        <stop offset="1" stopColor="var(--ray-color)" stopOpacity="0.3" />
                    </linearGradient>
                </defs>

                {/* Curved arrow path */}
                <path
                    id="horizontalArrowPath"
                    d="M10 20 Q50 5, 90 20"
                    stroke="url(#horizontal_arrow_gradient)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Arrow head */}
                <path
                    d="M85 15 L92 20 L85 25"
                    stroke="var(--ray-color)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Glowing dot */}
                <circle
                    cx="0"
                    cy="0"
                    r="2.5"
                    fill="currentColor"
                    className="horizontal-arrow-dot"
                    style={{
                        offsetPath: 'path("M10 20 Q50 5, 90 20")',
                    }}
                />
            </svg>
        </>
    )
}

export default HorizontalArrow
