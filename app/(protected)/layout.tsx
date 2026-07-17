// app/(protected)/layout.tsx — Three-panel shell
// CopilotPanel is a Client Component (uses useChat hook)
// It renders as a floating button on every protected page
import Sidebar from "@/components/Sidebar";
import LedgerTrail from "@/components/dashboard/LedgerTrail";
import CopilotPanel from "@/components/copilot/CopilotPanel";

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

      {/* Finpilot AI — floating on every protected page */}
      <CopilotPanel />
    </div>
  );
}
