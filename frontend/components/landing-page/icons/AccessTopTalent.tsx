import React from 'react';

const AccessTopTalent = () => {
    return (
        <>
            <style>{`
                @keyframes rotateTip {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @keyframes colorShift {
                    0% {
                        filter: saturate(1) brightness(1);
                    }
                    100% {
                        filter: saturate(1) brightness(1);
                    }
                }

                .rotating-tip {
                    animation: rotateTip 20s linear infinite;
                    transform-origin: 144.507px 144.5px;
                }

                @keyframes blink {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.2;
                    }
                }

                .blinking-dot {
                    animation: blink 1s ease-in-out infinite;
                }

                .connection-line {
                    stroke-dasharray: 200;
                    stroke-dashoffset: 200;
                    animation: drawLine 6s ease-in-out infinite;
                }

                @keyframes drawLine {
                    0%, 5% {
                        stroke-dashoffset: 200;
                    }
                    40% {
                        stroke-dashoffset: 0;
                    }
                    95%, 100% {
                        stroke-dashoffset: 200;
                    }
                }
            `}</style>

            <div className="flex items-center justify-center w-full h-screen "
            >
                <svg width="289" height="274" viewBox="0 0 289 274" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Static circles */}
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M144.507 101.074C168.451 101.074 187.933 120.553 187.933 144.5C187.933 168.447 168.451 187.93 144.507 187.93C120.56 187.93 101.078 168.447 101.078 144.5C101.078 120.553 120.56 101.074 144.507 101.074ZM144.507 187.164C168.028 187.164 187.167 168.025 187.167 144.5C187.167 120.975 168.028 101.836 144.507 101.836C120.983 101.836 101.843 120.975 101.843 144.5C101.843 168.025 120.983 187.164 144.507 187.164Z" fill="#568C59"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M144.501 67.9995C186.684 67.9995 220.999 102.318 220.999 144.5C220.999 186.681 186.684 221 144.501 221C102.319 221 67.9993 186.681 67.9993 144.5C67.9993 102.318 102.319 67.9995 144.501 67.9995ZM144.501 220.13C186.204 220.13 220.129 186.201 220.129 144.5C220.129 102.798 186.204 68.8695 144.501 68.8695C102.795 68.8695 68.8693 102.798 68.8693 144.5C68.8693 186.201 102.795 220.13 144.501 220.13Z" fill="#568C59"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M144.507 29.3301C208.011 29.3301 259.677 80.9961 259.677 144.5C259.677 208.004 208.011 259.67 144.507 259.67C80.9995 259.67 29.3335 208.004 29.3335 144.5C29.3335 80.9961 80.9995 29.3301 144.507 29.3301ZM144.507 258.904C207.589 258.904 258.911 207.585 258.911 144.5C258.911 81.4187 207.589 30.0959 144.507 30.0959C81.4221 30.0959 30.0993 81.4187 30.0993 144.5C30.0993 207.585 81.4221 258.904 144.507 258.904Z" fill="#568C59"/>



                    {/* Rotating tip with color animation */}
                    <g className="rotating-tip">
                        <path className="colored-tip radar-spinner" d="M89.0591 244.342L90.0489 244.92L145.808 144.511L144.818 143.929L89.0591 244.342Z" fill="url(#paint0_linear_515_68660)"/>
                        <path className="colored-tip" d="M90.0488 244.92C106.497 254.02 125.408 259.208 145.537 259.208C161.284 259.208 176.286 256.032 189.949 250.296L145.808 144.511L90.0488 244.92Z" fill="url(#paint1_linear_515_68660)"/>
                    </g>

                    {/* Static dots and glows (no rotation) */}
                    <path className="profile-glow-1 blinking-dot" d="M196.773 235.329C196.773 239.433 193.446 242.76 189.342 242.76C185.238 242.76 181.915 239.433 181.915 235.329C181.915 231.225 185.238 227.898 189.342 227.898C193.446 227.898 196.773 231.225 196.773 235.329Z" fill="url(#paint2_radial_515_68660)"/>
                    <path className="colored-tip" d="M191.098 235.329C191.098 236.297 190.314 237.084 189.342 237.084C188.374 237.084 187.59 236.297 187.59 235.329C187.59 234.361 188.374 233.577 189.342 233.577C190.314 233.577 191.098 234.361 191.098 235.329Z" fill="#8EC63E"/>
                    <path className="profile-glow-2 blinking-dot" d="M73.7492 212.563C73.7492 214.68 72.0332 216.396 69.9127 216.396C67.7958 216.396 66.0798 214.68 66.0798 212.563C66.0798 210.442 67.7958 208.727 69.9127 208.727C72.0332 208.727 73.7492 210.442 73.7492 212.563Z" fill="url(#paint3_radial_515_68660)"/>
                    <path className="colored-tip" d="M70.8194 212.563C70.8194 213.061 70.4148 213.466 69.9126 213.466C69.4141 213.466 69.0095 213.061 69.0095 212.563C69.0095 212.061 69.4141 211.656 69.9126 211.656C70.4148 211.656 70.8194 212.061 70.8194 212.563Z" fill="#8EC63E"/>
                    <path className="profile-glow-3 blinking-dot" d="M162.953 47.8039C162.953 49.5524 161.536 50.9721 159.784 50.9721C158.036 50.9721 156.616 49.5524 156.616 47.8039C156.616 46.0555 158.036 44.6357 159.784 44.6357C161.536 44.6357 162.953 46.0555 162.953 47.8039Z" fill="url(#paint4_radial_515_68660)"/>
                    <path className="colored-tip" d="M160.532 47.8039C160.532 48.2158 160.2 48.5517 159.784 48.5517C159.373 48.5517 159.037 48.2158 159.037 47.8039C159.037 47.3921 159.373 47.0562 159.784 47.0562C160.2 47.0562 160.532 47.3921 160.532 47.8039Z" fill="#8EC63E"/>
                    <path className="profile-glow-4 blinking-dot" d="M106.262 77.3111C106.262 80.0783 104.018 82.318 101.255 82.318C98.4875 82.318 96.2441 80.0783 96.2441 77.3111C96.2441 74.5476 98.4875 72.3042 101.255 72.3042C104.018 72.3042 106.262 74.5476 106.262 77.3111Z" fill="url(#paint5_radial_515_68660)"/>
                    <path className="colored-tip" d="M102.436 77.3112C102.436 77.965 101.909 78.4925 101.255 78.4925C100.601 78.4925 100.07 77.965 100.07 77.3112C100.07 76.6573 100.601 76.1299 101.255 76.1299C101.909 76.1299 102.436 76.6573 102.436 77.3112Z" fill="#8EC63E"/>
                    <path className="profile-glow-5 blinking-dot" d="M50.3401 154.001C50.3401 155.475 49.148 156.667 47.6741 156.667C46.2038 156.667 45.0081 155.475 45.0081 154.001C45.0081 152.531 46.2038 151.335 47.6741 151.335C49.148 151.335 50.3401 152.531 50.3401 154.001Z" fill="url(#paint6_radial_515_68660)"/>
                    <path className="colored-tip" d="M48.3062 154.001C48.3062 154.352 48.0244 154.633 47.674 154.633C47.3272 154.633 47.0454 154.352 47.0454 154.001C47.0454 153.654 47.3272 153.373 47.674 153.373C48.0244 153.373 48.3062 153.654 48.3062 154.001Z" fill="#8EC63E"/>
                    <path className="profile-glow-6 blinking-dot" d="M223.133 73.3191C223.133 77.4193 219.81 80.7464 215.706 80.7464C211.602 80.7464 208.275 77.4193 208.275 73.3191C208.275 69.2153 211.602 65.8882 215.706 65.8882C219.81 65.8882 223.133 69.2153 223.133 73.3191Z" fill="url(#paint7_radial_515_68660)"/>
                    <path className="colored-tip" d="M217.458 73.3192C217.458 74.2873 216.674 75.0712 215.706 75.0712C214.734 75.0712 213.95 74.2873 213.95 73.3192C213.95 72.3474 214.734 71.5635 215.706 71.5635C216.674 71.5635 217.458 72.3474 217.458 73.3192Z" fill="#8EC63E"/>
                    <path className="profile-glow-7 blinking-dot" d="M131.231 125.552C131.231 128.496 128.843 130.881 125.903 130.881C122.958 130.881 120.574 128.496 120.574 125.552C120.574 122.611 122.958 120.224 125.903 120.224C128.843 120.224 131.231 122.611 131.231 125.552Z" fill="url(#paint8_radial_515_68660)"/>
                    <path className="colored-tip" d="M127.16 125.552C127.16 126.249 126.596 126.813 125.903 126.813C125.205 126.813 124.642 126.249 124.642 125.552C124.642 124.858 125.205 124.295 125.903 124.295C126.596 124.295 127.16 124.858 127.16 125.552Z" fill="#8EC63E"/>

                    <defs>
                        <linearGradient id="paint0_linear_515_68660" x1="236.216" y1="193.445" x2="192.251" y2="271.726" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#001400"/>
                            <stop offset="1" stop-color="#9DCB3C"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_515_68660" x1="214.407" y1="255.801" x2="109.117" y2="297.685" gradientUnits="userSpaceOnUse">
                            <stop stop-opacity="0"/>
                            <stop offset="1" stop-color="#A3FFA0"/>
                        </linearGradient>
                        <radialGradient id="paint2_radial_515_68660" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(189.484 235.467) scale(7.43019 7.43019)">
                            <stop stop-color="#4CB649"/>
                            <stop offset="1" stop-color="#001400" stop-opacity="0"/>
                        </radialGradient>
                        <radialGradient id="paint3_radial_515_68660" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(69.9633 212.61) scale(3.83539 3.8354)">
                            <stop stop-color="#4CB649"/>
                            <stop offset="1" stop-color="#001400" stop-opacity="0"/>
                        </radialGradient>
                        <radialGradient id="paint4_radial_515_68660" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(159.731 47.7526) scale(3.16816 3.16816)">
                            <stop stop-color="#4CB649"/>
                            <stop offset="0.995" stop-color="#001400" stop-opacity="0"/>
                        </radialGradient>
                        <radialGradient id="paint5_radial_515_68660" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(101.388 77.4415) scale(5.00873 5.00873)">
                            <stop stop-color="#4CB649"/>
                            <stop offset="1" stop-color="#001400" stop-opacity="0.5"/>
                        </radialGradient>
                        <radialGradient id="paint6_radial_515_68660" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(47.6119 153.942) scale(2.66603 2.66602)">
                            <stop stop-color="#4CB649"/>
                            <stop offset="1" stop-color="#001400" stop-opacity="0"/>
                        </radialGradient>
                        <radialGradient id="paint7_radial_515_68660" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(215.846 73.4542) scale(7.43055)">
                            <stop stop-color="#4CB649"/>
                            <stop offset="1" stop-opacity="0"/>
                        </radialGradient>
                        <radialGradient id="paint8_radial_515_68660" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(126.132 125.777) scale(5.32952)">
                            <stop stop-color="#4CB649"/>
                            <stop offset="1" stop-opacity="0.6"/>
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        </>
    );
};

export default AccessTopTalent;