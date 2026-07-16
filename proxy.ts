import { clerkMiddleware } from "@clerk/nextjs/server";

// ============================================================
// CLERK MIDDLEWARE — Authentication Guard
// ============================================================
//
// WHAT THIS FILE DOES:
// Every single request that hits your Next.js app passes through
// this file FIRST, before any page renders. It's like a security
// guard at the door.
//
// CURRENT STATUS: Temporarily using clerkMiddleware() with no
// protections so you can see the dashboard UI during clock sync.
// We'll add auth.protect() back in the layout after clock is fixed.
//
// WHY THE CLOCK MATTERS FOR CLERK:
// Clerk uses JWT tokens (JSON Web Tokens) for authentication.
// A JWT has an "exp" field — expiry timestamp. If your system
// clock is wrong, Clerk thinks the token already expired even
// when you just logged in. Fix: Settings → Time & Language →
// Date & time → "Sync now"
//
// NOTE: Deprecation warning about createRouteMatcher → Clerk v6
// recommends moving auth checks to each page/layout instead of
// middleware route matching. We'll do that in the next step.
// ============================================================

// clerkMiddleware() with no arguments still sets up the Clerk
// session context (makes auth() available in Server Components)
// but doesn't enforce any route protection itself.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Required for Clerk proxy
    "/__clerk/:path*",
  ],
};
