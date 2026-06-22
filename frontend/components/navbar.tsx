"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import MobileNav from "@/components/mobile-navbar";
import UserProfileDropdown from "@/components/auth/user-profile-dropdown";
import { LogoThemeToggle } from "@/components/logo-theme-toggle";

const navLinks = [
    { href: "/#services", label: "Services" },
    { href: "/#features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/#partners", label: "Partners" },
]

export default function Navbar() {
    const pathname = usePathname()

    // Smooth scroll handler for hash links
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith('/#')) {
            const id = href.replace('/#', '')

            // If we're on home page, prevent default and smooth scroll
            if (pathname === '/') {
                e.preventDefault()
                const element = document.getElementById(id)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    window.history.pushState({}, '', href)
                }
            }
            // If we're on another page, Next.js Link will handle navigation
        }
    }

    // Effect to handle scrolling after navigation from other pages
    React.useEffect(() => {
        if (pathname === '/' && window.location.hash) {
            const id = window.location.hash.replace('#', '')
            const element = document.getElementById(id)
            if (element) {
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
            }
        }
    }, [pathname])

    // Transform navLinks for MobileNav format
    const mobileNavItems = [
        {
            label: "Navigation",
            bgColor: "hsl(var(--accent))",
            textColor: "hsl(var(--accent-foreground))",
            links: navLinks.map(link => ({
                label: link.label,
                href: link.href,
                ariaLabel: `Navigate to ${link.label}`
            }))
        },
        {
            label: "Account",
            bgColor: "hsl(var(--muted))",
            textColor: "hsl(var(--muted-foreground))",
            links: [
                { label: "Login", href: "/login", ariaLabel: "Login to account" },
                { label: "Sign Up", href: "/signup", ariaLabel: "Create new account" }
            ]
        }
    ]

    return (
        <>
            <MobileNav
                items={mobileNavItems}
                ease="power3.out"
            />

            {/* Desktop Navigation - Hidden on Mobile */}
            <header className="hidden md:block fixed z-50 top-0 right-0 left-0 backdrop-blur-md bg-background/80 border-b border-border/40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo — click the mark to toggle light/dark mode */}
                        <div className="flex-shrink-0 font-bold flex items-center gap-2">
                            <LogoThemeToggle />
                            <Link href="/" className="text-xl flex items-center gap-2 group">
                                <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                    AI Mentor
                                </span>
                            </Link>
                        </div>

                        {/* Center: Navigation */}
                        <div className="absolute left-1/2 -translate-x-1/2">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    {navLinks.map((link) => {
                                        // Only show active state for actual page routes, not hash links
                                        const isActive = !link.href.startsWith('/#') && pathname === link.href
                                        const isHashLink = link.href.startsWith('/#')

                                        return (
                                            <NavigationMenuItem key={link.href}>
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href={link.href}
                                                        scroll={!isHashLink}
                                                        onClick={(e) => handleClick(e, link.href)}
                                                        className={cn(
                                                            "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
                                                            "hover:text-cyan-400",
                                                            isActive
                                                                ? "text-cyan-400"
                                                                : "text-foreground/70"
                                                        )}
                                                    >
                                                        {link.label}
                                                    </Link>
                                                </NavigationMenuLink>
                                            </NavigationMenuItem>
                                        )
                                    })}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>

                        {/* Right: User Profile or Auth Buttons */}
                        <UserProfileDropdown />
                    </div>
                </div>
            </header>
        </>
    )
}
