"use client";
// components/goals/GoalCard.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSavingsToGoal, deleteGoal } from "@/lib/actions/goals";

interface GoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percentage: number;
  isComplete: boolean;
  deadline: Date | null;
  daysLeft: number | null;
  dailyNeeded: number | null;
}

function formatINR(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function GoalCard({ goal }: { goal: GoalData }) {
  const [addAmount, setAddAmount]   = useState("");
  const [showAdd, setShowAdd]       = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmed, setConfirmed]   = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const router = useRouter();

  async function handleAddSavings() {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      setSaveError("Enter a valid amount.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const result = await addSavingsToGoal(goal.id, amount);
    if (result.error) {
      setSaveError(result.error);
    } else {
      setAddAmount("");
      setShowAdd(false);
      router.refresh();
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    if (!confirmed) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
      return;
    }
    setIsDeleting(true);
    await deleteGoal(goal.id);
    router.refresh();
  }

  const barColor = goal.isComplete
    ? "goal-bar--complete"
    : goal.percentage >= 75
    ? "goal-bar--near"
    : "goal-bar--progress";

  return (
    <article className={`goal-card ${goal.isComplete ? "goal-card--complete" : ""}`}>
      {/* Header */}
      <div className="goal-card-header">
        <div className="goal-card-title-row">
          {goal.isComplete && <span className="goal-complete-badge">✓ Complete</span>}
          <h2 className="goal-name">{goal.name}</h2>
        </div>
        <button
          className={`budget-delete-btn ${confirmed ? "budget-delete-btn--confirm" : ""}`}
          onClick={handleDelete}
          disabled={isDeleting}
          title={confirmed ? "Click again to delete" : "Delete goal"}
        >
          {isDeleting ? "…" : confirmed ? "Delete?" : "×"}
        </button>
      </div>

      {goal.deadline && (
        <p className="goal-description muted">Due: {formatDate(goal.deadline)}</p>
      )}

      {/* Progress bar */}
      <div className="goal-bar-track">
        <div
          className={`goal-bar-fill ${barColor}`}
          style={{ width: `${Math.min(goal.percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={goal.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Amounts */}
      <div className="goal-amounts">
        <div>
          <p className="label goal-amount-label">Saved</p>
          <p className="goal-amount-value mono gain">{formatINR(goal.currentAmount)}</p>
        </div>
        <div className="budget-amounts-sep">of</div>
        <div>
          <p className="label goal-amount-label">Target</p>
          <p className="goal-amount-value mono">{formatINR(goal.targetAmount)}</p>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p className="label goal-amount-label">Remaining</p>
          <p className="goal-amount-value mono">{formatINR(goal.remaining)}</p>
        </div>
      </div>

      {/* Footer: deadline + daily needed */}
      <div className="goal-footer">
        {goal.deadline && (
          <div className="goal-deadline">
            <span className="label">Deadline</span>
            <span className="mono goal-deadline-val">
              {formatDate(goal.deadline)}
              {goal.daysLeft !== null && !goal.isComplete && (
                <span className={`goal-days-left ${goal.daysLeft <= 30 ? "loss" : "muted"}`}>
                  {" "}({goal.daysLeft}d left)
                </span>
              )}
            </span>
          </div>
        )}
        {goal.dailyNeeded !== null && (
          <span className="goal-daily-needed muted">
            save {formatINR(goal.dailyNeeded)}/day to reach goal
          </span>
        )}
      </div>

      {/* Add savings inline */}
      {!goal.isComplete && (
        <div className="goal-add-savings">
          {showAdd ? (
            <div className="goal-add-row">
              <div className="amount-input-wrapper" style={{ flex: 1 }}>
                <span className="amount-currency">₹</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Amount"
                  className="field-input amount-input mono"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                className="goal-save-btn"
                onClick={handleAddSavings}
                disabled={isSaving}
              >
                {isSaving ? "…" : "Add"}
              </button>
              <button
                className="goal-cancel-btn"
                onClick={() => { setShowAdd(false); setSaveError(null); }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button className="goal-add-btn" onClick={() => setShowAdd(true)}>
              + Add Savings
            </button>
          )}
          {saveError && <p className="form-error" style={{ marginTop: "8px" }}>{saveError}</p>}
        </div>
      )}
    </article>
  );
}
