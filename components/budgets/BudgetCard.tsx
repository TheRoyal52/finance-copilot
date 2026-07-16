"use client";
// components/budgets/BudgetCard.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBudget } from "@/lib/actions/budgets";

interface BudgetData {
  id: string;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  overBudget: boolean;
  projectedMonthEnd: number;
  month: string;
}

function formatINR(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

export default function BudgetCard({ budget }: { budget: BudgetData }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  const barWidth = `${Math.min(budget.percentage, 100)}%`;
  const barClass = budget.overBudget
    ? "budget-bar--over"
    : budget.percentage >= 80
    ? "budget-bar--warn"
    : "budget-bar--ok";

  async function handleDelete() {
    if (!confirmed) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
      return;
    }
    setIsDeleting(true);
    await deleteBudget(budget.id);
    router.refresh();
  }

  return (
    <article className="budget-card" aria-label={`Budget for ${budget.categoryName}`}>
      {/* Card header */}
      <div className="budget-card-header">
        <h2 className="budget-cat-name">{budget.categoryName}</h2>
        <button
          className={`budget-delete-btn ${confirmed ? "budget-delete-btn--confirm" : ""}`}
          onClick={handleDelete}
          disabled={isDeleting}
          title={confirmed ? "Click again to remove" : "Remove budget"}
        >
          {isDeleting ? "…" : confirmed ? "Remove?" : "×"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="budget-bar-track" role="progressbar" aria-valuenow={budget.percentage} aria-valuemin={0} aria-valuemax={100}>
        <div className={`budget-bar-fill ${barClass}`} style={{ width: barWidth }} />
      </div>

      {/* Spent vs Limit */}
      <div className="budget-amounts">
        <div>
          <p className="label budget-amount-label">Spent</p>
          <p className={`budget-amount-value mono ${budget.overBudget ? "loss" : ""}`}>
            {formatINR(budget.spent)}
          </p>
        </div>
        <div className="budget-amounts-sep">of</div>
        <div>
          <p className="label budget-amount-label">Limit</p>
          <p className="budget-amount-value mono">{formatINR(budget.limit)}</p>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p className="label budget-amount-label">
            {budget.overBudget ? "Over by" : "Remaining"}
          </p>
          <p className={`budget-amount-value mono ${budget.overBudget ? "loss" : "gain"}`}>
            {budget.overBudget
              ? formatINR(budget.spent - budget.limit)
              : formatINR(budget.remaining)}
          </p>
        </div>
      </div>

      {/* Percentage pill + projection */}
      <div className="budget-footer">
        <span className={`budget-pct-pill ${barClass}`}>
          {budget.percentage}% used
        </span>
        {budget.projectedMonthEnd > budget.limit && (
          <span className="budget-projection muted">
            projected {formatINR(budget.projectedMonthEnd)} by month end
          </span>
        )}
      </div>
    </article>
  );
}
