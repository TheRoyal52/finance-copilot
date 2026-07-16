"use client";
// components/budgets/AddBudgetForm.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertBudget } from "@/lib/actions/budgets";

interface Category {
  id: string;
  name: string;
}

export default function AddBudgetForm({ categories }: { categories: Category[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await upsertBudget(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    }
    setIsPending(false);
  }

  return (
    <section className="add-budget-section">
      <h2 className="add-budget-title label">Set Monthly Limit</h2>
      <form className="add-budget-form" onSubmit={handleSubmit} noValidate>
        {/* Category selector */}
        <div className="add-budget-field">
          <label htmlFor="budget-category" className="field-label label">Category</label>
          <select id="budget-category" name="categoryId" className="field-input field-select" required>
            <option value="">Choose category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Monthly limit */}
        <div className="add-budget-field">
          <label htmlFor="budget-limit" className="field-label label">Monthly Limit (₹)</label>
          <div className="amount-input-wrapper">
            <span className="amount-currency" aria-hidden="true">₹</span>
            <input
              id="budget-limit"
              name="limit"
              type="number"
              min="1"
              step="100"
              placeholder="5000"
              className="field-input amount-input mono"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`form-submit add-budget-submit ${isPending ? "form-submit--loading" : ""}`}
          disabled={isPending}
        >
          {isPending ? "Saving…" : success ? "✓ Saved!" : "Set Budget"}
        </button>

        {error && (
          <p className="form-error" role="alert">⚠ {error}</p>
        )}
      </form>
      <p className="add-budget-hint muted">
        Setting a limit for an existing category updates it (upsert).
      </p>
    </section>
  );
}
