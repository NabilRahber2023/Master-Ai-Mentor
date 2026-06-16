import React from 'react';

const BrainConnection = () => {
    const styles = `
        /* Central AI icon constant slow glow */
        @keyframes centralGlow {
            0%, 100% {
                filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.5));
            }
            50% {
                filter: drop-shadow(0 0 25px rgba(0, 255, 255, 1));
            }
        }

        /* Apply animations to central icon */
        rect[x="301.5"] {
            animation: centralGlow 3s ease-in-out infinite;
        }

        /* Make paths thicker and more visible */
        path[d*="301 126.904"],
        path[d*="421 126.904"],
        path[d*="301 128.101"],
        path[d*="421 128.101"] {
            stroke-width: 3;
            opacity: 0.9;
        }
    `;

    return (
        <>
            <style>{styles}</style>
            <svg width="722" height="255" viewBox="0 0 722 255" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path id="topLeftPath" d="M301 126.904H226.389C220.618 126.904 215.127 124.411 211.329 120.065L191.4 97.2589C187.602 92.9128 182.112 90.4194 176.34 90.4194H27.647C20.4704 90.4194 13.5858 87.5776 8.49868 82.5156C3.37858 77.4207 0.5 70.4954 0.5 63.2723V0" stroke="url(#paint0_linear_515_68605)" strokeOpacity="0.4" />
                <path id="bottomLeftPath" d="M301 128.101H226.389C220.618 128.101 215.127 130.595 211.329 134.941L191.4 157.747C187.602 162.093 182.112 164.586 176.34 164.586H27.647C20.4704 164.586 13.5858 167.428 8.49868 172.49C3.37858 177.585 0.5 184.51 0.5 191.734V255.006" stroke="url(#paint1_linear_515_68605)" strokeOpacity="0.4" />
                <rect x="301.5" y="68.0029" width="119" height="119" rx="37.5" fill="#151E19" />
                <rect x="301.5" y="68.0029" width="119" height="119" rx="37.5" stroke="url(#paint8_linear_515_68605)" />
                <g clip-path="url(#clip0_515_68605)">
                    <path d="M372.979 116.241L379.065 117.618V120.066H368.005C367.539 113.846 362.558 108.863 356.339 108.397V97.3394H358.787L360.16 103.426C360.197 103.588 360.275 103.738 360.387 103.86C360.499 103.983 360.641 104.074 360.799 104.125C361.728 104.422 362.63 104.796 363.496 105.242C363.644 105.318 363.81 105.354 363.976 105.347C364.142 105.339 364.303 105.289 364.444 105.2L369.724 101.868L374.534 106.68L371.2 111.958C371.112 112.099 371.061 112.26 371.054 112.426C371.047 112.591 371.083 112.756 371.159 112.904C371.607 113.771 371.982 114.674 372.281 115.602C372.332 115.76 372.423 115.902 372.546 116.014C372.668 116.126 372.817 116.205 372.979 116.241ZM361.724 120.066H366.089C365.634 114.898 361.504 110.768 356.339 110.313V114.678C359.111 115.094 361.308 117.292 361.724 120.066ZM350.881 121.021C350.881 123.503 352.901 125.521 355.385 125.521C357.867 125.521 359.885 123.502 359.885 121.021C359.885 118.536 357.867 116.515 355.385 116.515C352.901 116.515 350.881 118.536 350.881 121.021ZM373.97 125.967C375.053 126.358 375.829 127.396 375.829 128.612C375.829 130.164 374.567 131.427 373.016 131.427C371.464 131.427 370.2 130.164 370.2 128.612C370.2 127.396 370.977 126.358 372.062 125.967V121.975H368.04V129.72C368.04 129.931 367.971 130.135 367.843 130.303L365.358 133.526C365.65 133.977 365.805 134.503 365.804 135.04C365.804 136.592 364.541 137.856 362.987 137.856C361.437 137.856 360.175 136.592 360.175 135.04C360.175 133.489 361.437 132.227 362.987 132.227C363.287 132.227 363.577 132.275 363.848 132.362L366.132 129.395V121.975H361.724C361.262 125.058 358.595 127.429 355.385 127.429C351.849 127.429 348.972 124.555 348.972 121.021C348.972 117.809 351.346 115.14 354.431 114.678V110.27H347.006L344.04 112.554C344.129 112.832 344.175 113.122 344.175 113.414C344.175 114.965 342.913 116.226 341.362 116.226C339.81 116.226 338.546 114.965 338.546 113.414C338.546 111.861 339.809 110.598 341.362 110.598C341.898 110.597 342.424 110.751 342.874 111.042L346.099 108.559C346.266 108.431 346.47 108.362 346.681 108.362H354.431V103.949H350.437C350.046 105.034 349.007 105.812 347.79 105.812C346.238 105.812 344.974 104.549 344.974 102.995C344.974 101.444 346.238 100.184 347.79 100.184C349.006 100.184 350.044 100.959 350.437 102.041H354.431V97.3394H348.988C340.263 97.3394 333.744 106.367 333.744 114.437V118.227C333.744 118.35 333.721 118.471 333.674 118.586L328.096 132.365C327.955 132.71 327.947 133.095 328.073 133.446C328.2 133.797 328.452 134.089 328.78 134.265L333.244 136.677C333.395 136.759 333.521 136.88 333.609 137.028C333.697 137.175 333.744 137.344 333.744 137.516V146.725C333.744 149.528 336.025 151.809 338.828 151.809H350.279C352.992 151.809 355.2 149.599 355.2 146.884V135.388C355.2 134.86 355.626 134.434 356.154 134.434C356.681 134.434 357.108 134.86 357.108 135.388V146.884C357.108 149.538 355.589 151.841 353.376 152.973V161.437H366.364V154.015L364.081 151.049C363.803 151.139 363.512 151.184 363.22 151.184C361.666 151.184 360.403 149.922 360.403 148.371C360.403 146.818 361.666 145.554 363.22 145.554C364.772 145.554 366.036 146.818 366.036 148.371C366.036 148.927 365.873 149.445 365.591 149.883L368.074 153.108C368.202 153.275 368.272 153.48 368.272 153.69V161.437H371.468V140.463C371.468 140.226 371.556 139.997 371.716 139.821C376.046 135.07 378.558 128.916 379.015 121.975H373.97V125.967H373.97ZM362.896 102.861L369.131 97.3394H376.462C376.854 98.4212 377.889 99.1978 379.104 99.1978C380.657 99.1978 381.921 97.9362 381.921 96.3855C381.921 94.8326 380.657 93.5693 379.104 93.5693C377.889 93.5693 376.854 94.3475 376.462 95.4314H368.767C368.533 95.4314 368.308 95.5173 368.133 95.6726L361.661 101.405L361.904 102.483C362.237 102.6 362.569 102.726 362.896 102.861ZM391.2 105.665C389.984 105.665 388.949 106.443 388.557 107.526H380.862C380.628 107.526 380.402 107.612 380.228 107.768L373.622 113.707C373.728 113.97 373.828 114.233 373.922 114.498L375.259 114.801L381.225 109.436H388.558C388.95 110.517 389.984 111.293 391.2 111.293C392.753 111.293 394.016 110.032 394.016 108.481C394.016 106.928 392.753 105.665 391.2 105.665ZM379.9 102.018H372.573L374.479 103.926H379.9C380.291 105.01 381.326 105.788 382.542 105.788C384.095 105.788 385.359 104.525 385.359 102.972C385.359 101.421 384.095 100.16 382.542 100.16C381.327 100.16 380.292 100.936 379.9 102.018ZM387.611 118.204C386.395 118.204 385.36 118.982 384.969 120.066H380.975V121.021H380.974V121.056C380.962 121.363 380.947 121.669 380.927 121.975H384.969C385.361 123.056 386.396 123.833 387.611 123.833C389.164 123.833 390.427 122.571 390.427 121.02C390.427 119.468 389.164 118.204 387.611 118.204Z" fill="#00ffff" />
                </g>
                <path id="topRightPath" d="M421 126.904H495.611C501.382 126.904 506.873 124.411 510.671 120.065L530.6 97.2589C534.398 92.9128 539.888 90.4194 545.66 90.4194H694.353C701.53 90.4194 708.414 87.5776 713.501 82.5156C718.621 77.4207 721.5 70.4954 721.5 63.2723V0" stroke="url(#paint9_linear_515_68605)" strokeOpacity="0.4" />
                <path id="bottomRightPath" d="M421 128.101H495.611C501.382 128.101 506.873 130.595 510.671 134.941L530.6 157.747C534.398 162.093 539.888 164.586 545.66 164.586H694.353C701.53 164.586 708.414 167.428 713.501 172.49C718.621 177.585 721.5 184.51 721.5 191.734V255.006" stroke="url(#paint10_linear_515_68605)" strokeOpacity="0.4" />

                {/* Animated dots following the paths */}
                <g>
                    <circle r="4" fill="url(#paint4_linear_515_68605)" filter="drop-shadow(0 0 6px rgba(0, 255, 255, 0.8))">
                        <animateMotion dur="3s" repeatCount="indefinite">
                            <mpath href="#topLeftPath" />
                        </animateMotion>
                    </circle>
                </g>

                <g>
                    <circle r="4" fill="url(#paint7_linear_515_68605)" filter="drop-shadow(0 0 6px rgba(0, 255, 255, 0.8))">
                        <animateMotion dur="3s" repeatCount="indefinite">
                            <mpath href="#topRightPath" />
                        </animateMotion>
                    </circle>
                </g>

                <g>
                    <circle r="4" fill="url(#paint13_linear_515_68605)" filter="drop-shadow(0 0 6px rgba(0, 255, 255, 0.8))">
                        <animateMotion dur="3s" repeatCount="indefinite">
                            <mpath href="#bottomLeftPath" />
                        </animateMotion>
                    </circle>
                </g>

                <g>
                    <circle r="4" fill="url(#paint16_linear_515_68605)" filter="drop-shadow(0 0 6px rgba(0, 255, 255, 0.8))">
                        <animateMotion dur="3s" repeatCount="indefinite">
                            <mpath href="#bottomRightPath" />
                        </animateMotion>
                    </circle>
                </g>

                <defs>
                    <filter id="filter0_f_515_68605" x="7.9" y="157.399" width="18.2" height="18.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1.3" result="effect1_foregroundBlur_515_68605" />
                    </filter>
                    <filter id="filter1_f_515_68605" x="5.9" y="155.399" width="22.2" height="22.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1.3" result="effect1_foregroundBlur_515_68605" />
                    </filter>
                    <filter id="filter2_f_515_68605" x="175.9" y="84.399" width="18.2" height="18.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1.3" result="effect1_foregroundBlur_515_68605" />
                    </filter>
                    <filter id="filter3_f_515_68605" x="173.9" y="82.399" width="22.2" height="22.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1.3" result="effect1_foregroundBlur_515_68605" />
                    </filter>
                    <filter id="filter4_f_515_68605" x="527.9" y="152.399" width="18.2" height="18.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1.3" result="effect1_foregroundBlur_515_68605" />
                    </filter>
                    <filter id="filter5_f_515_68605" x="525.9" y="150.399" width="22.2" height="22.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1.3" result="effect1_foregroundBlur_515_68605" />
                    </filter>
                    <filter id="filter6_f_515_68605" x="699.9" y="76.399" width="18.2" height="18.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1.3" result="effect1_foregroundBlur_515_68605" />
                    </filter>
                    <filter id="filter7_f_515_68605" x="697.9" y="74.399" width="22.2" height="22.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1.3" result="effect1_foregroundBlur_515_68605" />
                    </filter>
                    <linearGradient id="paint0_linear_515_68605" x1="26.1031" y1="157.497" x2="303.803" y2="92.0602" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint1_linear_515_68605" x1="26.1031" y1="97.5085" x2="303.803" y2="162.946" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint2_linear_515_68605" x1="11.6076" y1="176.133" x2="24.164" y2="174.883" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint3_linear_515_68605" x1="9.94843" y1="179.097" x2="26.3683" y2="177.463" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint4_linear_515_68605" x1="14.0964" y1="171.687" x2="20.8575" y2="171.014" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint5_linear_515_68605" x1="179.608" y1="103.133" x2="192.164" y2="101.883" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint6_linear_515_68605" x1="177.948" y1="106.097" x2="194.368" y2="104.463" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint7_linear_515_68605" x1="182.096" y1="98.6865" x2="188.858" y2="98.0137" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint8_linear_515_68605" x1="311.224" y1="216.431" x2="427.129" y2="204.897" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint9_linear_515_68605" x1="695.897" y1="157.497" x2="418.197" y2="92.0602" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint10_linear_515_68605" x1="695.897" y1="97.5085" x2="418.197" y2="162.946" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint11_linear_515_68605" x1="531.608" y1="171.133" x2="544.164" y2="169.883" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint12_linear_515_68605" x1="529.948" y1="174.097" x2="546.368" y2="172.463" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint13_linear_515_68605" x1="534.096" y1="166.687" x2="540.858" y2="166.014" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint14_linear_515_68605" x1="703.608" y1="95.133" x2="716.164" y2="93.8834" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint15_linear_515_68605" x1="701.948" y1="98.0972" x2="718.368" y2="96.4632" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <linearGradient id="paint16_linear_515_68605" x1="706.096" y1="90.6865" x2="712.858" y2="90.0137" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" />
                        <stop offset="1" stopColor="#00cccc" />
                    </linearGradient>
                    <clipPath id="clip0_515_68605">
                        <rect width="68" height="68" fill="white" transform="translate(327 93.5029)" />
                    </clipPath>
                </defs>
            </svg>
        </>
    );
};

export default BrainConnection;