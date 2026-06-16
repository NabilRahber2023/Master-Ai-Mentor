"use client"

import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import Link from "next/link";

type CardNavLink = {
    label: string;
    href: string;
    ariaLabel: string;
};

export type CardNavItem = {
    label: string;
    bgColor: string;
    textColor: string;
    links: CardNavLink[];
};

export interface MobileNavProps {
    items: CardNavItem[];
    className?: string;
    ease?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({
                                                 items,
                                                 className = '',
                                                 ease = 'power3.out'
                                             }) => {
    const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const navRef = useRef<HTMLDivElement | null>(null);
    const cardsRef = useRef<HTMLDivElement[]>([]);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    const calculateHeight = () => {
        const navEl = navRef.current;
        if (!navEl) return 260;

        const contentEl = navEl.querySelector('.mobile-nav-content') as HTMLElement;
        if (contentEl) {
            const wasVisible = contentEl.style.visibility;
            const wasPointerEvents = contentEl.style.pointerEvents;
            const wasPosition = contentEl.style.position;
            const wasHeight = contentEl.style.height;

            contentEl.style.visibility = 'visible';
            contentEl.style.pointerEvents = 'auto';
            contentEl.style.position = 'static';
            contentEl.style.height = 'auto';

            contentEl.offsetHeight;

            const topBar = 60;
            const padding = 16;
            const contentHeight = contentEl.scrollHeight;

            contentEl.style.visibility = wasVisible;
            contentEl.style.pointerEvents = wasPointerEvents;
            contentEl.style.position = wasPosition;
            contentEl.style.height = wasHeight;

            return topBar + contentHeight + padding;
        }
        return 260;
    };

    const createTimeline = () => {
        const navEl = navRef.current;
        if (!navEl) return null;

        gsap.set(navEl, { height: 60, overflow: 'hidden' });
        gsap.set(cardsRef.current, { y: 50, opacity: 0 });

        const tl = gsap.timeline({ paused: true });

        tl.to(navEl, {
            height: calculateHeight,
            duration: 0.4,
            ease
        });

        tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

        return tl;
    };

    useLayoutEffect(() => {
        const tl = createTimeline();
        tlRef.current = tl;

        return () => {
            tl?.kill();
            tlRef.current = null;
        };
    }, [ease, items]);

    useLayoutEffect(() => {
        const handleResize = () => {
            if (!tlRef.current) return;

            if (isExpanded) {
                const newHeight = calculateHeight();
                gsap.set(navRef.current, { height: newHeight });

                tlRef.current.kill();
                const newTl = createTimeline();
                if (newTl) {
                    newTl.progress(1);
                    tlRef.current = newTl;
                }
            } else {
                tlRef.current.kill();
                const newTl = createTimeline();
                if (newTl) {
                    tlRef.current = newTl;
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isExpanded]);

    const toggleMenu = () => {
        const tl = tlRef.current;
        if (!tl) return;
        if (!isExpanded) {
            setIsHamburgerOpen(true);
            setIsExpanded(true);
            tl.play(0);
        } else {
            setIsHamburgerOpen(false);
            tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
            tl.reverse();
        }
    };

    const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
        if (el) cardsRef.current[i] = el;
    };

    return (
        <div
            className={`mobile-nav-container md:hidden fixed left-0 right-0 w-full z-[99] top-0 px-4 pt-2 ${className}`}
        >
            <nav
                ref={navRef}
                className={`mobile-nav ${isExpanded ? 'open' : ''} block h-[60px] p-0 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.15)] relative overflow-hidden will-change-[height] 
                bg-gradient-to-r from-background/90 via-background/80 to-background/90 backdrop-blur-md border border-cyan-500/20
                before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-transparent before:via-cyan-500/5 before:to-transparent before:pointer-events-none`}
            >
                <div className="mobile-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between px-4 z-[2]">
                    {/* Logo on the left */}
                    <div className="flex-shrink-0 font-medium">
                        <Link href="/" className="text-xl">
                            AI Mentor
                        </Link>
                    </div>
                    {/* Hamburger on the right */}
                    <div
                        className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''} group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px]`}
                        onClick={toggleMenu}
                        role="button"
                        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
                        tabIndex={0}
                    >
                        <div
                            className={`hamburger-line w-[30px] h-[2px] bg-cyan-400 transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] shadow-[0_0_8px_rgba(0,255,255,0.6)] ${
                                isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''
                            } group-hover:opacity-75 group-hover:shadow-[0_0_12px_rgba(0,255,255,0.8)]`}
                        />
                        <div
                            className={`hamburger-line w-[30px] h-[2px] bg-cyan-400 transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] shadow-[0_0_8px_rgba(0,255,255,0.6)] ${
                                isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''
                            } group-hover:opacity-75 group-hover:shadow-[0_0_12px_rgba(0,255,255,0.8)]`}
                        />
                    </div>
                </div>

                <div
                    className={`mobile-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
                        isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
                    }`}
                    aria-hidden={!isExpanded}
                >
                    {(items || []).map((item, idx) => (
                        <div
                            key={`${item.label}-${idx}`}
                            className="nav-card select-none relative flex flex-col gap-2 p-[12px_16px] rounded-[calc(0.75rem-0.2rem)] min-w-0 flex-[1_1_auto] h-auto min-h-[60px] border border-cyan-500/10 shadow-[0_0_10px_rgba(0,255,255,0.05)]"
                            ref={setCardRef(idx)}
                            style={{ backgroundColor: item.bgColor, color: item.textColor }}
                        >
                            <div className="nav-card-label font-normal tracking-[-0.5px] text-[18px]">
                                {item.label}
                            </div>
                            <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
                                {item.links?.map((lnk, i) => (
                                    <a
                                        key={`${lnk.label}-${i}`}
                                        className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-all duration-300 hover:opacity-75 hover:text-cyan-400 text-[15px]"
                                        href={lnk.href}
                                        aria-label={lnk.ariaLabel}
                                        onClick={toggleMenu}
                                    >
                                        <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                                        {lnk.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default MobileNav;
