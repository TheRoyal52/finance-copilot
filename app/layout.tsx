// app/layout.tsx — Root layout (wraps EVERYTHING)
//
// WHY IS THIS THE ROOT LAYOUT?
// In Next.js App Router, app/layout.tsx is the outermost shell.
// It wraps every single page in the app. It renders the <html>
// and <body> tags — no other file should do this.
//
// WHY CLERKPROVIDER HERE?
// Clerk's auth state needs to be available everywhere — dashboard,
// sign-in page, API routes. Putting it at the root means every
// child component can call useAuth(), useUser(), auth() etc.
// It's like Redux Provider — must wrap everything.
//
// WHY NOT LOAD FONTS FROM next/font HERE?
// We load fonts via Google Fonts @import in globals.css instead.
// This gives us more control (italic optical sizes for Fraunces).
// next/font would require font definitions here which couples the
// font choices to this layout file.

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    // Template: child pages can set just "Dashboard" and it becomes
    // "Dashboard — Finpilot" automatically
    template: "%s — Finpilot",
    default: "Finpilot — AI-Powered Finance Copilot",
  },
  description:
    "Track spending, set budgets, and get AI-powered financial insights. Your ledger that talks back.",
  keywords: ["personal finance", "budget tracker", "AI finance", "expense tracker"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}