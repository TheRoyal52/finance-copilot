import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are PROTECTED (require login)
// All other routes are PUBLIC by default
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",      // dashboard and all sub-pages
  "/transactions(.*)",   // transactions pages
  "/budgets(.*)",        // budgets pages
  "/goals(.*)",          // goals pages
  "/settings(.*)",       // settings pages
]);

export default clerkMiddleware(async (auth, req) => {
  // If the user tries to access a protected route while not logged in,
  // Clerk automatically redirects them to /sign-in
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

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
