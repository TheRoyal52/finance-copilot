// app/dashboard/layout.tsx
// Three-panel shell — Server Component (no data, just structure)
import Sidebar from "@/components/Sidebar";
import LedgerTrail from "@/components/dashboard/LedgerTrail";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content" id="main-content">
        <div className="content-inner">
          {children}
        </div>
      </main>
      <LedgerTrail />
    </div>
  );
}
