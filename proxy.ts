import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ============================================================
// CLERK MIDDLEWARE — Authentication Guard
// ============================================================
//
// HOW MIDDLEWARE WORKS IN NEXT.JS:
// Every request passes through this file BEFORE any page renders.
// It's executed at the Edge (Cloudflare Workers runtime) — meaning
// it runs globally, extremely fast, with no cold starts.
//
// WHY PROTECT AT MIDDLEWARE LEVEL?
// Even if you hide the "Dashboard" button from unauthenticated
// users in your UI, a user could directly type /dashboard in the
// URL bar. Middleware runs BEFORE the page, so it can redirect
// them to sign-in before any data is fetched or rendered.
//
// ROUTE MATCHING:
// createRouteMatcher defines which URLs need auth.
// Routes NOT listed here are public (sign-in, sign-up, homepage).
//
// CLERK'S AUTH MODEL:
// auth().protect() → redirects to Clerk's hosted sign-in page
// The signed-in user's ID is then available everywhere via:
//   - Server Components: const { userId } = await auth()
//   - Client Components: const { userId } = useAuth()
// ============================================================

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/transactions(.*)",
  "/budgets(.*)",
  "/goals(.*)",
  "/settings(.*)",
  "/api/chat(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // If user is not signed in, redirect to /sign-in
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
