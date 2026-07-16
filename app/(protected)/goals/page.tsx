// app/(protected)/goals/page.tsx — Server Component
import { Suspense } from "react";
import { getGoals, getGoalsSummary } from "@/lib/data/goals";
import GoalCard from "@/components/goals/GoalCard";
import AddGoalForm from "@/components/goals/AddGoalForm";

export const metadata = {
  title: "Goals",
  description: "Track your savings goals and progress",
};

function formatINR(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

export default async function GoalsPage() {
  const [goals, summary] = await Promise.all([getGoals(), getGoalsSummary()]);

  const overallPct = summary.totalTargetAmount > 0
    ? Math.round((summary.totalSaved / summary.totalTargetAmount) * 100)
    : 0;

  return (
    <div className="goals-page">
      {/* ── Header ─────────────────────────────────── */}
      <header className="goals-header">
        <div className="goals-header-top">
          <div>
            <p className="label">Savings Goals</p>
            <h1 className="goals-title display">Goals</h1>
          </div>
          <Suspense fallback={null}>
            <AddGoalForm />
          </Suspense>
        </div>

        {/* Summary strip */}
        {goals.length > 0 && (
          <div className="goals-summary">
            <div className="bms-stats">
              <div className="bms-stat">
                <span className="label bms-label">Total Goals</span>
                <span className="bms-value mono">{summary.total}</span>
              </div>
              <div className="bms-divider" />
              <div className="bms-stat">
                <span className="label bms-label">Completed</span>
                <span className="bms-value mono gain">{summary.completed}</span>
              </div>
              <div className="bms-divider" />
              <div className="bms-stat">
                <span className="label bms-label">Total Saved</span>
                <span className="bms-value mono">{formatINR(summary.totalSaved)}</span>
              </div>
              <div className="bms-divider" />
              <div className="bms-stat">
                <span className="label bms-label">Total Target</span>
                <span className="bms-value mono">{formatINR(summary.totalTargetAmount)}</span>
              </div>
            </div>

            {/* Overall savings progress */}
            <div className="bms-bar-wrap">
              <div
                className="bms-bar-fill bms-bar--ok"
                style={{ width: `${Math.min(overallPct, 100)}%` }}
              />
            </div>
            <p className="bms-label-pct muted mono">
              {overallPct}% of total savings targets reached
            </p>
          </div>
        )}
      </header>

      {/* ── Goals grid ─────────────────────────────── */}
      {goals.length === 0 ? (
        <div className="budgets-empty">
          <p className="budgets-empty-icon">◎</p>
          <p className="budgets-empty-title">No goals yet</p>
          <p className="muted">Create your first savings goal using the button above</p>
        </div>
      ) : (
        <>
          {/* In-progress goals first */}
          {goals.filter((g) => !g.isComplete).length > 0 && (
            <div>
              <p className="goals-section-label label">In Progress</p>
              <div className="goals-grid">
                {goals.filter((g) => !g.isComplete).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}

          {/* Completed goals */}
          {goals.filter((g) => g.isComplete).length > 0 && (
            <div>
              <p className="goals-section-label label">Completed 🎉</p>
              <div className="goals-grid">
                {goals.filter((g) => g.isComplete).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
