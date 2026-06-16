"use client"

import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { toast } from "sonner"

export default function UserProfileDropdown() {
    const { data: session, isPending } = authClient.useSession()

    const handleSignOut = async () => {
        try {
            await authClient.signOut()
            toast.success("Signed out successfully")
        } catch (error) {
            toast.error("Failed to sign out")
        }
    }

    // Show nothing while loading
    if (isPending) {
        return (
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
        )
    }

    // If no session, show login/signup buttons
    if (!session?.user) {
        return (
            <div className="flex items-center gap-4 font-medium">
                <Link
                    href="/login"
                    className="text-sm text-foreground/70 hover:text-cyan-400 transition-colors"
                >
                    Login
                </Link>
                <Link
                    href="/sign-up"
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] px-4 py-2 rounded-lg text-sm transition-all duration-300"
                >
                    Sign Up
                </Link>
            </div>
        )
    }

    // Get user initials for avatar fallback
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative rounded-full ring-2 ring-transparent hover:ring-cyan-400/50 transition-all duration-300 focus:outline-none focus:ring-cyan-400/50">
                    <Avatar className="h-9 w-9 cursor-pointer">
                        <AvatarImage
                            src={session.user.image || undefined}
                            alt={session.user.name || "User avatar"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white text-sm font-medium">
                            {getInitials(session.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {session.user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session.user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
