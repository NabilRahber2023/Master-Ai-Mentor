import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Session cookie names - production uses __Secure- prefix
const SESSION_COOKIE_DEV = "better-auth.session_token";
const SESSION_COOKIE_PROD = "__Secure-better-auth.session_token";

// Organization cookie - set after login to track active org
const ORG_COOKIE = "active-org-slug";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "intellector.daffodilglobal.ai";

// Helper to get session token from cookies
function getSessionToken(request: NextRequest): string | undefined {
    return (
        request.cookies.get(SESSION_COOKIE_PROD)?.value ||
        request.cookies.get(SESSION_COOKIE_DEV)?.value
    );
}

// Helper to get active organization slug from cookie
function getActiveOrgSlug(request: NextRequest): string | undefined {
    return request.cookies.get(ORG_COOKIE)?.value;
}

// Auth routes that should be accessible without login
const AUTH_ROUTES = ["/login", "/sign-up", "/register", "/forgot-password", "/reset-password"];

// Public routes accessible without login (landing pages)
const PUBLIC_ROUTES = ["/", "/pricing", "/about", "/contact", "/terms", "/privacy"];

// Known non-tenant path prefixes — excluded from the tenant /:slug/* guard
const EXCLUDED_PATH_PREFIXES = [
    "/dashboard",
    "/login",
    "/sign-up",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/pricing",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/api",
    "/_next",
];

// Build full URL for redirects
function buildFullUrl(request: NextRequest, path: string): URL {
    if (IS_PRODUCTION) {
        return new URL(`https://${ROOT_DOMAIN}${path}`);
    }
    return new URL(path, request.url);
}

export function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const origin = request.headers.get("origin");

    // === SKIP STATIC FILES AND NEXT INTERNALS ===
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // === CORS HANDLING FOR API ROUTES ===
    if (pathname.startsWith("/api")) {
        const allowedOrigins = [
            "http://localhost:3000",
            `https://${ROOT_DOMAIN}`,
        ];

        if (request.method === "OPTIONS") {
            const response = new NextResponse(null, { status: 204 });
            if (origin && allowedOrigins.includes(origin)) {
                response.headers.set("Access-Control-Allow-Origin", origin);
            }
            response.headers.set("Access-Control-Allow-Credentials", "true");
            response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return response;
        }

        const response = NextResponse.next();
        if (origin && allowedOrigins.includes(origin)) {
            response.headers.set("Access-Control-Allow-Origin", origin);
        }
        response.headers.set("Access-Control-Allow-Credentials", "true");
        return response;
    }

    const token = getSessionToken(request);
    const activeOrgSlug = getActiveOrgSlug(request);
    const isAuthRoute = AUTH_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // === AUTH ROUTES (e.g., /login, /sign-up) ===
    if (isAuthRoute) {
        // Redirect logged-in users with an active org to their tenant home
        if (token && activeOrgSlug) {
            return NextResponse.redirect(
                buildFullUrl(request, `/${activeOrgSlug}/home`)
            );
        }
        return NextResponse.next();
    }

    // === PUBLIC ROUTES (landing pages) ===
    if (isPublicRoute) {
        // Redirect authenticated users with an active org to their tenant home
        if (token && activeOrgSlug) {
            return NextResponse.redirect(
                buildFullUrl(request, `/${activeOrgSlug}/home`)
            );
        }
        return NextResponse.next();
    }

    // === ADMIN DASHBOARD ===
    if (pathname.startsWith("/dashboard")) {
        if (!token) {
            return NextResponse.redirect(buildFullUrl(request, "/login"));
        }
        return NextResponse.next();
    }

    // === TENANT ROUTES: /:slug/* ===
    // Extract slug from path: /diu/home → potentialSlug = "diu"
    const pathParts = pathname.split("/").filter(Boolean);
    const potentialSlug = pathParts[0];

    // Check it's not one of our known non-tenant paths
    const isExcluded = EXCLUDED_PATH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (potentialSlug && !isExcluded) {
        // This looks like a tenant route (/:slug/...)
        if (!token) {
            // Not logged in → send to login, preserving intended destination
            const loginUrl = buildFullUrl(request, `/login`);
            loginUrl.searchParams.set("next", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Inject the slug as a header (convenience for any server code that needs it)
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-tenant-slug", potentialSlug);

        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    }

    // Default - allow
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
