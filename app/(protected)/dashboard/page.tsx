// app/dashboard/page.tsx — Async Server Component, fetches real DB data
import {
  getBalance, getMonthlyCashflow, getCategoryBreakdown,
  getBudgetStatus, getRecentTransactions, getMonthSummary,
} from "@/lib/data/dashboard";
import BalanceHero from "@/components/dashboard/BalanceHero";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import CategoryBars from "@/components/dashboard/CategoryBars";
import TransactionTable from "@/components/dashboard/TransactionTable";

export const metadata = {
  title: "Dashboard — Finpilot",
  description: "Your financial overview, powered by AI.",
};

export default async function DashboardPage() {
  // Fetch all data in parallel — much faster than sequential awaits
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
      <header className="page-header">
        <p className="page-date muted">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </header>

      <BalanceHero balance={balance} monthSummary={monthSummary} />
      <CashFlowChart data={cashflow} />
      <CategoryBars data={categories} budgets={budgets} />
      <TransactionTable transactions={transactions} />
    </div>
  );
}
