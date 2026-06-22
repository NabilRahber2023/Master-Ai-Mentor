'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="relative border-t border-cyan-500/30 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
            {/* Subtle animated gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Brand Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors duration-300">
                                <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--app-text)]">AI Mentor</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Supercharge your academic journey with AI Mentor – your personal AI-powered study companion.
                        </p>
                        <button className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 w-fit">
                            Book a Demo
                        </button>
                    </div>

                    {/* Links Column 1 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[var(--app-text)] font-semibold text-sm uppercase tracking-wide border-b border-cyan-500/30 pb-3">
                            Product
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {['Features', 'Pricing', 'Case Studies', 'Updates'].map((item) => (
                                <Link
                                    key={item}
                                    href="#"
                                    className="text-slate-400 hover:text-cyan-400 transition-colors duration-300 text-sm group inline-flex items-center gap-1"
                                >
                                    <span className="w-0 h-px bg-cyan-500 group-hover:w-2 transition-all duration-300" />
                                    {item}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Links Column 2 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[var(--app-text)] font-semibold text-sm uppercase tracking-wide border-b border-cyan-500/30 pb-3">
                            Company
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {['About Us', 'Careers', 'Blog', 'Contact'].map((item) => (
                                <Link
                                    key={item}
                                    href="#"
                                    className="text-slate-400 hover:text-cyan-400 transition-colors duration-300 text-sm group inline-flex items-center gap-1"
                                >
                                    <span className="w-0 h-px bg-cyan-500 group-hover:w-2 transition-all duration-300" />
                                    {item}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Contact Section */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[var(--app-text)] font-semibold text-sm uppercase tracking-wide border-b border-cyan-500/30 pb-3">
                            Get in Touch
                        </h4>
                        <div className="flex flex-col gap-3">
                            <a
                                href="tel:+1234567890"
                                className="flex items-center gap-3 text-slate-400 hover:text-cyan-400 transition-colors duration-300 group"
                            >
                                <Phone className="w-4 h-4 text-cyan-500/60 group-hover:text-cyan-400 transition-colors" />
                                <span className="text-sm">+88 1841151827</span>
                            </a>
                            <a
                                href="mailto:hello@yourbrand.com"
                                className="flex items-center gap-3 text-slate-400 hover:text-cyan-400 transition-colors duration-300 group"
                            >
                                <Mail className="w-4 h-4 text-cyan-500/60 group-hover:text-cyan-400 transition-colors" />
                                <span className="text-sm">ai-mentor@diu.com</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent my-8" />

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-xs">
                        © {new Date().getFullYear()} AI Mentor. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        {['Privacy', 'Terms', 'Cookies'].map((item) => (
                            <Link
                                key={item}
                                href="#"
                                className="text-slate-500 hover:text-cyan-400 transition-colors duration-300 text-xs"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
