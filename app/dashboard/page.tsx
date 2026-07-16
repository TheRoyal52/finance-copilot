// app/dashboard/page.tsx
// ============================================================
// DASHBOARD PAGE — Server Component that fetches real data
// ============================================================
//
// WHY IS THIS A SERVER COMPONENT? (no "use client" at the top)
//
// In Next.js App Router, components without "use client" are
// SERVER COMPONENTS by default. They run on the server and:
//
// 1. Can directly call database functions (no API route needed!)
//    → We call getBalance(), getMonthlyCashflow() etc. directly
// 2. Database credentials never reach the browser
//    → The DATABASE_URL is server-only
// 3. No JavaScript is sent for this component
//    → Only the rendered HTML goes to the browser
// 4. No loading state needed for initial render
//    → Data is already there when HTML arrives
//
// The child components (LedgerTrail) are Client Components because
// they need interactivity (animations). Server and Client Components
// can be mixed freely in the same page.
//
// ASYNC SERVER COMPONENTS:
// async/await works directly in Server Components!
// We fetch all data in parallel using Promise.all for performance.
// ============================================================

import {
  getBalance,
  getMonthlyCashflow,
  getCategoryBreakdown,
  getBudgetStatus,
  getRecentTransactions,
  getMonthSummary,
} from "@/lib/data/dashboard";

import BalanceHero from "@/components/dashboard/BalanceHero";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import CategoryBars from "@/components/dashboard/CategoryBars";
import TransactionTable from "@/components/dashboard/TransactionTable";

export const metadata = {
  title: "Dashboard — Finance Copilot",
  description: "Your financial overview, powered by AI.",
};

export default async function DashboardPage() {
  // Fetch ALL data in parallel — Promise.all runs these simultaneously
  // vs. awaiting them one by one which would be sequential (slower)
  //
  // Sequential (bad):  balance → 50ms → cashflow → 50ms → categories → 50ms = 150ms total
  // Parallel (good):   all three run at once = ~50ms total
  const [balance, cashflow, categories, budgets, transactions, monthSummary] =
    await Promise.all([
      getBalance(),
      getMonthlyCashflow(),
      getCategoryBreakdown(),
      getBudgetStatus(),
      getRecentTransactions(),
      getMonthSummary(),
    ]);
  
  return (
    <div className="dashboard-page">
      {/* 
       * Page header — a minimal greeting, not a huge hero section
       * The brief says the balance number IS the hero.
       * Don't add decorative headings above it.
       */}
      <header className="page-header">
        <p className="page-date muted">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>
      
      {/* The big balance number — no card, sits on the page */}
      <BalanceHero balance={balance} monthSummary={monthSummary} />
      
      {/* Thin SVG line chart — no border, no card */}
      <CashFlowChart data={cashflow} />
      
      {/* Horizontal bars — NOT a pie chart */}
      <CategoryBars data={categories} budgets={budgets} />
      
      {/* Dense transaction table — hairline borders, mono numbers */}
      <TransactionTable transactions={transactions} />
      
      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 0;  /* spacing handled by each component's padding */
        }
        
        .page-header {
          margin-bottom: var(--space-6);
        }
        
        .page-date {
          font-size: 0.8125rem;
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}
