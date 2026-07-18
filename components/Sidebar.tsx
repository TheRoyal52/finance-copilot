"use client";
// components/Sidebar.tsx — Client Component (needs usePathname hook)

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: "◈" },
  { href: "/transactions", label: "Transactions", icon: "≡" },
  { href: "/budgets",      label: "Budgets",      icon: "▣" },
  { href: "/goals",        label: "Goals",        icon: "◎" },
  { href: "/settings",     label: "Settings",     icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">
        <span className="sidebar-logo">✦</span>
        <span className="sidebar-name">Finpilot</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive ? " nav-item--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              prefetch={true}
            >
              {isActive && <span className="nav-active-bar" aria-hidden="true" />}
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User account section — click the avatar to get sign out */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "sidebar-avatar",
              },
            }}
          />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {user?.firstName ?? "Account"}
            </span>
            <span className="sidebar-user-hint">manage account</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
