"use client";
// components/goals/AddGoalForm.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGoal } from "@/lib/actions/goals";

export default function AddGoalForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [isOpen, setIsOpen]       = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createGoal(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setIsOpen(false);
      (e.target as HTMLFormElement).reset();
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    }
    setIsPending(false);
  }

  if (!isOpen) {
    return (
      <button className="add-tx-btn goal-add-new-btn" onClick={() => setIsOpen(true)}>
        <span>+</span>
        <span>{success ? "✓ Goal Added!" : "New Goal"}</span>
      </button>
    );
  }

  return (
    <section className="add-budget-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="add-budget-title label">New Savings Goal</h2>
        <button className="drawer-close" onClick={() => setIsOpen(false)}>×</button>
      </div>

      <form className="add-goal-form" onSubmit={handleSubmit} noValidate>
        {/* Goal name */}
        <div className="field-group">
          <label htmlFor="goal-name" className="field-label label">Goal Name</label>
          <input
            id="goal-name"
            name="name"
            type="text"
            placeholder="e.g. MacBook Pro, Emergency Fund, Goa Trip"
            className="field-input"
            required
          />
        </div>

        <div className="add-goal-row">
          {/* Target amount */}
          <div className="field-group" style={{ flex: 1 }}>
            <label htmlFor="goal-target" className="field-label label">Target Amount (₹)</label>
            <div className="amount-input-wrapper">
              <span className="amount-currency">₹</span>
              <input
                id="goal-target"
                name="targetAmount"
                type="number"
                min="1"
                placeholder="50000"
                className="field-input amount-input mono"
                required
              />
            </div>
          </div>

          {/* Already saved */}
          <div className="field-group" style={{ flex: 1 }}>
            <label htmlFor="goal-current" className="field-label label">Already Saved (₹)</label>
            <div className="amount-input-wrapper">
              <span className="amount-currency">₹</span>
              <input
                id="goal-current"
                name="currentAmount"
                type="number"
                min="0"
                placeholder="0"
                className="field-input amount-input mono"
              />
            </div>
          </div>
        </div>

        {/* Target date */}
        <div className="field-group">
          <label htmlFor="goal-date" className="field-label label">Target Date (optional)</label>
          <input
            id="goal-date"
            name="targetDate"
            type="date"
            className="field-input"
          />
        </div>

        {error && <p className="form-error" role="alert">⚠ {error}</p>}


        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" className="form-submit" style={{ marginTop: 0 }} disabled={isPending}>
            {isPending ? "Creating…" : "Create Goal →"}
          </button>
          <button
            type="button"
            className="form-submit"
            style={{ marginTop: 0, background: "transparent", color: "var(--ink-muted)", border: "1px solid var(--hairline)" }}
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
