import React from 'react';

const CostOptimization = () => {
    const styles = `
        /* Gradient movement animation */
        @keyframes gradientShift {
            0% {
                stop-color: #B1FFB4;
            }
            50% {
                stop-color: #9AFF9D;
            }
            100% {
                stop-color: #B1FFB4;
            }
        }

        /* Glow animation for up arrow (bottom to top) */
        @keyframes glowUpArrow {
            0% {
                stop-offset: 0%;
                stop-color: #B1FFB4;
                stop-opacity: 0.3;
            }
            50% {
                stop-color: #9AFF9D;
                stop-opacity: 1;
            }
            100% {
                stop-offset: 100%;
                stop-color: #B1FFB4;
                stop-opacity: 0.3;
            }
        }

        /* Glow animation for down arrow (top to bottom) */
        @keyframes glowDownArrow {
            0% {
                stop-offset: 100%;
                stop-color: #B1FFB4;
                stop-opacity: 0.3;
            }
            50% {
                stop-color: #9AFF9D;
                stop-opacity: 1;
            }
            100% {
                stop-offset: 0%;
                stop-color: #B1FFB4;
                stop-opacity: 0.3;
            }
        }

        /* Apply gradient shift to all gradients */
        #paint0_linear_515_68639 stop:first-child,
        #paint1_linear_515_68639 stop:first-child,
        #paint2_linear_515_68639 stop:first-child,
        #paint3_linear_515_68639 stop:first-child,
        #paint4_linear_515_68639 stop:first-child,
        #paint5_linear_515_68639 stop:first-child {
            animation: gradientShift 4s ease-in-out infinite;
        }

        /* Glow for up arrow gradient (paint2) */
        #paint2_linear_515_68639 stop:first-child {
            animation: glowUpArrow 3s ease-in-out infinite;
        }

        /* Glow for down arrow gradient (paint3) */
        #paint3_linear_515_68639 stop:first-child {
            animation: glowDownArrow 3s ease-in-out infinite;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <svg width="466" height="218" viewBox="0 0 466 218" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="169" width="51" height="103" fill="#D9D9D9"/>
<rect y="169" width="51" height="103" fill="url(#paint0_linear_515_68639)"/>
<rect x="63" y="135" width="51" height="137" fill="#D9D9D9"/>
<rect x="63" y="135" width="51" height="137" fill="url(#paint1_linear_515_68639)"/>
<path d="M232.584 77.25H219.293V245H132.293V77.25H120L176.292 27L232.584 77.25Z" fill="url(#paint2_linear_515_68639)"/>
<path d="M345.168 194.75H331.877V27H244.877V194.75H232.584L288.876 245L345.168 194.75Z" fill="url(#paint3_linear_515_68639)"/>
<rect x="351.168" y="135" width="51" height="137" fill="#D9D9D9"/>
<rect x="351.168" y="135" width="51" height="137" fill="url(#paint4_linear_515_68639)"/>
<rect x="414.168" y="169" width="51" height="103" fill="#D9D9D9"/>
<rect x="414.168" y="169" width="51" height="103" fill="url(#paint5_linear_515_68639)"/>
<defs>
<linearGradient id="paint0_linear_515_68639" x1="86.8813" y1="109.232" x2="4.42091" y2="277.118" gradientUnits="userSpaceOnUse">
<stop stop-color="#B1FFB4"/>
<stop offset="1" stop-color="#212D23"/>
</linearGradient>
<linearGradient id="paint1_linear_515_68639" x1="149.881" y1="55.5023" x2="22.9682" y2="249.767" gradientUnits="userSpaceOnUse">
<stop stop-color="#B1FFB4"/>
<stop offset="1" stop-color="#212D23"/>
</linearGradient>
<linearGradient id="paint2_linear_515_68639" x1="311.793" y1="-99.5" x2="141.793" y2="261.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#B1FFB4"/>
<stop offset="1" stop-color="#212D23"/>
</linearGradient>
<linearGradient id="paint3_linear_515_68639" x1="424.377" y1="371.5" x2="254.377" y2="10.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#B1FFB4"/>
<stop offset="1" stop-color="#212D23"/>
</linearGradient>
<linearGradient id="paint4_linear_515_68639" x1="438.049" y1="55.5023" x2="311.136" y2="249.767" gradientUnits="userSpaceOnUse">
<stop stop-color="#B1FFB4"/>
<stop offset="1" stop-color="#212D23"/>
</linearGradient>
<linearGradient id="paint5_linear_515_68639" x1="501.049" y1="109.232" x2="418.589" y2="277.118" gradientUnits="userSpaceOnUse">
<stop stop-color="#B1FFB4"/>
<stop offset="1" stop-color="#212D23"/>
</linearGradient>
</defs>
</svg>
        </>
    );
};

export default CostOptimization;