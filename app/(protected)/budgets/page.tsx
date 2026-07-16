// app/(protected)/budgets/page.tsx — Server Component
import { Suspense } from "react";
import {
  getBudgetsWithSpending,
  getBudgetSummary,
  getCategoriesForBudget,
} from "@/lib/data/budgets";
import BudgetCard from "@/components/budgets/BudgetCard";
import AddBudgetForm from "@/components/budgets/AddBudgetForm";

export const metadata = {
  title: "Budgets",
  description: "Set monthly spending limits and track progress",
};

function formatINR(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

function getCurrentMonthLabel() {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default async function BudgetsPage() {
  const [budgets, summary, categories] = await Promise.all([
    getBudgetsWithSpending(),
    getBudgetSummary(),
    getCategoriesForBudget(),
  ]);

  const safeWidth = (pct: number) => `${Math.min(pct, 100)}%`;

  return (
    <div className="budgets-page">

      {/* ── Page header ─────────────────────────────── */}
      <header className="budgets-header">
        <div>
          <p className="label">{getCurrentMonthLabel()}</p>
          <h1 className="budgets-title display">Budgets</h1>
        </div>

        {/* Month-level summary bar */}
        {budgets.length > 0 && (
          <div className="budget-month-summary">
            <div className="bms-stats">
              <div className="bms-stat">
                <span className="label bms-label">Total Budgeted</span>
                <span className="bms-value mono">{formatINR(summary.totalLimit)}</span>
              </div>
              <div className="bms-divider" />
              <div className="bms-stat">
                <span className="label bms-label">Spent</span>
                <span className={`bms-value mono ${summary.utilizationPercent > 90 ? "loss" : "gain"}`}>
                  {formatINR(summary.totalSpent)}
                </span>
              </div>
              <div className="bms-divider" />
              <div className="bms-stat">
                <span className="label bms-label">Remaining</span>
                <span className="bms-value mono">{formatINR(summary.totalRemaining)}</span>
              </div>
              {summary.overBudgetCount > 0 && (
                <>
                  <div className="bms-divider" />
                  <div className="bms-stat">
                    <span className="label bms-label">Over Budget</span>
                    <span className="bms-value mono loss">
                      {summary.overBudgetCount} categor{summary.overBudgetCount === 1 ? "y" : "ies"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Overall utilisation progress bar */}
            <div className="bms-bar-wrap">
              <div
                className={`bms-bar-fill ${summary.utilizationPercent >= 100 ? "bms-bar--over" : summary.utilizationPercent >= 80 ? "bms-bar--warn" : "bms-bar--ok"}`}
                style={{ width: safeWidth(summary.utilizationPercent) }}
                role="progressbar"
                aria-valuenow={summary.utilizationPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="bms-label-pct muted mono">
              {summary.utilizationPercent}% of total budget used
            </p>
          </div>
        )}
      </header>

      {/* ── Add Budget form ─────────────────────────── */}
      <Suspense fallback={null}>
        <AddBudgetForm categories={categories} />
      </Suspense>

      {/* ── Budget cards grid ───────────────────────── */}
      {budgets.length === 0 ? (
        <div className="budgets-empty">
          <p className="budgets-empty-icon">▣</p>
          <p className="budgets-empty-title">No budgets yet</p>
          <p className="muted">Set a monthly limit for any expense category above</p>
        </div>
      ) : (
        <div className="budgets-grid">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      )}

      {/* ── Interview learning note ─────────────────── */}
      {/* This is the "projected end-of-month" algorithm we built.
          It calculates: dailyBurnRate = spentSoFar / daysElapsed
          then: projection = dailyBurnRate * totalDaysInMonth
          Simple but effective — worth explaining in interviews! */}
    </div>
  );
}
