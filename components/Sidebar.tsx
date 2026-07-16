"use client";
// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
//
// WHY "use client" HERE?
// The sidebar needs to know WHICH route you're currently on
// so it can highlight the active nav item with --brass color.
// usePathname() is a hook from next/navigation — hooks only
// work in Client Components ("use client").
//
// This is a key Next.js pattern:
//   - Data fetching → Server Component (no "use client")
//   - Interactivity, hooks, browser APIs → Client Component ("use client")
//
// The sidebar itself doesn't fetch data — it just renders links
// and checks the current path. So "use client" is correct here.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

// Navigation items — each has a path, label, and icon
// We're using simple text/emoji icons to keep dependencies minimal
// In a real product you'd use a library like lucide-react
const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: "◈" },
  { href: "/transactions", label: "Transactions", icon: "≡" },
  { href: "/budgets",      label: "Budgets",      icon: "▣" },
  { href: "/goals",        label: "Goals",        icon: "◎" },
  { href: "/settings",     label: "Settings",     icon: "⚙" },
];

export default function Sidebar() {
  // usePathname() returns the current URL path e.g. "/dashboard"
  const pathname = usePathname();
  
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-logo">⬡</span>
        <span className="sidebar-name">Ledger</span>
      </div>
      
      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          // Is this the current page?
          // startsWith handles /dashboard/settings being active when on /dashboard
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "nav-item--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              // aria-current="page" is an accessibility attribute that
              // tells screen readers "this is the current page"
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
              
              {/* Active indicator — a thin brass line on the left */}
              {isActive && <span className="nav-active-bar" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>
      
      {/* User account at bottom */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          {/* 
           * UserButton is a Clerk component — it shows the user's
           * avatar and clicking it opens account management.
           * It automatically knows who's logged in from the session.
           */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "sidebar-avatar",
              },
            }}
          />
          <span className="sidebar-user-label muted">Account</span>
        </div>
      </div>
      
      <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          min-height: 100vh;
          background: var(--vault);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 10;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-6) var(--space-5);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        
        .sidebar-logo {
          color: var(--brass);
          font-size: 1.25rem;
          line-height: 1;
        }
        
        .sidebar-name {
          font-family: var(--font-display);
          font-size: 1.0625rem;
          font-weight: 600;
          color: white;
          letter-spacing: -0.01em;
        }
        
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: var(--space-4) var(--space-3);
        }
        
        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: 4px;
          color: rgba(255,255,255,0.55);
          font-size: 0.875rem;
          font-weight: 400;
          transition: color var(--transition-fast), background var(--transition-fast);
          text-decoration: none;
        }
        
        .nav-item:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.05);
        }
        
        .nav-item--active {
          color: white;
          background: rgba(176, 141, 87, 0.12);  /* brass at 12% opacity */
        }
        
        .nav-icon {
          font-size: 0.875rem;
          width: 18px;
          text-align: center;
          flex-shrink: 0;
        }
        
        .nav-label {
          flex: 1;
        }
        
        /* The brass left-border indicator for active item */
        .nav-active-bar {
          position: absolute;
          left: -var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 60%;
          background: var(--brass);
          border-radius: 1px;
          left: 0;
        }
        
        .sidebar-footer {
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        
        .sidebar-user-label {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.4);
        }
        
        /* Override Clerk's avatar size */
        :global(.sidebar-avatar) {
          width: 28px !important;
          height: 28px !important;
        }
      `}</style>
    </aside>
  );
}
