// app/dashboard/layout.tsx
// ============================================================
// DASHBOARD LAYOUT — The two-column shell
// ============================================================
//
// WHAT IS A LAYOUT FILE IN NEXT.JS?
// In Next.js App Router, layout.tsx wraps ALL pages inside its
// folder. So this layout applies to:
//   /dashboard        → uses this layout
//   /dashboard/settings → also uses this layout
//   /dashboard/anything → also uses this layout
//
// The layout renders ONCE and stays mounted as you navigate
// between pages — the sidebar and ledger trail don't unmount/remount.
// Only the {children} part (the actual page content) changes.
//
// This is called "persistent layouts" — it's more efficient than
// re-rendering the whole page on every navigation.
//
// LAYOUT STRUCTURE:
// ┌─────────┬────────────────────────────┬──────────────┐
// │ Sidebar │      Main Content           │ Ledger Trail │
// │  220px  │    (flex: 1, scrollable)    │    320px     │
// │  vault  │    --paper background       │    vault     │
// │  fixed  │                             │    fixed     │
// └─────────┴────────────────────────────┴──────────────┘
// ============================================================

import Sidebar from "@/components/Sidebar";
import LedgerTrail from "@/components/dashboard/LedgerTrail";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      {/* Left: Navigation sidebar */}
      <Sidebar />
      
      {/* Center: Page content (this is where page.tsx renders) */}
      <main className="main-content" id="main-content">
        {/* 
         * id="main-content" is used for "Skip to main content" links
         * (accessibility feature for keyboard/screen reader users)
         */}
        <div className="content-inner">
          {children}
        </div>
      </main>
      
      {/* Right: Ledger Trail (always visible, not a popup) */}
      <LedgerTrail />
      
      <style jsx global>{`
        /* 
         * The app shell grid
         * sidebar (fixed) | main (scrollable) | trail (fixed)
         *
         * WHY margin-left and margin-right instead of grid?
         * The sidebar and trail are position: fixed (they don't scroll).
         * So the main content needs margin to not go under them.
         */
        .app-shell {
          min-height: 100vh;
          background: var(--paper);
        }
        
        .main-content {
          /* Push content right to clear the fixed sidebar */
          margin-left: var(--sidebar-width);
          /* Push content left to clear the fixed trail */
          margin-right: var(--trail-width);
          min-height: 100vh;
          padding: var(--space-10) var(--space-8);
        }
        
        .content-inner {
          max-width: var(--content-max);
          margin: 0 auto;
        }
        
        /* 
         * RESPONSIVE — tablet and mobile
         * The two-column layout needs a decision:
         * We chose: sidebar collapses, trail hides (bottom sheet in future sprint)
         * This is the "tradeoff we chose deliberately" the brief mentions.
         */
        @media (max-width: 1100px) {
          .main-content {
            margin-right: 0;
          }
        }
        
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: var(--space-5) var(--space-4);
          }
        }
      `}</style>
    </div>
  );
}
