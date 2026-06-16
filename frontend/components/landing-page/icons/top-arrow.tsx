import React from 'react';

const TopArrow = () => {
    return (
        <svg
            viewBox="0 0 138 47"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            <path
                d="M-5.22584e-05 27.9863C7.95349 19.658 17.4265 12.922 27.9118 8.14396C38.7226 3.21765 50.3982 0.469242 62.2713 0.0550067C74.1443 -0.359178 85.9832 1.56879 97.1109 5.72969C106.651 9.29693 115.507 14.4472 123.315 20.9492L133.051 10.5092L137.658 46.6781L101.256 44.6033L110.951 34.2075C104.898 29.3097 98.0869 25.4121 90.7733 22.6774C81.8711 19.3487 72.4005 17.806 62.9021 18.1374C53.4037 18.4688 44.063 20.6671 35.4144 24.6081C27.1476 28.3752 19.6686 33.6652 13.3633 40.195L13.3323 27.0866L-5.22584e-05 27.9863Z"
                fill="url(#paint0_linear_515_67566)"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_515_67566"
                    x1="112.081"
                    y1="-9.04698"
                    x2="41.4745"
                    y2="66.6644"
                    gradientUnits="userSpaceOnUse"
                >
                    {/* use CSS variable for ray color and a darker tint for the other stop */}
                    <stop stopColor="var(--ray-color)" />
                    <stop offset="1" stopColor="rgba(0,71,71,1)" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default TopArrow;
